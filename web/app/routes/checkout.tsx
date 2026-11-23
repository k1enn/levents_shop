import { data, Form, redirect } from "react-router";
import type { Route } from "./+types/checkout";
import { requireUser } from "~/lib/auth.server";
import { itemsTotal, resolveCart } from "~/lib/cart.server";
import { placeOrder } from "~/lib/orders.server";
import { PAYMENT_METHODS, SHIPPING_FEE } from "~/lib/shop";
import { gatewayUrl } from "~/lib/payment.server";
import { getSession, setCookie } from "~/lib/session.server";
import { limit } from "~/lib/guard.server";
import { purge } from "~/lib/cache.server";
import { userErrors } from "~/lib/errors";
import { oneOf, phone, str } from "~/lib/validate";
import { formatVnd } from "~/lib/format";

export const meta: Route.MetaFunction = () => [{ title: "Thanh toán - PhoneShop" }];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const cart = (await getSession(request)).get("cart") ?? [];
  const lines = await resolveCart(cart);
  if (!lines.length) throw redirect("/cart");
  return { user, lines, items: itemsTotal(lines) };
}

const ADDRESS = [["province", "Tỉnh / Thành phố"], ["district", "Quận / Huyện"], ["ward", "Phường / Xã"], ["address", "Số nhà, đường"]] as const;
const PAY_LABEL = { cod: "Thanh toán khi nhận hàng (COD)", momo: "Ví MoMo", vnpay: "VNPay (ATM / QR)" };

export async function action({ request }: Route.ActionArgs) {
  const user = await requireUser(request);
  const fd = await request.formData();
  const fullName = str(fd, "fullName", 80);
  const tel = phone(fd);
  const addr = Object.fromEntries(ADDRESS.map(([k]) => [k, str(fd, k, 120)]));
  const paymentMethod = oneOf(fd, "paymentMethod", PAYMENT_METHODS);
  const couponCode = str(fd, "coupon", 30);
  if (!fullName || !tel || !paymentMethod || ADDRESS.some(([k]) => !addr[k]))
    return data({ error: "Nhập đủ thông tin giao hàng, số điện thoại 10 số bắt đầu bằng 0." }, { status: 400 });
  if (couponCode) await limit(request, "coupon");

  const session = await getSession(request);
  const shipping = { fullName, phone: tel, ...(addr as Record<(typeof ADDRESS)[number][0], string>) };
  const order = await userErrors(() => placeOrder({ userId: user._id, cart: session.get("cart") ?? [], shipping, paymentMethod, couponCode }));
  if ("error" in order) return data(order, { status: 400 });

  session.set("cart", []);
  await purge();
  const headers = await setCookie(session);
  if (paymentMethod === "cod") throw redirect(`/orders/${order.code}`, { headers });
  // Order exists even if the gateway call fails; the order page offers "pay again".
  const url = await gatewayUrl(order, request).catch((e) => (console.error(e), `/orders/${order.code}?payError=1`));
  throw redirect(url, { headers });
}

export default function Checkout({ loaderData: { user, lines, items }, actionData }: Route.ComponentProps) {
  return (
    <Form method="post" className="grid gap-4 md:grid-cols-2">
      <div className="card flex flex-col gap-2">
        <h1 className="text-xl font-bold">Thông tin giao hàng</h1>
        <input name="fullName" required maxLength={80} defaultValue={user.name} placeholder="Họ tên" className="input" />
        <input name="phone" required inputMode="tel" placeholder="Số điện thoại" className="input" />
        {ADDRESS.map(([k, label]) => (
          <input key={k} name={k} required maxLength={120} placeholder={label} className="input" />
        ))}
        <h2 className="mt-2 font-bold">Thanh toán</h2>
        {PAYMENT_METHODS.map((m, i) => (
          <label key={m} className="flex items-center gap-2">
            <input type="radio" name="paymentMethod" value={m} defaultChecked={i === 0} /> {PAY_LABEL[m]}
          </label>
        ))}
      </div>
      <div className="card flex flex-col gap-2">
        <h2 className="font-bold">Đơn hàng</h2>
        {lines.map((l) => (
          <div key={l.sku} className="flex justify-between text-sm">
            <span>{l.name} {l.color} {l.storage}GB × {l.qty}</span>
            <span>{formatVnd(l.price * l.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-2"><span>Tạm tính</span><span>{formatVnd(items)}</span></div>
        <div className="flex justify-between"><span>Phí giao hàng</span><span>{formatVnd(SHIPPING_FEE)}</span></div>
        <input name="coupon" maxLength={30} placeholder="Mã giảm giá (nếu có)" className="input uppercase" />
        <p className="text-xs text-gray-500">Giảm giá được tính khi đặt hàng.</p>
        {actionData?.error && <p className="err">{actionData.error}</p>}
        <button className="btn">Đặt hàng</button>
      </div>
    </Form>
  );
}
