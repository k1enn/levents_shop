import { Form, Link, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.orders";
import { requireAdmin } from "~/lib/auth.server";
import { adminOrders, cancelOrder, getOrder, imeiOwner, moveOrder, type Order } from "~/lib/orders.server";
import { nextStatuses, PAY_LABEL, STATUS_LABEL, STATUSES, type Status } from "~/lib/shop";
import { purge } from "~/lib/cache.server";
import { isValidImei } from "~/lib/imei";
import { userErrors, UserError } from "~/lib/errors";
import { oneOf, str } from "~/lib/validate";
import { formatDate, formatVnd } from "~/lib/format";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const status = oneOf(new URL(request.url).searchParams, "status", STATUSES);
  const list = await adminOrders(status);
  return { list };
}

// IMEIs for every unit: 15 digits + Luhn, no duplicate in the form, none already used by another order.
async function withImeis(fd: FormData, o: Order) {
  const items = o.items.map((i) => ({ ...i, imeis: fd.getAll(`imei_${i.sku}`).map((v) => String(v).trim()) }));
  const all = items.flatMap((i) => i.imeis);
  if (items.some((i) => i.imeis.length !== i.qty) || all.some((x) => !isValidImei(x)))
    throw new UserError("Nhập đủ IMEI hợp lệ (15 số) cho từng máy.");
  if (new Set(all).size !== all.length) throw new UserError("IMEI bị trùng trong đơn.");
  const used = await imeiOwner(all, o.code);
  if (used) throw new UserError(`IMEI đã dùng ở đơn ${used}.`);
  return items;
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const fd = await request.formData();
  const code = str(fd, "code", 20);
  const from = oneOf(fd, "from", STATUSES);
  const to = oneOf(fd, "to", STATUSES);
  if (!code || !from || !to) return { error: "Dữ liệu không hợp lệ." };
  const r = await userErrors(async () => {
    const o = await getOrder(code);
    // The status the admin saw must still be current, so 2 tabs cannot both apply.
    if (!o || o.status !== from) throw new UserError("Đơn đã đổi trạng thái, tải lại trang.");
    if (to === "cancelled") {
      // Paid orders can be cancelled too; refund is done by hand in the gateway portal.
      if (!nextStatuses(o).includes("cancelled")) throw new UserError("Không thể hủy đơn này.");
      if (await cancelOrder(code, [from])) await purge();
      return;
    }
    await moveOrder(o, to, to === "shipping" ? await withImeis(fd, o) : undefined);
  });
  return r && "error" in r ? { error: `${code}: ${r.error}` } : { ok: `${code}: đã cập nhật.` };
}

function Move({ o }: { o: Order }) {
  const next = nextStatuses(o);
  if (!next.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {next.map((to: Status) => (
        <Form key={to} method="post" className="flex flex-wrap items-center gap-1">
          <input type="hidden" name="code" value={o.code} />
          <input type="hidden" name="from" value={o.status} />
          <input type="hidden" name="to" value={to} />
          {to === "shipping" &&
            o.items.flatMap((i) =>
              Array.from({ length: i.qty }, (_, n) => (
                <input key={`${i.sku}${n}`} name={`imei_${i.sku}`} required pattern="\d{15}" placeholder={`IMEI ${i.name} #${n + 1}`} className="input w-48" />
              )),
            )}
          <button className={to === "cancelled" ? "btn-ghost" : "btn"}>{STATUS_LABEL[to]}</button>
        </Form>
      ))}
    </div>
  );
}

export default function AdminOrders({ loaderData: { list }, actionData }: Route.ComponentProps) {
  const [sp] = useSearchParams();
  return (
    <div className="card flex flex-col gap-3">
      <h1 className="text-xl font-bold">Đơn hàng</h1>
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link to="?" className={!sp.get("status") ? "font-bold" : ""}>Tất cả</Link>
        {STATUSES.map((s) => (
          <Link key={s} to={`?status=${s}`} className={sp.get("status") === s ? "font-bold" : ""}>{STATUS_LABEL[s]}</Link>
        ))}
      </nav>
      {actionData?.error && <p className="err">{actionData.error}</p>}
      {actionData?.ok && <p className="text-green-700">{actionData.ok}</p>}
      {list.map((o) => (
        <div key={o.code} className="flex flex-col gap-1 border-t pt-2 text-sm">
          <p>
            <b>{o.code}</b> · {formatDate(o.createdAt)} · {STATUS_LABEL[o.status]} · {PAY_LABEL[o.paymentMethod]} · <b>{formatVnd(o.totals.total)}</b>
          </p>
          <p>{o.items.map((i) => `${i.name} ${i.color} ${i.storage}GB × ${i.qty}${i.imeis?.length ? ` [${i.imeis.join(", ")}]` : ""}`).join("; ")}</p>
          <p className="text-gray-600">{o.shipping.fullName} · {o.shipping.phone} · {o.shipping.address}, {o.shipping.ward}, {o.shipping.district}, {o.shipping.province}</p>
          <Move o={o} />
        </div>
      ))}
    </div>
  );
}
