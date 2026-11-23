import { QueryCommand, TransactWriteCommand, UpdateCommand, type QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { batchGet, cancelCodes, ddb, get, isCondFail, now, queryAll, TABLE } from "./db.server";
import { getProducts, invalidateCatalog, PRODUCT } from "./products.server";
import { itemsTotal, resolveCart, type ResolvedLine } from "./cart.server";
import { checkCoupon, couponClaim, couponRelease } from "./coupons.server";
import { UserError } from "./errors";
import type { CartLine } from "./session.server";
import { nextStatuses, SHIPPING_FEE, type PaymentMethod, type Status } from "./shop";

export type OrderItem = {
  productId: string;
  slug: string;
  sku: string;
  name: string;
  color: string;
  storage: number;
  price: number;
  qty: number;
  image: string;
  imeis?: string[];
};
export type Shipping = { fullName: string; phone: string; province: string; district: string; ward: string; address: string };
export type Order = {
  _id: string;
  code: string;
  userId: string;
  items: OrderItem[];
  shipping: Shipping;
  paymentMethod: PaymentMethod;
  status: Status;
  statusHistory: { status: Status; at: string }[];
  totals: { items: number; shipping: number; discount: number; total: number };
  couponCode?: string;
  paymentRef?: string;
  paidAt?: string;
  createdAt: string;
};

export const orderKey = (code: string) => ({ PK: `ORDER#${code}`, SK: "-" });
export const getOrder = (code: string) => get<Order>(`ORDER#${code}`, "-");
const imeiKey = (imei: string) => ({ PK: `IMEI#${imei}`, SK: "-" });

const newCode = () => [...crypto.getRandomValues(new Uint8Array(8))].map((b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");

// 1 Update per product: every SKU of it in 1 expression (a transaction may not touch 1 item twice).
// Variant paths are by index; the sku condition makes a concurrent admin reorder fail safe.
function stockUpdate(productId: string, lines: { idx: number; sku: string; qty: number }[], sign: 1 | -1) {
  const values: Record<string, unknown> = {};
  const sets: string[] = [];
  const conds = ["attribute_exists(PK)"];
  lines.forEach((l, n) => {
    const v = `#v[${l.idx}]`;
    sets.push(`${v}.#st = ${v}.#st ${sign < 0 ? "-" : "+"} :q${n}`);
    conds.push(`${v}.#k = :s${n}`);
    if (sign < 0) conds.push(`${v}.#st >= :q${n}`);
    values[`:q${n}`] = l.qty;
    values[`:s${n}`] = l.sku;
  });
  if (sign < 0) {
    conds.push("#a = :t");
    values[":t"] = true;
  }
  return {
    Update: {
      TableName: TABLE,
      Key: { PK: PRODUCT, SK: productId },
      UpdateExpression: `SET ${sets.join(", ")}`,
      ConditionExpression: conds.join(" AND "),
      ExpressionAttributeNames: { "#v": "variants", "#st": "stock", "#k": "sku", ...(sign < 0 && { "#a": "isActive" }) },
      ExpressionAttributeValues: values,
    },
  };
}

// The critical step. Prices from the DB; stock, coupon and order written in 1 transaction.
export async function placeOrder(input: { userId: string; cart: CartLine[]; shipping: Shipping; paymentMethod: PaymentMethod; couponCode?: string }) {
  const lines = await resolveCart(input.cart);
  if (!lines.length) throw new UserError("Giỏ hàng trống.");
  const items = itemsTotal(lines);
  const coupon = input.couponCode ? await checkCoupon(input.couponCode, items) : undefined;
  const discount = coupon?.discount ?? 0;
  const groups = [...lines.reduce((m, l) => m.set(l.productId, [...(m.get(l.productId) ?? []), l]), new Map<string, ResolvedLine[]>())];
  const soldOut = (ls: ResolvedLine[]) => {
    const l = ls.find((x) => x.stock < x.qty) ?? ls[0];
    return new UserError(`${l.name} ${l.color} ${l.storage}GB đã hết hàng.`);
  };
  for (const [, ls] of groups) if (ls.some((l) => l.stock < l.qty)) throw soldOut(ls);

  // Retries cover a write conflict with another checkout and an order code collision.
  for (let attempt = 0; ; attempt++) {
    const at = now();
    const order: Order = {
      _id: crypto.randomUUID(),
      code: newCode(),
      userId: input.userId,
      items: lines.map(({ stock: _s, idx: _i, ...l }) => l),
      shipping: input.shipping,
      paymentMethod: input.paymentMethod,
      status: "pending",
      statusHistory: [{ status: "pending", at }],
      totals: { items, shipping: SHIPPING_FEE, discount, total: Math.max(0, items - discount + SHIPPING_FEE) },
      ...(coupon && { couponCode: coupon.code }),
      createdAt: at,
    };
    try {
      await ddb.send(
        new TransactWriteCommand({
          TransactItems: [
            ...groups.map(([id, ls]) => stockUpdate(id, ls, -1)),
            ...(coupon ? [couponClaim(coupon.code)] : []),
            {
              Put: {
                TableName: TABLE,
                Item: { ...orderKey(order.code), GSI1PK: `USER#${order.userId}`, GSI1SK: at, GSI2PK: "ORDER", GSI2SK: at, ...order },
                ConditionExpression: "attribute_not_exists(PK)",
              },
            },
          ],
        }),
      );
      invalidateCatalog();
      return order;
    } catch (e) {
      const codes = cancelCodes(e);
      if (!codes) throw e;
      const i = codes.indexOf("ConditionalCheckFailed");
      if (i >= 0 && i < groups.length) throw soldOut(groups[i][1]);
      if (coupon && i === groups.length) throw new UserError("Mã giảm giá đã hết lượt dùng.");
      if (attempt >= 2) throw e;
    }
  }
}

const historyPush = (status: Status) => ({ ":h": [{ status, at: now() }] });

// The only cancel path (user, admin, failed payment). Conditional on status, so it can never restock twice.
// Returns the cancelled order, or null when it was not in one of the `from` statuses.
export async function cancelOrder(code: string, from: Status[] = ["pending"]) {
  for (let attempt = 0; ; attempt++) {
    const o = await getOrder(code);
    if (!o || !from.includes(o.status)) return null;
    // Restock only SKUs that still exist (an admin may have removed a variant since).
    const fresh = await getProducts([...new Set(o.items.map((i) => i.productId))]);
    const restock = fresh.flatMap((p) => {
      const ls = o.items.flatMap((i) => {
        const idx = i.productId === p._id ? p.variants.findIndex((v) => v.sku === i.sku) : -1;
        return idx < 0 ? [] : [{ idx, sku: i.sku, qty: i.qty }];
      });
      return ls.length ? [stockUpdate(p._id, ls, 1)] : [];
    });
    try {
      await ddb.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: TABLE,
                Key: orderKey(code),
                UpdateExpression: "SET #s = :c, #h = list_append(#h, :h)",
                ConditionExpression: "#s = :from",
                ExpressionAttributeNames: { "#s": "status", "#h": "statusHistory" },
                ExpressionAttributeValues: { ":c": "cancelled", ":from": o.status, ...historyPush("cancelled") },
              },
            },
            ...restock,
            ...(o.couponCode ? [couponRelease(o.couponCode)] : []),
          ],
        }),
      );
      invalidateCatalog();
      return o;
    } catch (e) {
      const codes = cancelCodes(e);
      if (!codes) throw e;
      if (codes[0] === "ConditionalCheckFailed") return null; // another tab or IPN won
      if (attempt >= 2) throw e;
    }
  }
}

