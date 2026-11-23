# Phase 2: DynamoDB data layer

Priority: P1. Status: Pending. Effort: 12h. Needs: phase 1.

## Overview

Replace MongoDB with 1 DynamoDB table. Same behavior, same Vietnamese error texts, same invariants: prices from the DB, stock never below 0, coupon never over limit, cancel restocks once, 1 review per user per product, 1 IMEI in at most 1 order.

## Files

* Rewrite: `app/lib/{db,products,cart,orders,coupons,reviews,leads,auth,payment}.server.ts`, `scripts/seed.mjs`.
* Routes with direct DB calls (`grep -rn withDb app/routes`): `sitemap[.]xml`, `login`, `register`, `cart`, `orders._index`, `orders.$code`, `pay.$code`, `api.vnpay.ipn`, `checkout`, `compare`, `bao-hanh`, `admin.products._index`, `admin.products.$id`, `admin.orders`, `admin.users`, `admin.coupons`, `admin.leads`. Move each query into a named function in the matching lib file, so routes stop touching the DB client.
* Remove dep: `mongodb`. Remove `MONGODB_URI` everywhere.

## Table

Keys `PK`, `SK`. GSI1 (`GSI1PK`, `GSI1SK`), GSI2 (`GSI2PK`, `GSI2SK`). Dates as ISO strings. `_id` fields stay as plain string ids in loader data.

| Entity | PK | SK | GSI1 | GSI2 |
|--------|----|----|------|------|
| Product | `PRODUCT` | `<id>` | | |
| User | `USER` | `<id>` | | |
| Email lock | `EMAIL#<email>` | `-` | | |
| Order | `ORDER#<code>` | `-` | `USER#<userId>` / `<createdAt>` | `ORDER` / `<createdAt>` |
| IMEI lock | `IMEI#<imei>` | `-` | | |
| Review | `REVIEW#<productId>` | `<userId>` | | |
| Coupon | `COUPON` | `<CODE>` | | |
| Lead | `LEAD` | `<createdAt>#<id>` | | |
| Rate counter | `RATE#<name>#<ip>` | `<minute>` | | |

Product: `variants` becomes a map `{ [sku]: Variant }`. Keep the `Variant[]` shape for callers with 1 helper `variantList(p)` sorted by storage then color, so UI code does not change. Add `ratingSum`; `rating` is computed on read.

## Steps

### 1. `db.server.ts`

* Export `ddb` (from `aws.server.ts`), `TABLE`, and 3 small helpers only if used 3+ times: `get(pk, sk)`, `queryAll(params)` (follows `LastEvaluatedKey`), `isCondFail(e)` (`ConditionalCheckFailedException` or `TransactionCanceledException`). No generic repository layer.

### 2. Catalog (`products.server.ts`)

* `allProducts()`: module scope `{ at, items }`, reload with `queryAll({ PK = PRODUCT })` when older than 60 s. `invalidateCatalog()` resets it (called after admin save).
* `listProducts(f)`, `listBrands()`, `homeData()`, sitemap, compare: pure JS over `allProducts()`. Search = case insensitive `includes` on name and brand (Vietnamese text: also compare after `normalize("NFD")` and stripping marks, so "dien thoai" finds "điện thoại"). Same filters, sorts, page size 12, `total`, `pages`.
* `getProductBySlug(slug)`: find id in `allProducts()`, then `GetItem` for fresh stock and price. Detail page shows fresh data.
* shortcut: whole catalog in memory, fine for hundreds of phones, move to a search service at a few thousand.

### 3. Cart (`cart.server.ts`)

* `resolveCart(lines)`: map SKU to product id via `allProducts()`, then `BatchGetItem` those products (fresh price, stock, `isActive`). Same output shape. No `session` arg.

### 4. Orders (`orders.server.ts`)

* `placeOrder`:
  1. `resolveCart`, empty = same UserError.
  2. Group lines by `productId`. 1 `Update` per product: for each SKU `SET variants.#sN.stock = variants.#sN.stock - :qN`, condition `variants.#sN.stock >= :qN` joined with AND, plus `isActive = :true`.
  3. Coupon `Update` (if code): key `COUPON/<CODE>`, `ADD used :1`, condition `active = :true AND used < usageLimit AND startsAt <= :now AND endsAt >= :now`. Read the coupon first to compute the discount and give clear errors (not found, expired, min order) before the transaction, like today.
  4. Order `Put` with `attribute_not_exists(PK)`, GSI keys set.
  5. 1 `TransactWriteItems`. On `TransactionCanceledException`, read `CancellationReasons[i]`: index of a product update = "`<name> <color> <storage>GB` đã hết hàng." (name the first SKU of that product with not enough stock, from the fresh read), coupon index = "Mã giảm giá đã hết lượt dùng.". Order code collision = retry once with a new code.
  * Limit: 100 items per transaction. `MAX_LINES` keeps it far below.
