import { Link } from "react-router";
import type { Route } from "./+types/orders._index";
import { requireUser } from "~/lib/auth.server";
import { userOrders } from "~/lib/orders.server";
import { formatDate, formatVnd } from "~/lib/format";
import { STATUS_LABEL } from "~/lib/shop";

export const meta: Route.MetaFunction = () => [{ title: "Đơn hàng - PhoneShop" }];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const list = (await userOrders(user._id)).map(({ code, status, totals, createdAt }) => ({ code, status, totals, createdAt }));
  return { list };
}

export default function Orders({ loaderData: { list } }: Route.ComponentProps) {
  return (
    <div className="card">
      <h1 className="mb-2">Đơn hàng của tôi</h1>
      {!list.length && <p>Chưa có đơn hàng.</p>}
      <table className="table">
        <tbody>
          {list.map((o) => (
            <tr key={o.code}>
              <td><Link to={`/orders/${o.code}`} className="underline">{o.code}</Link></td>
              <td>{formatDate(o.createdAt)}</td>
              <td>{STATUS_LABEL[o.status]}</td>
              <td className="text-right">{formatVnd(o.totals.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
