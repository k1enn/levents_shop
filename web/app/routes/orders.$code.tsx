import { data, Form, useSearchParams } from "react-router";
import type { Route } from "./+types/orders.$code";
import { requireUser } from "~/lib/auth.server";
import { getOrder } from "~/lib/orders.server";
import { formatVnd } from "~/lib/format";
import { PAY_LABEL, STATUS_LABEL } from "~/lib/shop";

export const meta: Route.MetaFunction = ({ params }) => [{ title: `Đơn ${params.code} - PhoneShop` }];

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireUser(request);
  // Another user's order is simply not found.
  const order = await getOrder(params.code);
  if (!order || order.userId !== user._id) throw data("Not Found", { status: 404 });
  return { order };
}

export default function OrderPage({ loaderData: { order: o } }: Route.ComponentProps) {
  const [sp] = useSearchParams();
  const s = o.shipping;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card flex flex-col gap-2">
        <h1>Đơn {o.code}</h1>
        <p>Trạng thái: <b>{STATUS_LABEL[o.status]}</b> · {PAY_LABEL[o.paymentMethod]}</p>
        {o.items.map((i) => (
          <div key={i.sku} className="flex justify-between text-sm">
            <span>{i.name} {i.color} {i.storage}GB × {i.qty}</span>
            <span>{formatVnd(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="border-t pt-2 text-sm">
          <p>Tạm tính: {formatVnd(o.totals.items)}</p>
          <p>Phí giao: {formatVnd(o.totals.shipping)}</p>
          {o.totals.discount > 0 && <p>Giảm giá ({o.couponCode}): -{formatVnd(o.totals.discount)}</p>}
          <p className="text-base font-extrabold text-black">Tổng: {formatVnd(o.totals.total)}</p>
        </div>
        <p className="text-sm text-gray-600">Giao đến: {s.fullName}, {s.phone}, {s.address}, {s.ward}, {s.district}, {s.province}</p>
        {sp.get("payError") && <p className="err">Không tạo được thanh toán, vui lòng thử lại.</p>}
        {o.status === "pending" && o.paymentMethod !== "cod" && (
          <Form method="post" action={`/pay/${o.code}`}>
            <button className="btn">Thanh toán lại</button>
          </Form>
        )}
      </div>
      <div className="card">
        <h2 className="mb-2">Hành trình đơn hàng</h2>
        <ol className="border-l-2 border-black pl-4">
          {o.statusHistory.map((h, i) => (
            <li key={i} className="relative mb-3 before:absolute before:-left-[1.4rem] before:top-1.5 before:h-3 before:w-3 before:rounded-full before:bg-black">
              <b>{STATUS_LABEL[h.status]}</b>
              <span className="block text-sm text-gray-500">{new Date(h.at).toLocaleString("vi-VN")}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
