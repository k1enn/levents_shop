import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, get, isCondFail, now, queryPk, TABLE } from "./db.server";
import { UserError } from "./errors";

export type Coupon = {
  code: string; // uppercase, unique, also the SK
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  startsAt: string;
  endsAt: string;
  usageLimit: number;
  used: number;
  active: boolean;
};

const COUPON = "COUPON";

export function discountFor(c: Coupon, items: number) {
  const raw = c.type === "percent" ? Math.round((items * c.value) / 100) : c.value;
  return Math.min(items, c.maxDiscount ? Math.min(raw, c.maxDiscount) : raw);
}

// Read check with clear reasons. The claim itself is couponClaim, inside the order transaction.
export async function checkCoupon(code: string, items: number) {
  const t = now();
  const c = await get<Coupon>(COUPON, code.toUpperCase());
  if (!c || !c.active) throw new UserError("Mã giảm giá không tồn tại.");
  if (t < c.startsAt || t > c.endsAt) throw new UserError("Mã giảm giá đã hết hạn.");
  if (items < c.minOrder) throw new UserError(`Đơn tối thiểu ${c.minOrder.toLocaleString("vi-VN")}đ để dùng mã này.`);
  if (c.used >= c.usageLimit) throw new UserError("Mã giảm giá đã hết lượt dùng.");
  return { code: c.code, discount: discountFor(c, items) };
}

// Transaction items: claim 1 use (conditional), or give 1 back.
export const couponClaim = (code: string) => ({
  Update: {
    TableName: TABLE,
    Key: { PK: COUPON, SK: code },
    UpdateExpression: "ADD #u :one",
    ConditionExpression: "#a = :t AND #u < #l AND #s <= :now AND #e >= :now",
    ExpressionAttributeNames: { "#u": "used", "#a": "active", "#l": "usageLimit", "#s": "startsAt", "#e": "endsAt" },
    ExpressionAttributeValues: { ":one": 1, ":t": true, ":now": now() },
  },
});
// Only runs once per order (the cancel is conditional on status), so used stays >= 0.
export const couponRelease = (code: string) => ({
  Update: { TableName: TABLE, Key: { PK: COUPON, SK: code }, UpdateExpression: "ADD #u :m", ExpressionAttributeNames: { "#u": "used" }, ExpressionAttributeValues: { ":m": -1 } },
});

export const listCoupons = async () => (await queryPk<Coupon>(COUPON)).sort((a, b) => b.endsAt.localeCompare(a.endsAt));

// false when the code exists.
export async function createCoupon(c: Coupon) {
  try {
    await ddb.send(new PutCommand({ TableName: TABLE, Item: { PK: COUPON, SK: c.code, ...c }, ConditionExpression: "attribute_not_exists(SK)" }));
    return true;
  } catch (e) {
    if (isCondFail(e)) return false;
    throw e;
  }
}

// Conditional on the value read, so 2 quick clicks do not flip it back.
export async function toggleCoupon(code: string) {
  const c = await get<Coupon>(COUPON, code);
  if (!c) return;
  await ddb
    .send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { PK: COUPON, SK: code },
        UpdateExpression: "SET #a = :new",
        ConditionExpression: "#a = :old",
        ExpressionAttributeNames: { "#a": "active" },
        ExpressionAttributeValues: { ":new": !c.active, ":old": c.active },
      }),
    )
    .catch((e) => {
      if (!isCondFail(e)) throw e;
    });
}
