# Phase 6: Hardening, cache, deploy, cleanup

Priority: P2. Status: Pending. Effort: 6h. Needs: phases 1 to 5.

## Overview

Make public pages fast with the edge cache, protect forms from bots, set up deploy on push, then remove the old app. Every step here is independent; do them in this order and stop when good enough.

## 1. Edge cache for catalog pages

* Verified: React Router has no ISR. Use Workers Cache (`cache: { enabled: true }` in wrangler, needs Wrangler 4.69.0+). Headers alone do nothing until it is enabled.
* Add a `headers` export to home, list, detail: `Cache-Control: public, max-age=60, stale-while-revalidate=600`. Do NOT use `s-maxage` (it turns off stale while revalidate).
* Detail page also sends `Cache-Tag: product-<slug>`.
* Purge by tag when a product changes: admin save, and stock change in place order and cancel. API is `ctx.cache.purge`; exact call shape is UNVERIFIED, read `developers.cloudflare.com/workers/cache/purge/` first.
* A response with `Set-Cookie` skips the cache. Check that catalog routes never commit the session.
* 1 community thread reports the headers not working. Verify with `curl -I` and the cache status header before relying on it.

## 2. Bot and abuse protection

* Turnstile widget on login, register, lead forms. Server check in the action: POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify`. 1 helper `verifyTurnstile(token, ip)` in `app/lib/turnstile.server.ts`.
* Rate Limiting binding (Workers only feature) in `wrangler.jsonc`. 1 helper `limit(request, name)` keyed by IP + route name. Apply to: login, register, coupon apply, IMEI lookup, lead forms. Config shape UNVERIFIED, read the Workers rate limit docs.
* Login rate limit matters more than usual here because the password hash is cheap by choice.
* WAF: turn on the free managed ruleset in the dashboard (needs a custom domain on a Cloudflare zone). Skip if using `workers.dev`.

## 3. Deploy

* UNVERIFIED: Workers Builds. Connect the GitHub repo in the dashboard, root directory `web`, build `npm run build`, deploy `npx wrangler deploy`. Non production branches get preview URLs.
* Fallback if Workers Builds does not fit: 1 GitHub Actions job with `cloudflare/wrangler-action`.
* Secrets set once with `npx wrangler secret put <NAME>` (list in `plan.md`). `APP_URL` must be the production URL so MoMo and VNPay call back to the right host.
* Update IPN and return URLs in the MoMo and VNPay sandbox merchant settings.
* Logs: `observability.enabled` is already on from phase 0.

## 4. GHN shipping fee (optional, last)

* UNVERIFIED: GHN has a sandbox API and token. If the token takes more than a few minutes to get, skip this step.
* Replace the flat fee constant with a call to the GHN fee API in checkout. Address fields become province, district, ward selects fed by GHN master data (cache the 3 lists with long `Cache-Control`).
* On any GHN error, fall back to the flat fee. Checkout must never fail because of shipping.

## 5. Durable Object for MongoDB (only if gate C failed)

* Verified pattern: keep `MongoClient` in 1 Durable Object with `locationHint: "apac-se"`, about 35 ms warm.
* The client cannot cross RPC, so `withDb` callers would move into DO methods. This is a real refactor of every `*.server.ts`. Do it only with numbers from production showing the need, since step 1 already hides most latency for catalog pages.

## 6. Cleanup (needs explicit user OK each)

* Delete `backend/`, `frontend/`, root `package.json`, `package-lock.json`, `.env_template`, `uploads/`.
* Drop the old database in Atlas.
* Both are destructive and are NOT done as part of the earlier steps. Ask the user first.

## Todo

- [ ] Workers Cache + headers + purge by tag
- [ ] Turnstile on auth and lead forms
- [ ] Rate limits
- [ ] Deploy on push + preview URLs
- [ ] Production secrets and gateway callback URLs
- [ ] GHN fee (optional)
- [ ] Durable Object (only if needed)
- [ ] Cleanup of old app (after user OK)

## Success criteria

* `curl -I` on a product page twice: second response is a cache hit. After an admin price edit the new price shows within 1 request cycle.
* Logged in user and guest get the same cached html; the header still shows the right name and cart count (from `/me`).
* Login without a Turnstile token is rejected. 20 fast login attempts get rate limited.
* Push to a branch gives a preview URL; merge to master deploys production.
* Full purchase with MoMo and with VNPay works on the production URL.

## Risks

* A cached page with user data would leak it to everyone. The rule from phase 1 (no session in catalog loaders) is the guard; check it again here.
* Stale stock on cached pages for up to 60 seconds. Place order checks real stock, so no oversell, only a late "het hang" message.
* Purge on every order adds 1 subrequest per item; fine at this scale.

## Security

* Turnstile and rate limit close the open points noted in phases 2 and 5.
* Secrets only in Wrangler secrets. Check `git status` shows no `.dev.vars` before the user commits.

## Next

Project complete. Later upgrades, only when needed: raise PBKDF2 iterations on a paid plan, Cron Trigger for expired pending orders, real finance partner API.
