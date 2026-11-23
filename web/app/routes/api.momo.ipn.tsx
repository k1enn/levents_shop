import type { Route } from "./+types/api.momo.ipn";
import { codeOf, markPaid, verifyMomo } from "~/lib/payment.server";
import { cancelOrder } from "~/lib/orders.server";
import { purge } from "~/lib/cache.server";

// Server to server. No session: the signature IS the authentication, checked before any DB read.
export async function action({ request }: Route.ActionArgs) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || !(await verifyMomo(body))) return new Response("bad signature", { status: 400 });
  const ref = String(body.orderId);
  if (Number(body.resultCode) === 0) {
    const r = await markPaid(ref, Number(body.amount), String(body.transId));
    if (r === "bad_amount" || r === "not_found") console.error("momo ipn rejected", ref, r);
  } else {
    // shortcut: a failed attempt cancels the order (no partial retry state). Conditional on pending, so replays are no-ops.
    if (await cancelOrder(codeOf(ref))) await purge();
  }
  return new Response(null, { status: 204 });
}