// Admin status move (not cancel). Conditional on the status the admin saw, so 2 tabs cannot both apply.
// Moving to shipping with IMEIs also writes 1 lock item per IMEI: 1 IMEI in at most 1 order.
export async function moveOrder(o: Pick<Order, "code" | "status" | "paymentMethod">, to: Exclude<Status, "cancelled">, items?: OrderItem[]) {
  if (!nextStatuses(o).includes(to)) throw new UserError("Không thể chuyển sang trạng thái này.");
  const imeis = items?.flatMap((i) => i.imeis ?? []) ?? [];
  if (imeis.length > 99) throw new UserError("Tối đa 99 máy mỗi lần giao."); // transaction limit is 100 items
  const update = {
    TableName: TABLE,
    Key: orderKey(o.code),
    UpdateExpression: `SET #s = :to, #h = list_append(#h, :h)${items ? ", #i = :items" : ""}`,
    ConditionExpression: "#s = :from",
    ExpressionAttributeNames: { "#s": "status", "#h": "statusHistory", ...(items && { "#i": "items" }) },
    ExpressionAttributeValues: { ":to": to, ":from": o.status, ...historyPush(to), ...(items && { ":items": items }) },
  };
  const stale = new UserError("Đơn đã đổi trạng thái, tải lại trang.");
  try {
    if (!imeis.length) await ddb.send(new UpdateCommand(update));
    else
      await ddb.send(
        new TransactWriteCommand({
          TransactItems: [
            { Update: update },
            ...imeis.map((imei) => ({
              Put: {
                TableName: TABLE,
                Item: { ...imeiKey(imei), code: o.code },
                ConditionExpression: "attribute_not_exists(PK) OR #c = :code",
                ExpressionAttributeNames: { "#c": "code" },
                ExpressionAttributeValues: { ":code": o.code },
              },
            })),
          ],
        }),
      );
  } catch (e) {
    const codes = cancelCodes(e);
    if (codes) throw codes[0] === "ConditionalCheckFailed" ? stale : new UserError("IMEI đã được dùng cho đơn khác.");
    if (isCondFail(e)) throw stale;
    throw e;
  }
}

