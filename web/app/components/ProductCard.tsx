import { Link } from "react-router";
import type { Card } from "~/lib/products.server";
import { Price } from "./Price";

export const COMPARE_KEY = "compare";

function addToCompare(slug: string) {
  const list: string[] = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
  const next = [slug, ...list.filter((s) => s !== slug)].slice(0, 3);
  localStorage.setItem(COMPARE_KEY, JSON.stringify(next));
  location.href = `/compare?slugs=${next.join(",")}`;
}

export function ProductCard({ p }: { p: Card }) {
  return (
    <div className="card flex flex-col gap-2">
      <Link to={`/phones/${p.slug}`} className="flex flex-col gap-2">
        <img src={`/images/${p.images[0]}`} alt={p.name} loading="lazy" className="aspect-square w-full object-contain" />
        <h3 className="font-medium">{p.name}</h3>
        <Price price={p.minPrice} sale={p.sale} />
        {p.numReviews > 0 && <span className="text-xs text-gray-500">★ {p.rating.toFixed(1)} ({p.numReviews})</span>}
      </Link>
      <button type="button" onClick={() => addToCompare(p.slug)} className="mt-auto text-left text-xs text-blue-600">
        + So sánh
      </button>
    </div>
  );
}

export function Grid({ items }: { items: Card[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p._id} p={p} />
      ))}
    </div>
  );
}
