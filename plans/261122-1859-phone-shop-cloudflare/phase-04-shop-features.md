# Phase 4: Shop features (search, reviews, coupons, flash sale, compare, tracking)

Priority: P2. Status: Pending. Effort: 10h. Needs: phase 3.

## Overview

6 small features. Each is independent and can ship alone, in this order.

## 1. Search

* UNVERIFIED: Atlas Search is available on M0. Check the Atlas UI first.
* If yes: 1 search index on `name` and `brand`; `$search` stage with `text` + `fuzzy: { maxEdits: 1 }` at the front of the list pipeline.
* If no: `{ name: { $regex: escapeRegex(q), $options: "i" } }`. Escape the user input.
* Header search form is a GET form to `/phones?q=`. It reuses the list route and all filters. No new route, no autocomplete (YAGNI).

## 2. Reviews

* Collection `reviews`: `{ productId, userId, name, rating (1 to 5), comment, createdAt }`. Unique index `(productId, userId)`.
* Separate collection, not embedded like today: an embedded array grows without limit.
* Only a user with a `delivered` order containing the product can post.
* After insert: recompute `rating` and `numReviews` on the product with 1 aggregation.
* Shown on the detail page, 10 per page. `JSON-LD` gets `aggregateRating` when `numReviews > 0`.

## 3. Coupons

* Collection `coupons`: `{ code (unique, uppercase), type: "percent" | "fixed", value, minOrder, maxDiscount?, startsAt, endsAt, usageLimit, used }`.
* Checkout: coupon field; discount computed on the server in the place order transaction.
* Usage claim is atomic: `updateOne({ code, used: { $lt: usageLimit }, startsAt: { $lte: now }, endsAt: { $gte: now } }, { $inc: { used: 1 } })`. 0 modified means invalid.
* Cancel of an order gives the usage back (`$inc: -1`) inside the shared cancel function.
* Admin: `routes/admin.coupons.tsx`, list + create + disable.

## 4. Flash sale

* No new system. It is the existing `sale` window on a product (`sale.ts` from phase 1).
* Home page section "Flash sale": products where the sale is active now, sorted by `saleEndDate`.
* 1 small client component `Countdown` (the only new code).
* Admin sets it in the product edit form from phase 2.

## 5. Compare

* Route `routes/compare.tsx`: `/compare?slugs=a,b,c`, max 3. Loader fetches the products, renders specs side by side.
* "So sanh" button on cards stores slugs in `localStorage` and links to the route. No server state.

## 6. Order tracking

* `routes/orders.$code.tsx` renders `statusHistory` as a timeline. Data already exists from phase 2.
* No public lookup by phone number (privacy, and nobody asked).

## Files

Create in `web/app/`: `lib/reviews.server.ts`, `lib/coupons.server.ts`, `routes/compare.tsx`, `routes/admin.coupons.tsx`, `components/Countdown.tsx`, `components/ReviewList.tsx`, `components/ReviewForm.tsx`, `components/Timeline.tsx`.

Modify: `lib/products.server.ts` (search), `routes/phones.$slug.tsx` (reviews), `routes/checkout.tsx` + `lib/orders.server.ts` (coupon), `routes/_index.tsx` (flash sale), `components/Header.tsx` (search box), `components/ProductCard.tsx` (compare button), `scripts/seed.mjs` (2 sample coupons).

## Todo

- [ ] Search (Atlas Search or regex)
- [ ] Reviews with buyer check
- [ ] Coupons with atomic usage
- [ ] Flash sale section + countdown
- [ ] Compare page
- [ ] Order timeline

## Success criteria

* Search "ipone" finds iPhone (Atlas Search path) or "iphone" finds it (regex path); `q=.*` and `q=(` do not error.
* A user without a delivered order cannot review; a second review by the same user is rejected.
* Coupon with `usageLimit: 1` used by 2 browsers at once: 1 order gets the discount.
* Expired coupon and order under `minOrder` are rejected with a clear message.
* Flash sale section disappears when the window ends, without a deploy.
* Compare shows 3 phones; a 4th slug is ignored.

## Risks

* M0 limits for Atlas Search are unknown here. The regex fallback keeps the feature alive.
* Discount larger than the order: clamp total at 0, and cap percent coupons with `maxDiscount`.

## Security

* Review comment rendered as text by React (no `dangerouslySetInnerHTML`).
* Coupon discount never trusted from the form; only the code is.
* Regex input escaped to stop slow regex attacks.

## Next

Phase 5 adds the 3 phone store features.
