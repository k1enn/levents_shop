import { data, redirect } from "react-router";
import type { Route } from "./+types/pay.$code";
import { requireUser } from "~/lib/auth.server";
import { getOrder } from "~/lib/orders.server";
import { gatewayUrl } from "~/lib/payment.server";
import { limit } from "~/lib/guard.server";

// "Pay again": only the owner, only while pending, only online methods.
export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireUser(request);
  await limit(request, "pay");
  const order = await getOrder(params.code);
  if (!order || order.userId !== user._id || order.status !== "pending" || order.paymentMethod === "cod") throw data("Not Found", { status: 404 });
  throw redirect(await gatewayUrl(order, request).catch((e) => (console.error(e), `/orders/${order.code}?payError=1`)));
}
