# Phase 1: Catalog (schema, seed, SSR pages, R2, SEO)

Priority: P1. Status: Pending. Effort: 8h. Needs: phase 0 gates passed.

## Overview

Public read only shop: home, phone list with filters, phone detail with variant picker. Data seeded by script. Images in R2.

## Requirements

* Variants by color and storage, each with own SKU, price, stock.
* Filters: brand, price range, RAM, storage. Sort: price, newest. Pagination.
* SEO: SSR html, meta tags, `JSON-LD` Product, sitemap, robots.
* Prices shown in VND (`Intl.NumberFormat("vi-VN")`).

## Data model

Collection `products` (1 document per phone model):

```ts
{
  _id, slug,                 // unique, used in URL
  name, brand, description,
  images: string[],          // R2 keys
  specs: { screen: string, chip: string, ram: number, battery: number, os: string, camera: string }, // ram in GB
  variants: [{ sku, color, storage: number, price: number, stock: number, image?: string }], // storage in GB
  minPrice: number,          // lowest variant price, written on every save, used by filter and sort
  sale: { isOnSale, saleType, saleValue, saleStartDate, saleEndDate }, // same shape as today, keeps saleUtils
  rating: 0, numReviews: 0, isActive: true, createdAt
}
```

Indexes: `slug` unique, `variants.sku` unique, `brand`, `minPrice`, `specs.ram`.

Fixed spec fields, not the attribute pattern: only 1 product type exists (YAGNI).

## Files

Create in `web/`:
* `app/lib/sale.ts`: move `backend/utils/saleUtils.js` here, apply to a variant price. This removes the duplicate copy in `frontend/src/utils/`.
* `app/lib/products.server.ts`: `listProducts(filters)`, `getProductBySlug(slug)`, `listBrands()`.
* `app/lib/format.ts`: `formatVnd`.
* `app/routes/_index.tsx`: banner, on sale, newest.
* `app/routes/phones._index.tsx`: list. Filters come from URL search params; the filter form is a plain GET form.
* `app/routes/phones.$slug.tsx`: detail. Selected variant from `?sku=`. Specs table. `meta` export + `JSON-LD` with `AggregateOffer`.
* `app/routes/images.$.tsx`: resource route, reads `env.IMAGES.get(key)`, returns body with `Cache-Control: public, max-age=31536000, immutable`. 404 when missing.
* `app/routes/sitemap[.]xml.tsx`, `app/routes/robots[.]txt.tsx`.
* `app/components/`: `Header`, `Footer`, `ProductCard`, `FilterForm`, `VariantPicker`, `Price`, `Pagination`.
* `scripts/seed.mjs`: Node script, `node --env-file=.dev.vars scripts/seed.mjs`. Inserts about 20 phones.
* `wrangler.jsonc`: add R2 binding `IMAGES` to bucket `phoneshop-images`.

Delete: `app/routes/health.tsx` at the end of this phase.

## Steps

1. `npx wrangler r2 bucket create phoneshop-images`, add binding.
2. Write `sale.ts` and `format.ts`.
3. Write `seed.mjs`. It must refuse to run unless the DB name is `phoneshop`, then drop and recreate `products` and its indexes. Seed images: upload files from `web/seed-images/` with `wrangler r2 object put`. If no real photos, use 1 placeholder SVG.
4. Write `products.server.ts`. Filter query sketch:

```ts
const q: any = { isActive: true };
if (brand) q.brand = brand;
if (ram) q["specs.ram"] = Number(ram);
if (storage) q["variants.storage"] = Number(storage);
if (min || max) q.minPrice = { ...(min && { $gte: +min }), ...(max && { $lte: +max }) };
```

5. Validate every search param in the loader (numbers finite and positive, sort in an allow list, page capped). Bad input falls back to defaults, never reaches the query raw.
6. Build routes and components. Mobile first layout.
7. SEO routes. Sitemap lists `/`, `/phones`, every active slug.
8. Remove `/health`. Run `npm run build` and `npx wrangler dev`, click through.

## Todo

- [ ] R2 bucket + binding
- [ ] `sale.ts`, `format.ts`
- [ ] Seeder with DB name guard
- [ ] `products.server.ts` with validated filters
- [ ] Home, list, detail routes
- [ ] Image resource route
- [ ] Sitemap, robots, `JSON-LD`
- [ ] `/health` removed

## Success criteria

* View source of `/phones/<slug>` shows product name, price and `JSON-LD` in the html (SSR works).
* Picking a color and storage changes price, stock label and URL `?sku=`.
* Each filter alone and combined returns the right phones; a bad param such as `?ram=abc` does not error.
* Rich Results Test accepts the product page (after deploy).
* `npm run build` and `npm run typecheck` pass.

## Risks

* Phone photos have copyright. Use own photos, press kit images, or placeholders.
* Root layout must not read the session (phase 6 caches these pages). Header user and cart state come later from a client fetch.

## Security

* Search params are untrusted: cast and allow list before building the query (no operator injection through `?brand[$ne]=`).
* Image route only reads keys from R2; no path goes to a file system.

## Next

Phase 2 adds writes: users, cart, orders, admin.
