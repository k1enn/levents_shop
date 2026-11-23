import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { batchGet, ddb, get, now, queryPk, TABLE } from "./db.server";
import { isSaleActive, type Sale } from "./sale";

export type Variant = { sku: string; color: string; storage: number; price: number; stock: number; image?: string };
export type Product = {
  _id: string; // also the SK, keeps loader data plain JSON
  slug: string;
  name: string;
  brand: string;
  description: string;
  images: string[];
  specs: { screen: string; chip: string; ram: number; battery: number; os: string; camera: string };
  variants: Variant[];
  minPrice: number;
  sale?: Sale;
  ratingSum: number;
  rating: number; // computed on read from ratingSum / numReviews, not stored
  numReviews: number;
  isActive: boolean;
  createdAt: string;
};

export const PRODUCT = "PRODUCT";
const withRating = (p: Product): Product => ({ ...p, rating: p.numReviews ? Math.round((p.ratingSum / p.numReviews) * 10) / 10 : 0 });

// shortcut: whole catalog in Lambda memory for 60 s, fine for hundreds of phones, move to a search service at a few thousand.
let cache: { at: number; items: Promise<Product[]> } | undefined;
export function allProducts() {
  if (!cache || Date.now() - cache.at > 60_000) {
    const items = queryPk<Product>(PRODUCT).then((l) => l.map(withRating));
    items.catch(() => (cache = undefined));
    cache = { at: Date.now(), items };
  }
  return cache.items;
}
export const invalidateCatalog = () => (cache = undefined);
export const activeProducts = async () => (await allProducts()).filter((p) => p.isActive);

// Fresh reads for stock and price (cart, checkout, detail page).
export const getProduct = async (id: string) => {
  const p = await get<Product>(PRODUCT, id);
  return p && withRating(p);
};
export const getProducts = async (ids: string[]) => (await batchGet<Product>(ids.map((SK) => ({ PK: PRODUCT, SK })))).map(withRating);

export type Card = Pick<Product, "_id" | "slug" | "name" | "brand" | "images" | "minPrice" | "sale" | "rating" | "numReviews">;
const card = ({ _id, slug, name, brand, images, minPrice, sale, rating, numReviews }: Product): Card => ({ _id, slug, name, brand, images, minPrice, sale, rating, numReviews });

const PAGE_SIZE = 12;
const SORTS = {
  newest: (a: Product, b: Product) => b.createdAt.localeCompare(a.createdAt),
  price_asc: (a: Product, b: Product) => a.minPrice - b.minPrice,
  price_desc: (a: Product, b: Product) => b.minPrice - a.minPrice,
} as const;

const pos = (v: string | null) => {
  const n = Number(v);
  return v && Number.isFinite(n) && n > 0 ? n : undefined;
};
// Case and accent insensitive, so "dien thoai" finds "điện thoại".
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();

// Search params are untrusted: only plain strings and positive numbers reach the filter.
export function parseFilters(sp: URLSearchParams) {
  const sort = sp.get("sort") ?? "";
  return {
    q: (sp.get("q") ?? "").trim().slice(0, 50),
    brand: (sp.get("brand") ?? "").slice(0, 30),
    ram: pos(sp.get("ram")),
    storage: pos(sp.get("storage")),
    min: pos(sp.get("min")),
    max: pos(sp.get("max")),
    sort: (sort in SORTS ? sort : "newest") as keyof typeof SORTS,
    page: Math.min(Math.floor(pos(sp.get("page")) ?? 1), 100),
  };
}
export type Filters = ReturnType<typeof parseFilters>;

export async function listProducts(f: Filters) {
  const q = fold(f.q);
  const hits = (await activeProducts())
    .filter(
      (p) =>
        (!q || fold(p.name).includes(q) || fold(p.brand).includes(q)) &&
        (!f.brand || p.brand === f.brand) &&
        (!f.ram || p.specs.ram === f.ram) &&
        (!f.storage || p.variants.some((v) => v.storage === f.storage)) &&
        (!f.min || p.minPrice >= f.min) &&
        (!f.max || p.minPrice <= f.max),
    )
    .sort(SORTS[f.sort]);
  const items = hits.slice((f.page - 1) * PAGE_SIZE, f.page * PAGE_SIZE).map(card);
  return { items, total: hits.length, pages: Math.max(1, Math.ceil(hits.length / PAGE_SIZE)) };
}

// Slug lookup from the cache, then a fresh read so the detail page shows current stock and price.
export async function getProductBySlug(slug: string) {
  const hit = (await allProducts()).find((p) => p.slug === slug);
  const p = hit && (await getProduct(hit._id));
  return p?.isActive ? p : null;
}

export const listBrands = async () => [...new Set((await activeProducts()).map((p) => p.brand))].sort();

export async function homeData() {
  const active = await activeProducts();
  const flash = active
    .filter((p) => isSaleActive(p.sale))
    .sort((a, b) => String(a.sale!.saleEndDate).localeCompare(String(b.sale!.saleEndDate)))
    .slice(0, 8);
  return { flash: flash.map(card), newest: [...active].sort(SORTS.newest).slice(0, 8).map(card) };
}

export const minPrice = (variants: Variant[]) => Math.min(...variants.map((v) => v.price));

// Admin list: fresh, newest first.
export const adminProducts = async () => (await queryPk<Product>(PRODUCT)).sort(SORTS.newest);

type ProductInput = Omit<Product, "_id" | "ratingSum" | "rating" | "numReviews" | "createdAt">;

// Create (id "new") or replace. Slug and SKUs unique, checked on a fresh read.
// shortcut: 2 admins saving at the same moment can still race, add lock items if there are more admins.
export async function saveProduct(id: string, doc: ProductInput) {
  const all = await queryPk<Product>(PRODUCT);
  const old = all.find((p) => p._id === id);
  if (id !== "new" && !old) return { notFound: true as const };
  const skus = new Set(doc.variants.map((v) => v.sku));
  if (all.some((p) => p._id !== id && (p.slug === doc.slug || p.variants.some((v) => skus.has(v.sku))))) return { dup: true as const };
  const _id = old?._id ?? crypto.randomUUID();
  const keep = old ? { ratingSum: old.ratingSum ?? 0, numReviews: old.numReviews, createdAt: old.createdAt } : { ratingSum: 0, numReviews: 0, createdAt: now() };
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: { PK: PRODUCT, SK: _id, _id, ...doc, ...keep },
      ...(!old && { ConditionExpression: "attribute_not_exists(SK)" }),
    }),
  );
  invalidateCatalog();
  return { old };
}
