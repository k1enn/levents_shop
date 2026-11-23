import { Link } from "react-router";
import type { Route } from "./+types/payment.return";
import { codeOf, verifyMomo, verifyVnpay } from "~/lib/payment.server";

// Display only. The order changes state in the IPN handlers, never here.
export async function loader({ request }: Route.LoaderArgs) {
  const p = new URL(request.url).searchParams;
  if (p.get("gw") === "vnpay") {
    const valid = await verifyVnpay(p);
    return { valid, success: valid && p.get("vnp_ResponseCode") === "00", code: codeOf(p.get("vnp_TxnRef") ?? "") };
  }
  const valid = await verifyMomo(Object.fromEntries(p));
  return { valid, success: valid && p.get("resultCode") === "0", code: codeOf(p.get("orderId") ?? "") };
}

export default function PaymentReturn({ loaderData: { valid, success, code } }: Route.ComponentProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-12 text-center">
      <span className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl text-white ${success ? "bg-[#4bbf73]" : "bg-[#d9534f]"}`} aria-hidden>{success ? "✓" : "✕"}</span>
      <h1>
        {!valid ? "Liên kết không hợp lệ" : success ? "Thanh toán thành công" : "Thanh toán không thành công"}
      </h1>
      {success && <p>Đơn hàng sẽ được cập nhật trong giây lát.</p>}
      {valid && code && <Link to={`/orders/${code}`} className="btn">Xem đơn {code}</Link>}
    </div>
  );
}
