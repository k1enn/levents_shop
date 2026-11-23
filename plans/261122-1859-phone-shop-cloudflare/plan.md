---
title: "Phone shop rewrite on Cloudflare Workers"
description: "Rewrite the MERN fashion shop as a phone shop: React Router v8 SSR on 1 Worker, MongoDB Atlas, R2, MoMo + VNPay sandbox."
status: superseded
priority: P1
effort: 47h
branch: master
tags: [feature, refactor, frontend, backend, database, infra]
blockedBy: []
supersededBy: 261123-aws-dynamodb
blocks: []
created: 2026-11-22
---

# Phone shop rewrite on Cloudflare Workers

## Overview

Superseded 2026-11-23 by `../261123-aws-dynamodb/plan.md` (AWS Lambda + DynamoDB + Terraform). Feature code from phases 1 to 5 carries over; phases 0 and 6 are replaced.

Portfolio project. Rewrite, not upgrade: new app in `web/`, old `backend/` and `frontend/` stay untouched until the final cleanup step. Sandbox payments only. Old fashion data is not migrated; the new app uses a new database name `phoneshop`, so old data is never touched by this plan.

Research report: deep research run `wf_322eae56-0c7` (2026-11-22). Items marked UNVERIFIED were not confirmed by that research and must be checked against official docs when the phase starts.

## Locked decisions

* 1 Worker, React Router v8 framework mode, SSR. Loaders and actions call MongoDB directly. No separate API layer.
* Workers, not Pages.
* MongoDB Atlas M0 in Singapore, official `mongodb` driver (6.15.0+), no Mongoose. Direct connection first; Durable Object only if phase 0 numbers demand it.
* Auth: React Router cookie session + PBKDF2 SHA256 via Web Crypto with a LOW iteration count (user choice, CPU limit of the free plan). No better-auth, no bcrypt.
* Cart in the cookie session. No Redux.
* Images in R2, served by a resource route. No Cloudflare Images.
* Payments: MoMo, VNPay, COD. No ZaloPay.
* Search: Atlas Search on M0 (UNVERIFIED), regex fallback.
* UI: Tailwind from the Cloudflare template. No react-bootstrap.
* Deploy: Workers Builds with GitHub (UNVERIFIED).
* Cut: ZaloPay, GHTK, Cloudflare Images, KV, Queues, Algolia, Meilisearch, Typesense, real finance company installment APIs.
* User rules: no tests, no docs, no journal. Each phase is checked by the manual steps in its Success Criteria.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 0 | [Spike: Worker + Atlas + limits](./phase-00-spike.md) | Local done, deploy gates open |
| 1 | [Catalog: schema, seed, SSR pages, R2, SEO](./phase-01-catalog.md) | Done (local) |
| 2 | [Auth, cart, COD checkout, orders, admin](./phase-02-auth-cart-orders-admin.md) | Done (local) |
| 3 | [Payments: MoMo + VNPay IPN](./phase-03-payments.md) | Done (local), sandbox run open |
| 4 | [Shop features: search, reviews, coupons, flash sale, compare, tracking](./phase-04-shop-features.md) | Done (local) |
| 5 | [Phone features: installment, trade in, IMEI warranty](./phase-05-phone-features.md) | Done (local) |
| 6 | [Hardening, cache, deploy, cleanup](./phase-06-hardening-deploy.md) | Code done, deploy + cleanup open |

Phases run in order. Phase 0 is a gate: its numbers can change phases 2 and 6.

## Dependencies

* User actions needed: `wrangler login`, Atlas account + M0 cluster in Singapore, VNPay sandbox merchant signup, MoMo test keys (already in `.env`), Turnstile site key, GHN sandbox token (optional).
* Node 22.22+ (machine has v26).
* Secrets: `MONGODB_URI`, `SESSION_SECRET`, `APP_URL`, `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `TURNSTILE_SECRET`.

## Top risks

* Free plan allows 10 ms CPU per request. SSR may exceed it. Gate in phase 0; fallback is Workers Paid (5 USD per month).
* About 300 ms per request for a fresh MongoDB connection (Cloudflare's number, not measured for Vietnam).
* Atlas must allow all IPs because Workers have no fixed IP. Protection is the DB user password only.
* Low PBKDF2 iteration count is weak against offline cracking if the DB leaks. Accepted for a portfolio; iteration count is stored in each hash so it can be raised later.
