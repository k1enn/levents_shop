import { data, Link, useFetcher } from "react-router";
import type { Route } from "./+types/cart";
import { itemsTotal, resolveCart, setLine } from "~/lib/cart.server";
import { MAX_QTY } from "~/lib/shop";
import { getSession, setCookie } from "~/lib/session.server";
import { int, str } from "~/lib/validate";
import { formatVnd } from "~/lib/format";

export const meta: Route.MetaFunction = () => [{ title: "Giỏ hàng - PhoneShop" }];

export async function loader({ request }: Route.LoaderArgs) {
  const cart = (await getSession(request)).get("cart") ?? [];
  const lines = await resolveCart(cart);
  return { lines, total: itemsTotal(lines) };
}

export async function action({ request }: Route.ActionArgs) {
  const fd = await request.formData();
  const session = await getSession(request);
  const sku = str(fd, "sku", 60);
  const qty = int(fd, "qty", 0, MAX_QTY);
  const intent = fd.get("intent");
  if (!sku || qty === undefined || !["add", "set"].includes(intent as string)) return data({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  const cart = session.get("cart") ?? [];
  const next = setLine(cart, sku, qty, intent === "add");
  // Cap at real stock so the cart never promises more than exists.
  const [line] = await resolveCart(next.filter((l) => l.sku === sku));
  if (next.some((l) => l.sku === sku)) {
    if (!line) return data({ error: "Sản phẩm không còn bán." }, { status: 400 });
    if (line.stock < 1) return { error: "Sản phẩm đã hết hàng." };
    const capped = Math.min(line.qty, line.stock);
    session.set("cart", setLine(next, sku, capped, false));
  } else {
    session.set("cart", next);
  }
  return data({ ok: "Đã cập nhật giỏ hàng." }, { headers: await setCookie(session) });
}

function Line({ l }: { l: Route.ComponentProps["loaderData"]["lines"][number] }) {
  const f = useFetcher();
  const set = (qty: number) => f.submit({ intent: "set", sku: l.sku, qty }, { method: "post" });
  const max = Math.min(MAX_QTY, l.stock);
  return (
    <div className="flex items-center gap-3 border-t py-3">
      <img src={`/images/${l.image}`} alt="" className="h-16 w-16 object-contain" />
      <div className="flex-1">
        <Link to={`/phones/${l.slug}?sku=${l.sku}`} className="font-medium">{l.name}</Link>
        <p className="text-sm text-gray-500">{l.color} · {l.storage} GB</p>
        {l.qty > l.stock && <p className="err">Chỉ còn {l.stock} máy</p>}
      </div>
      <select value={l.qty} onChange={(e) => set(Number(e.target.value))} className="input w-20" aria-label="Số lượng">
        {Array.from({ length: Math.max(max, l.qty) }, (_, i) => i + 1).map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>
      <span className="w-28 text-right">{formatVnd(l.price * l.qty)}</span>
      <button onClick={() => set(0)} className="text-sm text-red-600">Xóa</button>
    </div>
  );
}

export default function Cart({ loaderData: { lines, total } }: Route.ComponentProps) {
  if (!lines.length)
    return (
      <div className="card">
        <p>Giỏ hàng trống.</p>
        <Link to="/phones" className="btn mt-2">Mua sắm</Link>
      </div>
    );
  return (
    <div className="card">
      <h1 className="text-xl font-bold">Giỏ hàng</h1>
      {lines.map((l) => <Line key={l.sku} l={l} />)}
      <div className="flex items-center justify-between border-t pt-3">
        <b>Tạm tính: {formatVnd(total)}</b>
        <Link to="/checkout" className="btn">Đặt hàng</Link>
      </div>
    </div>
  );
}
