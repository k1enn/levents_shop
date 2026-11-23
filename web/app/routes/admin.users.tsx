import type { Route } from "./+types/admin.users";
import { listUsers, requireAdmin } from "~/lib/auth.server";
import { formatDate } from "~/lib/format";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const list = await listUsers();
  return { list };
}

export default function AdminUsers({ loaderData: { list } }: Route.ComponentProps) {
  return (
    <div className="card">
      <h1 className="mb-2">Người dùng ({list.length})</h1>
      <table className="table">
        <tbody>
          {list.map((u) => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.isAdmin ? "Admin" : ""}</td>
              <td>{formatDate(u.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
