# Phase 1: Off Cloudflare runtime

Priority: P1. Status: Pending. Effort: 6h. Needs: phase 0 (table, bucket, CloudFront).

## Overview

Remove every Cloudflare binding from `web/` and run the app as a plain Node server. Data still uses MongoDB in this phase so the app keeps working end to end; phase 2 swaps the DB.

## Files

* Delete: `wrangler.jsonc`, `workers/app.ts`, `worker-configuration.d.ts`, `tsconfig.cloudflare.json`, `app/routes/images.$.tsx` (+ its line in `app/routes.ts`).
* Change: `package.json`, `vite.config.ts`, `tsconfig.json`, `.gitignore`, `app/lib/{db,session,guard,payment,images,cache,password}.server.ts`, routes that call `purge`/`purgeOrder` (`phones.$slug`, `checkout`, `api.momo.ipn`, `api.vnpay.ipn`, `admin.products.$id`, `admin.orders`), `scripts/seed.mjs` (images part only).
* New: `app/lib/env.server.ts`, `app/lib/aws.server.ts`, `.env.example`.

## Steps

### 1. Build and entry

* `package.json`: remove `@cloudflare/vite-plugin`, `wrangler`, `postinstall`, `cf-typegen`, `local`, `deploy`. Add `@react-router/node`, `@react-router/serve`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-s3`, `@aws-sdk/client-ssm`, `@aws-sdk/client-cloudfront`. Scripts: `build`, `dev`, `start: react-router-serve ./build/server/index.js`, `typecheck: react-router typegen && tsc`.
* `vite.config.ts`: drop the `cloudflare()` plugin. Add `server.proxy: { "/images": process.env.CDN_URL }` so local dev shows images from the CloudFront of phase 0.
* Lambda later runs `react-router-serve` via the Web Adapter (`AWS_LWA_PORT=3000`, handler `run.sh`), so no Lambda specific code in the app.

### 2. Env: `env.server.ts`

```ts
// Lambda: SSM /phoneshop/* once per cold start. Local: process.env (.env, never in git).
const KEYS = ["SESSION_SECRET", "ORIGIN_SECRET", "APP_URL", "TABLE", "BUCKET", "DISTRIBUTION_ID", "MOMO_PARTNER_CODE", "MOMO_ACCESS_KEY", "MOMO_SECRET_KEY", "VNP_TMN_CODE", "VNP_HASH_SECRET", "TURNSTILE_SECRET", "MONGODB_URI"] as const;
export const env: Record<(typeof KEYS)[number], string> = await load(); // GetParametersByPath WithDecryption, paginate
```

* Load from SSM only when `process.env.SSM_PREFIX` is set (Lambda env var from Terraform). Throw at start if a required key is missing, so a bad deploy fails loudly.
* Replace `import { env } from "cloudflare:workers"` in db, session, guard, payment, images.

### 3. Origin secret

* In `entry.server.tsx` (or a root middleware): when `env.ORIGIN_SECRET` is set and header `x-origin-secret` does not match (use `safeEqual`), return 403. Skipped locally.

### 4. AWS clients: `aws.server.ts`

* Module scope `S3Client`, `CloudFrontClient`, `DynamoDBDocumentClient` (region from `AWS_REGION`). Phase 2 reuses the Dynamo client.

### 5. Images

* `images.server.ts`: `saveImage` keeps size check + byte sniff, then `PutObject` to `images/products/<uuid>.<ext>` with `ContentType`. Return value stays the key without the `images/` prefix, so stored keys and `/images/<key>` URLs do not change.
* Remove `getImage` and the route. CloudFront serves `/images/*`.
* SVG seed images need the old headers: CloudFront response headers policy on `/images/*` with `X-Content-Type-Options: nosniff` and `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'` (done in phase 3 Terraform; phase 0 spike works without it).
* `seed.mjs`: drop the R2 upload part (Terraform uploads seed images).

### 6. Cache purge

* `cache.server.ts`: `purge(slugs)` sends `CreateInvalidation` for `/`, `/phones*`, and `/phones/<slug>` per slug, `CallerReference = Date.now()`. Fire and forget with `.catch(console.error)`. No op when `DISTRIBUTION_ID` is empty (local).
* Remove `workerCtx` and the `context` argument; update the 6 callers. Drop `Cache-Tag` headers in `_index`, `phones._index`, `phones.$slug`.
* Keep `CATALOG_CACHE` (`public, max-age=60, stale-while-revalidate=600`). CloudFront honors origin `Cache-Control` with a cache policy that has min TTL 0 (phase 3).
* Invalidations: first 1000 paths per month free, wildcard counts as 1 (UNVERIFIED). Each order adds a few paths. Fine for a demo.

### 7. Client IP + limiter

* `ip(request)`: first part of `CloudFront-Viewer-Address` (`ip:port`, IPv6 has colons, split on the last `:`), fallback `"local"`. Use it in `guard` and in `payment.server.ts` for `vnp_IpAddr`.
* `limit(request, name)`: `UpdateItem` key `PK = RATE#<name>#<ip>`, `SK = <current minute>`, `ADD n :1`, `SET ttl = :now + 120`, `ReturnValues UPDATED_NEW`. Over 10 = throw the same 429. Same limit as the Workers binding.

### 8. Turnstile

* Keep code as is. Hostname: if gate D says `cloudfront.net` works in the widget list, use it. Else plan B: Turnstile test keys on the disposable stack (always pass; the limiter is the only guard). Pick 1 and note it here.

### 9. Mongo bridge for this phase only

* `db.server.ts`: drop `runRequest`/`AsyncLocalStorage`, use 1 module scope `MongoClient` (normal Node pooling). Deleted in phase 2.

### 10. Password

* `password.server.ts` and `seed.mjs`: `ITERATIONS = 600_000` (OWASP number for PBKDF2 SHA256, UNVERIFIED current value). Old hashes still verify because the count is stored per hash.

## Success Criteria

* `npm run build && npm start` serves the shop locally against Atlas; `npm run typecheck` passes with no `cloudflare:` imports left (`grep -rn cloudflare app` empty except Turnstile).
* Admin image upload lands in S3 and shows via `/images/...` through the dev proxy.
* 11th login POST within 1 minute returns 429; counter items vanish after TTL (can take up to 48 h, UNVERIFIED, does not matter).
* Login still works for a user made before the iteration change.

## Risks

* Top level await in `env.server.ts` needs ESM server build (default in React Router v8).
* `react-router-serve` serves `build/client` too, so favicon and other root files come from Lambda; only `/assets/*` and `/images/*` hit S3.