* `cancelOrder(code, from)`: `GetItem` order, then transaction: order `Update` status cancelled + `list_append` statusHistory with condition `#s IN (:a, :b...)`, restock `Update` per product (grouped, `ADD`-style `SET stock = stock + :q`), coupon release `ADD used :-1` with condition `used > :0`. Condition fail on the order = return null (already cancelled). Return the order.
* `moveOrder(o, to, items?)`: `Update` with condition `#s = :from`. If `items` has new IMEIs: transaction of order update + 1 `Put` per new IMEI `IMEI#<imei>` with `attribute_not_exists(PK)`, value `{ code }`. Cancel reason on an IMEI put = "IMEI đã được dùng cho đơn khác.", on the order = "Đơn đã đổi trạng thái, tải lại trang.". The admin page pre check (`admin.orders.tsx:27`) becomes `BatchGetItem` of the IMEI locks.
* My orders: Query GSI1 `USER#<id>`, `ScanIndexForward = false`, `Limit 50`. Order page: `GetItem` then check `userId` (404 if not owner).
* Admin orders: Query GSI2 `ORDER`, desc, filter status in JS after paging up to 100 matches.

### 5. Payment (`payment.server.ts`)

* `markPaid(ref, amount, paymentRef)`: `Update` `ORDER#<code>` set paid fields + history, condition `attribute_exists(PK) AND #s = :pending AND totals.#t = :amount`. On condition fail, `GetItem` and return `not_found` / `bad_amount` / `already` exactly like today.
* `api.vnpay.ipn` lookup = `GetItem`.

### 6. Reviews

* `listReviews(productId, page)`: Query `REVIEW#<productId>`, sort by `createdAt` desc in JS, slice page, strip `userId`.
* `addReview`: Query GSI1 for the user's orders, need 1 with status delivered whose items include the productId (else same UserError). Transaction: `Put` review condition `attribute_not_exists(SK)` + product `Update` `ADD ratingSum :r, numReviews :1`. Cancel on the put = "Bạn đã đánh giá sản phẩm này.".

### 7. Users, coupons, leads

* Register: transaction `Put` `USER/<id>` + `Put` `EMAIL#<email>/-` `{ userId }`, both `attribute_not_exists(PK)`. Cancel on the lock = same "email exists" message as today.
* Login: `GetItem` email lock, then user. `getUser`: `GetItem USER/<id>`, strip `passwordHash`. Admin users: Query `USER`, sort desc in JS, 200.
* Coupons admin: Query `COUPON`, sort by `endsAt` desc in JS. Create: `Put` condition `attribute_not_exists(SK)`. Toggle: read, then `Update active = :new` condition `active = :old`.
* Leads: `Put LEAD/<createdAt>#<id>`. Admin list: Query desc, 200. Status update: the form posts the SK instead of `_id`.

### 8. Admin product save

* Slug and SKU unique: check against a fresh `queryAll(PRODUCT)` (not the cache). shortcut: race between 2 admins possible, add lock items if more admins.
* Create: `Put` condition `attribute_not_exists(SK)`. Edit: `Put` full item but keep `ratingSum`, `numReviews`, `createdAt` from the old item. Then `invalidateCatalog()` + `purge`.

### 9. `seed.mjs`

* Env: `TABLE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AWS_REGION`. Refuse unless `TABLE` starts with `phoneshop`.
* `BatchWriteItem` in chunks of 25, retry `UnprocessedItems`: products, 2 coupons, admin user + email lock (`isAdmin: true`, same id each run from a hash of the email so reruns overwrite instead of duplicating).
* Idempotent: Put overwrites, so a rerun is safe. Product image keys `seed/placeholder.svg` as today.

## Success Criteria

* `grep -rn mongodb web/app web/scripts web/package.json` is empty.
* Manual checks: register (and duplicate email), login, search "iphone" and a Vietnamese term, filters + sort + pagination, cart, COD checkout, out of stock message when qty > stock, 2 SKUs of 1 phone in 1 cart, coupon `MOTLAN` works once then "hết lượt", cancel restocks once (cancel twice in 2 tabs), review once, admin status move, IMEI duplicate error, warranty lookup by IMEI, admin coupon toggle, lead create + status.

## Risks

* `placeOrder` and `cancelOrder` correctness. Test the 2 tab cases by hand.
* Reserved words (`status`, `name`, `used`, `active`, `ttl`): always use `ExpressionAttributeNames`.
* GSI reads are eventually consistent: a new order may show in "my orders" a moment late. Acceptable.
