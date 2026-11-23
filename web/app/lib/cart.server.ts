import { allProducts, getProducts } from "./products.server";
import { salePrice } from "./sale";
import type { CartLine } from "./session.server";
import { MAX_LINES, MAX_QTY } from "./shop";

export type ResolvedLine = {
  productId: string;
  slug: string;
  sku: string;
  name: string;
  color: string;
  storage: number;
  price: number; // after sale, from the DB
  stock: number;
  qty: number;
  image: string;
  idx: number; // variant index in the product item, used by the stock update
};

// Turn session lines (sku + qty) into fresh DB data. Unknown or inactive SKUs are dropped.
export async function resolveCart(lines: CartLine[]): Promise<ResolvedLine[]> {
  if (!lines.length) return [];
  const all = await allProducts();
  const ids = new Set(lines.flatMap((l) => all.find((p) => p.variants.some((v) => v.sku === l.sku))?._id ?? []));
  const docs = (await getProducts([...ids])).filter((p) => p.isActive);
  return lines.flatMap((l) => {
    const p = docs.find((d) => d.variants.some((v) => v.sku === l.sku));
    const idx = p ? p.variants.findIndex((x) => x.sku === l.sku) : -1;
    if (!p || idx < 0) return [];
    const v = p.variants[idx];
    return [{
      productId: p._id,
      slug: p.slug,
      sku: v.sku,
      name: p.name,
      color: v.color,
      storage: v.storage,
      price: salePrice(v.price, p.sale),
      stock: v.stock,
      qty: Math.min(l.qty, MAX_QTY),
      image: v.image ?? p.images[0],
      idx,
    }];
  });
}

// Add or set qty for 1 SKU. qty 0 removes the line.
export function setLine(lines: CartLine[], sku: string, qty: number, add: boolean): CartLine[] {
  const cur = lines.find((l) => l.sku === sku)?.qty ?? 0;
  const next = Math.max(0, Math.min(MAX_QTY, add ? cur + qty : qty));
  const rest = lines.filter((l) => l.sku !== sku);
  return next ? [...rest, { sku, qty: next }].slice(-MAX_LINES) : rest;
}

export const itemsTotal = (lines: ResolvedLine[]) => lines.reduce((s, l) => s + l.price * l.qty, 0);
