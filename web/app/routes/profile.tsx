import { Link } from "react-router";
import type { Route } from "./+types/profile";
import { requireUser } from "~/lib/auth.server";
import { formatDate } from "~/lib/format";

export const loader = async ({ request }: Route.LoaderArgs) => ({ user: await requireUser(request) });

export default function Profile({ loaderData: { user } }: Route.ComponentProps) {
  return (
    <div className="card mx-auto flex max-w-sm flex-col gap-2">
      <h1 className="text-xl font-bold">{user.name}</h1>
      <p>{user.email}</p>
      <p className="text-sm text-gray-500">Thành viên từ {formatDate(user.createdAt)}</p>
      <Link to="/orders" className="btn">Đơn hàng của tôi</Link>
    </div>
  );
}
