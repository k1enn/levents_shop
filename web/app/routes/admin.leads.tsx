import { Form } from "react-router";
import type { Route } from "./+types/admin.leads";
import { requireAdmin } from "~/lib/auth.server";
import { listLeads, setLeadStatus } from "~/lib/leads.server";
import { LEAD_STATUSES } from "~/lib/shop";
import { oneOf, str } from "~/lib/validate";

const STATUS = { new: "Mới", contacted: "Đã liên hệ", closed: "Đóng" };
const TYPE = { installment: "Trả góp", tradein: "Thu cũ" };

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return { list: await listLeads() };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const fd = await request.formData();
  const id = str(fd, "id", 80);
  const status = oneOf(fd, "status", LEAD_STATUSES);
  if (id && status) await setLeadStatus(id, status);
  return null;
}

export default function AdminLeads({ loaderData: { list } }: Route.ComponentProps) {
  return (
    <div className="card">
      <h1 className="mb-2">Yêu cầu tư vấn</h1>
      <table className="table">
        <tbody>
          {list.map((l) => (
            <tr key={l._id}>
              <td>{new Date(l.createdAt).toLocaleString("vi-VN")}</td>
              <td>{TYPE[l.type]}</td>
              <td>{l.fullName}<br />{l.phone}</td>
              <td className="text-xs">{Object.entries(l.payload).map(([k, v]) => `${k}: ${v}`).join(" · ")}</td>
              <td>
                <Form method="post" className="flex gap-1">
                  <input type="hidden" name="id" value={l._id} />
                  <select name="status" defaultValue={l.status} className="input w-auto" aria-label="Trạng thái" onChange={(e) => e.currentTarget.form?.requestSubmit()}>
                    {LEAD_STATUSES.map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}
                  </select>
                  <noscript><button className="btn-ghost">Lưu</button></noscript>
                </Form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
