# Phase 2: Auth, cart, COD checkout, orders, admin

Priority: P1. Status: Pending. Effort: 10h. Needs: phase 1.

## Overview

Users register and log in, add variants to a cart, check out with COD, see their orders. Admin manages products (with R2 upload), orders and sees users.

## Key insights

* User asked for a cheap password hash. Use PBKDF2 SHA256 from Web Crypto with a low iteration constant (10,000, or the value from phase 0 gate E). No dependency.
* Old bcrypt hashes are not migrated (old data is dropped), so the format is free.
* Cached pages (phase 6) cannot contain user data. So the root loader returns nothing per user; the header fetches `/me` on the client.

## Architecture

`app/lib/password.server.ts`:

```ts
// shortcut: low iteration count to fit the Workers free CPU limit, raise ITERATIONS when on a paid plan.
const ITERATIONS = 10_000;
// stored as: pbkdf2$<iterations>$<saltB64>$<hashB64>  (16 byte salt, 32 byte hash)
export async function hashPassword(pw: string): Promise<string>
export async function verifyPassword(pw: string, stored: string): Promise<boolean> // reads iterations from the string, compares with crypto.subtle.timingSafeEqual
```

`app/lib/session.server.ts`: `createCookieSessionStorage` with `httpOnly`, `secure`, `sameSite: "lax"`, secret `SESSION_SECRET`, 7 day max age. Session holds `userId` and `cart: [{ sku, qty }]` only.

`app/lib/auth.server.ts`: `getUser(request)`, `requireUser(request)` (redirect to `/login?next=`), `requireAdmin(request)` (404 for non admin). These replace `protect` and `admin` middleware.

Collections:

```ts
users:  { _id, email (unique, lowercase), name, passwordHash, isAdmin: false, createdAt }
orders: { _id, code (short unique), userId,
          items: [{ productId, sku, name, color, storage, price, qty, image, imei?: string }],
          shipping: { fullName, phone, province, district, ward, address },
          paymentMethod: "cod" | "momo" | "vnpay",
          status: "pending" | "paid" | "shipping" | "delivered" | "cancelled",
          statusHistory: [{ status, at }],
          totals: { items, shipping, discount, total },
          couponCode?, paymentRef?, paidAt?, createdAt }
```

Indexes: `users.email` unique, `orders.code` unique, `orders.userId`.

## Files

Create in `web/app/`:
* `lib/password.server.ts`, `lib/session.server.ts`, `lib/auth.server.ts`, `lib/cart.server.ts`, `lib/orders.server.ts`, `lib/validate.ts`.
* `routes/login.tsx`, `routes/register.tsx`, `routes/logout.tsx`, `routes/profile.tsx`.
* `routes/me.tsx`: resource route, returns `{ name, isAdmin, cartCount }` with `Cache-Control: private, no-store`.
* `routes/cart.tsx`: loader resolves SKUs to current name, price, stock. Actions: add, set qty, remove.
* `routes/checkout.tsx`: shipping form + payment method + place order.
* `routes/orders._index.tsx`, `routes/orders.$code.tsx`.
* `routes/admin.tsx` (layout with `requireAdmin`), `routes/admin.products._index.tsx`, `routes/admin.products.$id.tsx` (new and edit in 1 route, id `new`), `routes/admin.orders.tsx`, `routes/admin.users.tsx` (list only).

## Steps

1. Password, session, auth helpers.
2. Register and login actions: validate email format, password length 8+, generic error "Email hoac mat khau sai" on login.
3. `/me` + header client fetch (`useFetcher` load on mount).
4. Cart in session. Cap qty per line at variant stock and at 5.
5. Place order (the critical step). All inside 1 transaction (or conditional updates with rollback if gate D failed):
   * Load products by SKU from DB. Compute every price on the server with `sale.ts`. Never read price from the form.
   * For each line: `updateOne({ variants: { $elemMatch: { sku, stock: { $gte: qty } } } }, { $inc: { "variants.$.stock": -qty } })`. If `modifiedCount` is 0, abort with "het hang".
   * Insert order with `status: "pending"`, flat shipping fee constant.
   * Clear cart in session.
6. Order pages: user sees only own orders (`{ code, userId }` in the query, not a check after).
7. Admin products: form for base fields, specs, variants (add or remove rows), sale. Recompute `minPrice` on save.
8. Image upload in the admin product action: accept `image/jpeg`, `image/png`, `image/webp`, max 2 MB, key = `products/<uuid>.<ext>`, `env.IMAGES.put`. Ignore the client file name.
9. Admin orders: change status with allowed transitions only; push to `statusHistory`; cancel restocks the items.
10. First admin: seeder creates 1 admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.dev.vars`.

## Todo

- [ ] Password + session + auth helpers
- [ ] Register, login, logout, profile
- [ ] `/me` and header state
- [ ] Cart
- [ ] Place order with atomic stock
- [ ] User order pages
- [ ] Admin products with R2 upload
- [ ] Admin orders and users

## Success criteria

* Register, log out, log in works; wrong password fails; stored hash starts with `pbkdf2$`.
* 2 browsers buying the last unit at the same time: exactly 1 order succeeds, stock ends at 0, never negative.
* Editing the price in devtools before submit does not change the order total.
* A normal user opening `/admin` or another user's order gets 404.
* Uploading a `.html` file renamed to `.png` or a 5 MB file is rejected.

## Risks

* Cookie session size limit (4 KB): cart holds only sku and qty, capped at 20 lines.
* Low hash cost: see plan risks. Mitigation later in phase 6 with rate limit on login.

## Security

* All money and stock values come from the DB on the server.
* Authorization by ownership in every query. Admin routes guarded in the layout loader AND in each action.
* Mutations are POST only; `sameSite: lax` cookie blocks cross site form posts.
* Validate every form field at the action boundary in `validate.ts` (plain functions, no new dependency unless forms grow).

## Next

Phase 3 plugs MoMo and VNPay into the `pending` to `paid` transition.
