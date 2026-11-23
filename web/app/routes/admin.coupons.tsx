import { Form } from "react-router";
import type { Route } from "./+types/admin.coupons";
import { requireAdmin } from "~/lib/auth.server";
import { createCoupon, listCoupons, toggleCoupon } from "~/lib/coupons.server";
import { int, oneOf, str } from "~/lib/validate";
import { formatDate } from "~/lib/format";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return { list: await listCoupons() };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const fd = await request.formData();
  const code = str(fd, "code", 30)?.toUpperCase();
  if (fd.get("intent") === "toggle") {
    if (code) await toggleCoupon(code);
    return { ok: "Đã cập nhật." };
  }
  const type = oneOf(fd, "type", ["percent", "fixed"] as const);
  const value = int(fd, "value", 1);
  const minOrder = int(fd, "minOrder") ?? 0;
  const maxDiscount = int(fd, "maxDiscount", 1);
  const usageLimit = int(fd, "usageLimit", 1);
  const startsAt = new Date(`${str(fd, "startsAt", 10)}T00:00:00+07:00`);
  const endsAt = new Date(`${str(fd, "endsAt", 10)}T23:59:59+07:00`);
  if (!code || !/^[A-Z0-9]+$/.test(code) || !type || !value || !usageLimit || (type === "percent" && value > 100) || !(endsAt > startsAt))
    return { error: "Mã (A-Z, 0-9), loại, giá trị, số lượt và ngày hợp lệ là bắt buộc. Phần trăm tối đa 100." };
  const created = await createCoupon({ code, type, value, minOrder, ...(maxDiscount && { maxDiscount }), startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), usageLimit, used: 0, active: true });
  if (!created) return { error: "Mã đã tồn tại." };
  return { ok: `Đã tạo ${code}.` };
}

export default function AdminCoupons({ loaderData: { list }, actionData }: Route.ComponentProps) {
  return (
    <div className="card flex flex-col gap-3">
      <h1>Mã giảm giá</h1>
      <Form method="post" className="grid gap-2 md:grid-cols-4">
        <input name="code" required placeholder="MÃ" className="input uppercase" />
        <select name="type" className="input" aria-label="Loại">
          <option value="percent">%</option>
          <option value="fixed">VND</option>
        </select>
        <input name="value" type="number" required placeholder="Giá trị" className="input" />
        <input name="minOrder" type="number" placeholder="Đơn tối thiểu" className="input" />
        <input name="maxDiscount" type="number" placeholder="Giảm tối đa" className="input" />
        <input name="usageLimit" type="number" required placeholder="Số lượt" className="input" />
        <input name="startsAt" type="date" required className="input" aria-label="Bắt đầu" />
        <input name="endsAt" type="date" required className="input" aria-label="Kết thúc" />
        <button className="btn md:col-span-4">Tạo mã</button>
      </Form>
      {actionData && "error" in actionData && <p className="err">{actionData.error}</p>}
      {actionData && "ok" in actionData && <p className="text-green-700">{actionData.ok}</p>}
      <table className="table">
        <tbody>
          {list.map((c) => (
            <tr key={c.code}>
              <td><b>{c.code}</b></td>
              <td>{c.type === "percent" ? `${c.value}%` : `${c.value.toLocaleString("vi-VN")}đ`}{c.maxDiscount ? ` (tối đa ${c.maxDiscount.toLocaleString("vi-VN")}đ)` : ""}</td>
              <td>{c.used}/{c.usageLimit}</td>
              <td>{formatDate(c.startsAt)} - {formatDate(c.endsAt)}</td>
              <td>
                <Form method="post">
                  <input type="hidden" name="intent" value="toggle" />
                  <input type="hidden" name="code" value={c.code} />
                  <button className="underline">{c.active ? "Tắt" : "Bật"}</button>
                </Form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