// Order codes already holding any of these IMEIs (other than `except`).
export async function imeiOwner(imeis: string[], except: string) {
  const locks = await batchGet<{ code: string }>(imeis.map(imeiKey));
  return locks.find((l) => l.code !== except)?.code;
}

// Warranty lookup: IMEI lock, then the order.
export async function orderByImei(imei: string) {
  const lock = await get<{ code: string }>(`IMEI#${imei}`, "-");
  return lock ? getOrder(lock.code) : undefined;
}

// GSI reads are eventually consistent: a new order may show here a moment late.
export async function userOrders(userId: string) {
  const r = await ddb.send(
    new QueryCommand({ TableName: TABLE, IndexName: "GSI1", KeyConditionExpression: "GSI1PK = :u", ExpressionAttributeValues: { ":u": `USER#${userId}` }, ScanIndexForward: false, Limit: 50 }),
  );
  return (r.Items ?? []) as Order[];
}

// Every order of a user (for the review check), all pages.
export const allUserOrders = (userId: string) =>
  queryAll<Order>({ IndexName: "GSI1", KeyConditionExpression: "GSI1PK = :u", ExpressionAttributeValues: { ":u": `USER#${userId}` } });

// Admin list: newest first, status filtered in JS, up to 100 matches.
export async function adminOrders(status?: Status) {
  const out: Order[] = [];
  let ExclusiveStartKey: QueryCommandInput["ExclusiveStartKey"];
  do {
    const r = await ddb.send(
      new QueryCommand({ TableName: TABLE, IndexName: "GSI2", KeyConditionExpression: "GSI2PK = :o", ExpressionAttributeValues: { ":o": "ORDER" }, ScanIndexForward: false, Limit: 100, ExclusiveStartKey }),
    );
    out.push(...((r.Items ?? []) as Order[]).filter((o) => !status || o.status === status));
    ExclusiveStartKey = r.LastEvaluatedKey;
  } while (ExclusiveStartKey && out.length < 100);
  return out.slice(0, 100);
}
