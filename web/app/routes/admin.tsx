import { NavLink, Outlet, redirect } from "react-router";
import type { Route } from "./+types/admin";
import { requireAdmin } from "~/lib/auth.server";

export const meta: Route.MetaFunction = () => [{ title: "Quản trị - PhoneShop" }, { name: "robots", content: "noindex" }];

// Guards page loads. Every admin action ALSO calls requireAdmin (actions do not run parent loaders).
export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  if (new URL(request.url).pathname.replace(/\/$/, "") === "/admin") throw redirect("/admin/products");
  return null;
}

const LINKS = [["products", "Sản phẩm"], ["orders", "Đơn hàng"], ["coupons", "Mã giảm giá"], ["leads", "Yêu cầu tư vấn"], ["users", "Người dùng"]];

export default function Admin() {
  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap gap-2">
        {LINKS.map(([to, label]) => (
          <NavLink key={to} to={`/admin/${to}`} className={({ isActive }) => (isActive ? "btn" : "btn-ghost")}>
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
