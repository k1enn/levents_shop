import type { Route } from "./+types/api.vnpay.ipn";
import { codeOf, markPaid, verifyVnpay } from "~/lib/payment.server";
import { cancelOrder, getOrder } from "~/lib/orders.server";
import { purge } from "~/lib/cache.server";

const reply = (RspCode: string, Message: string) => Response.json({ RspCode, Message });

// VNPay retries until it gets 00 or 02, so every outcome must be idempotent. Always HTTP 200.
export async function loader({ request }: Route.LoaderArgs) {
  try {
    const p = new URL(request.url).searchParams;
    if (!(await verifyVnpay(p))) return reply("97", "Invalid signature");
    const ref = p.get("vnp_TxnRef") ?? "";
    const amount = Number(p.get("vnp_Amount")) / 100;
    const success = p.get("vnp_ResponseCode") === "00" && p.get("vnp_TransactionStatus") === "00";
    if (success) {
      const r = await markPaid(ref, amount, p.get("vnp_TransactionNo") ?? "");
      return { ok: reply("00", "Confirm Success"), already: reply("02", "Order already confirmed"), not_found: reply("01", "Order not found"), bad_amount: reply("04", "Invalid amount") }[r];
    }
    const o = await getOrder(codeOf(ref));
    if (!o) return reply("01", "Order not found");
    if (o.totals.total !== amount) return reply("04", "Invalid amount");
    if (o.status !== "pending") return reply("02", "Order already confirmed");
    if (await cancelOrder(codeOf(ref))) await purge();
    return reply("00", "Confirm Success");
  } catch (e) {
    console.error("vnpay ipn error", e);
    return reply("99", "Unknown error");
  }
}
