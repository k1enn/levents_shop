import { env } from "./env.server";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, isCondFail, now, TABLE } from "./db.server";
import { hmacHex, safeEqual } from "./crypto.server";
import { getOrder, orderKey, type Order } from "./orders.server";
import { ip } from "./guard.server";

// Gateways reject a reused order id, so each attempt gets ref = order code (8 chars) + timestamp.
const CODE_LEN = 8;
export const newRef = (code: string) => code + Date.now().toString(36).toUpperCase();
export const codeOf = (ref: string) => ref.slice(0, CODE_LEN);

// The only place an order becomes paid. Safe to call many times.
export async function markPaid(ref: string, amount: number, paymentRef: string) {
  const code = codeOf(ref);
  const at = now();
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: orderKey(code),
        UpdateExpression: "SET #s = :paid, paidAt = :at, paymentRef = :ref, #h = list_append(#h, :h)",
        ConditionExpression: "attribute_exists(PK) AND #s = :pending AND #t.#tt = :amount",
        ExpressionAttributeNames: { "#s": "status", "#h": "statusHistory", "#t": "totals", "#tt": "total" },
        ExpressionAttributeValues: { ":paid": "paid", ":pending": "pending", ":at": at, ":ref": paymentRef, ":amount": amount, ":h": [{ status: "paid", at }] },
      }),
    );
    return "ok" as const;
  } catch (e) {
    if (!isCondFail(e)) throw e;
    const o = await getOrder(code);
    if (!o) return "not_found" as const;
    return o.totals.total !== amount ? ("bad_amount" as const) : ("already" as const);
  }
}

// Gateway URL for an online order (checkout and "pay again").
export const gatewayUrl = (order: Order, request: Request) =>
  order.paymentMethod === "momo" ? createMomoPayment(order) : buildVnpayUrl(order, ip(request) === "local" ? "127.0.0.1" : ip(request));

// ---------- MoMo (HMAC SHA256, fixed field order) ----------
const MOMO_URL = "https://test-payment.momo.vn/v2/gateway/api/create";
const momoSign = (fields: Record<string, string | number>) =>
  hmacHex("SHA-256", env.MOMO_SECRET_KEY, Object.entries(fields).map(([k, v]) => `${k}=${v}`).join("&"));

export async function createMomoPayment(order: Order) {
  const orderId = newRef(order.code);
  const f = {
    accessKey: env.MOMO_ACCESS_KEY,
    amount: order.totals.total,
    extraData: "",
    ipnUrl: `${env.APP_URL}/api/momo/ipn`,
    orderId,
    orderInfo: `Thanh toan don ${order.code}`,
    partnerCode: env.MOMO_PARTNER_CODE,
    redirectUrl: `${env.APP_URL}/payment/return?gw=momo`,
    requestId: orderId,
    requestType: "payWithMethod",
  };
  const { accessKey: _, ...body } = f;
  const res = await fetch(MOMO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, lang: "vi", autoCapture: true, signature: await momoSign(f) }),
  });
  const json = (await res.json()) as { resultCode: number; payUrl?: string; message?: string };
  if (json.resultCode !== 0 || !json.payUrl) throw new Error(`MoMo create failed: ${json.resultCode} ${json.message}`);
  return json.payUrl;
}

const MOMO_RESULT_FIELDS = ["amount", "extraData", "message", "orderId", "orderInfo", "orderType", "partnerCode", "payType", "requestId", "responseTime", "resultCode", "transId"] as const;

// Same check for the IPN body and the redirect query (MoMo signs both with the same fields).
export async function verifyMomo(p: Record<string, unknown>) {
  if (typeof p.signature !== "string") return false;
  const f: Record<string, string | number> = { accessKey: env.MOMO_ACCESS_KEY };
  for (const k of MOMO_RESULT_FIELDS) f[k] = String(p[k] ?? "");
  return safeEqual(await momoSign(f), p.signature);
}

// ---------- VNPay (HMAC SHA512 over sorted, form encoded params) ----------
const VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const sortedQuery = (p: Iterable<[string, string]>) => new URLSearchParams([...p].sort(([a], [b]) => (a < b ? -1 : 1))).toString();

// yyyyMMddHHmmss in GMT+7
const vnTime = (d: Date) => new Date(d.getTime() + 7 * 3600_000).toISOString().replace(/\D/g, "").slice(0, 14);

export async function buildVnpayUrl(order: Order, ip: string) {
  const q = sortedQuery(
    Object.entries({
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: env.VNP_TMN_CODE,
      vnp_Amount: String(order.totals.total * 100),
      vnp_CurrCode: "VND",
      vnp_TxnRef: newRef(order.code),
      vnp_OrderInfo: `Thanh toan don ${order.code}`,
      vnp_OrderType: "other",
      vnp_Locale: "vn",
      vnp_ReturnUrl: `${env.APP_URL}/payment/return?gw=vnpay`,
      vnp_IpAddr: ip,
      vnp_CreateDate: vnTime(new Date()),
    }),
  );
  return `${VNP_URL}?${q}&vnp_SecureHash=${await hmacHex("SHA-512", env.VNP_HASH_SECRET, q)}`;
}

export async function verifyVnpay(params: URLSearchParams) {
  const given = params.get("vnp_SecureHash")?.toLowerCase();
  if (!given) return false;
  const q = sortedQuery([...params].filter(([k]) => k.startsWith("vnp_") && k !== "vnp_SecureHash" && k !== "vnp_SecureHashType"));
  return safeEqual(await hmacHex("SHA-512", env.VNP_HASH_SECRET, q), given);
}
