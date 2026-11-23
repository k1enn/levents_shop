import { Link } from "react-router";
import type { Card } from "~/lib/products.server";
import { salePrice } from "~/lib/sale";
import { Price } from "./Price";

export const COMPARE_KEY = "compare";

function addToCompare(slug: string) {
  const list: string[] = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
  const next = [slug, ...list.filter((s) => s !== slug)].slice(0, 3);
  localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  location.href = `/compare?slugs=${next.join(",")}`;
}

export function ProductCard({ p }: { p: Card }) {
  const off = Math.round((1 - salePrice(p.minPrice, p.sale) / p.minPrice) * 100);
  return (
    <div className="product-card py-3">
      <Link to={`/phones/${p.slug}`} className="group flex flex-1 flex-col">
        <div className="relative aspect-[1/1.2078] overflow-hidden rounded bg-muted">
          <img src={`/images/${p.images[0]}`} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          {off > 0 && <span className="absolute left-2 top-2 bg-black px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>}
        </div>
        <div className="mt-3 flex items-start justify-between gap-2">
          <h3 className="product-title p-0 normal-case tracking-[1px] group-hover:text-[#007bff]">{p.name}</h3>
          {p.numReviews > 0 && <span className="shrink-0 text-xs text-[#f0ad4e]">★ {p.rating.toFixed(1)}</span>}
        </div>
        <Price price={p.minPrice} sale={p.sale} className="mt-auto pt-4 text-base" />
      </Link>
      <button type="button" onClick={() => addToCompare(p.slug)} className="mt-2 self-start text-xs underline">
        + So sánh
      </button>
    </div>
  );
}

export function Grid({ items }: { items: Card[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p._id} p={p} />
      ))}
    </div>
  );
}
