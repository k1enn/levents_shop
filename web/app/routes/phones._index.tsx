import { Form, Link } from "react-router";
import type { Route } from "./+types/phones._index";
import { listBrands, listProducts, parseFilters, type Filters } from "~/lib/products.server";
import { CATALOG_CACHE } from "~/lib/cache.server";
import { Grid } from "~/components/ProductCard";

export const meta: Route.MetaFunction = () => [{ title: "Điện thoại - PhoneShop" }];
export const headers: Route.HeadersFunction = () => ({ "Cache-Control": CATALOG_CACHE });

export async function loader({ request }: Route.LoaderArgs) {
  const sp = new URL(request.url).searchParams;
  const filters = parseFilters(sp);
  const [list, brands] = await Promise.all([listProducts(filters), listBrands()]);
  return { ...list, brands, filters, query: sp.toString() };
}

const RAMS = [4, 6, 8, 12, 16];
const STORAGES = [64, 128, 256, 512, 1024];

function Select({ name, value, options }: { name: string; value?: string | number; options: [string, string | number][] }) {
  return (
    <select name={name} defaultValue={value ?? ""} className="input w-auto" aria-label={name}>
      {options.map(([label, v]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}

function FilterForm({ f, brands }: { f: Filters; brands: string[] }) {
  return (
    <Form method="get" className="card flex flex-wrap items-center gap-2" key={JSON.stringify(f)}>
      {f.q && <input type="hidden" name="q" value={f.q} />}
      <Select name="brand" value={f.brand} options={[["Hãng", ""], ...brands.map((b): [string, string] => [b, b])]} />
      <Select name="ram" value={f.ram} options={[["RAM", ""], ...RAMS.map((r): [string, number] => [`${r} GB`, r])]} />
      <Select name="storage" value={f.storage} options={[["Bộ nhớ", ""], ...STORAGES.map((s): [string, number] => [s >= 1024 ? "1 TB" : `${s} GB`, s])]} />
      <input name="min" type="number" min={0} step={100000} placeholder="Giá từ" defaultValue={f.min} className="input w-32" />
      <input name="max" type="number" min={0} step={100000} placeholder="Giá đến" defaultValue={f.max} className="input w-32" />
      <Select name="sort" value={f.sort} options={[["Mới nhất", "newest"], ["Giá tăng", "price_asc"], ["Giá giảm", "price_desc"]]} />
      <button className="btn">Lọc</button>
    </Form>
  );
}

export default function Phones({ loaderData: d }: Route.ComponentProps) {
  const pageUrl = (p: number) => {
    const sp = new URLSearchParams(d.query);
    sp.set("page", String(p));
    return `?${sp}`;
  };
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{d.filters.q ? `Kết quả cho "${d.filters.q}"` : "Điện thoại"} ({d.total})</h1>
      <FilterForm f={d.filters} brands={d.brands} />
      {d.items.length ? <Grid items={d.items} /> : <p>Không có sản phẩm phù hợp.</p>}
      {d.pages > 1 && (
        <nav className="flex gap-2">
          {Array.from({ length: d.pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} to={pageUrl(p)} className={p === d.filters.page ? "btn" : "btn-ghost"}>
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
