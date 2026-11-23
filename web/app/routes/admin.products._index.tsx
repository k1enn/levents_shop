import { Link } from "react-router";
import type { Route } from "./+types/admin.products._index";
import { requireAdmin } from "~/lib/auth.server";
import { adminProducts } from "~/lib/products.server";
import { formatVnd } from "~/lib/format";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  const list = await adminProducts();
  return { list: list.map(({ _id, name, brand, minPrice, isActive, variants }) => ({ _id, name, brand, minPrice, isActive, stock: variants.reduce((s, v) => s + v.stock, 0), variants: variants.length })) };
}

export default function AdminProducts({ loaderData: { list } }: Route.ComponentProps) {
  return (
    <div className="card">
      <div className="mb-2 flex justify-between">
        <h1 className="text-xl font-bold">Sản phẩm ({list.length})</h1>
        <Link to="/admin/products/new" className="btn">Thêm</Link>
      </div>
      <table className="table">
        <thead>
          <tr><th>Tên</th><th>Hãng</th><th>Giá từ</th><th>Phiên bản</th><th>Tồn</th><th>Hiện</th></tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p._id}>
              <td><Link to={`/admin/products/${p._id}`} className="text-blue-600">{p.name}</Link></td>
              <td>{p.brand}</td>
              <td>{formatVnd(p.minPrice)}</td>
              <td>{p.variants}</td>
              <td>{p.stock}</td>
              <td>{p.isActive ? "✓" : "✗"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
