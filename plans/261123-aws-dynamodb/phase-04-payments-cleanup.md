# Phase 4: Payments sandbox + cleanup

Priority: P2. Status: Pending. Effort: 2h. Needs: phase 3.

## Overview

Prove MoMo and VNPay sandbox work end to end on the disposable stack, then remove leftovers of the Cloudflare setup.

## Steps

### 1. MoMo

* `ipnUrl` and `redirectUrl` come from `APP_URL` per request, so a new CloudFront URL each apply needs no change.
* Run: checkout with MoMo, pay with the test wallet, IPN hits `/api/momo/ipn`, order becomes paid. Check CloudWatch logs for the IPN.

### 2. VNPay

* UNVERIFIED: does the sandbox merchant portal hold a fixed IPN URL? If yes, update it after each full apply (note the steps here), or demo VNPay with the return URL only and say so in the README demo notes.
* Run with the VNPay test card. `vnp_IpAddr` now comes from `CloudFront-Viewer-Address`.

### 3. Cleanup in `web/` (safe, part of this plan)

* Remove `.dev.vars.example`, Cloudflare lines in `.gitignore`, `tsconfig.cloudflare*`, any `wrangler` mention.
* `.env.example` lists the local keys from `env.server.ts`.

### 4. Old plan

* Cloudflare plan `261122-1859-phone-shop-cloudflare` already marked superseded (phases 0 and 6). Nothing else to do there.

### 5. Old app and Atlas (needs explicit user OK each)

* Delete `backend/`, `frontend/`, root `package.json`, `package-lock.json`, `.env_template`, `uploads/`.
* Delete the Atlas `phoneshop` DB and cluster (not used after phase 2).
* Both are destructive. Ask the user first, never as part of the steps above.

## Success Criteria

* 1 MoMo and 1 VNPay sandbox order reach status paid on a fresh `make up`.
* A failed or cancelled payment cancels the order and restocks once.
* `grep -rni "cloudflare\|wrangler" web --exclude-dir=node_modules` only hits Turnstile.

## Risks

* Gateways may block or slow `*.cloudfront.net` callback hosts (UNVERIFIED). If so, a custom domain comes back as a kept resource in bootstrap.
