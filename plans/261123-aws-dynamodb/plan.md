---
title: "Phoneshop: Cloudflare Workers + Atlas to AWS Lambda + DynamoDB, disposable Terraform stack"
description: "Same React Router v8 SSR app in web/. Runtime Lambda, DB DynamoDB single table, S3 + CloudFront. infra/app goes up and down with make up / make down, seeded every time."
status: in-progress
priority: P1
effort: 30h
branch: master
tags: [infra, database, refactor]
blockedBy: []
blocks: []
created: 2026-11-23
---

# Phoneshop on AWS Lambda + DynamoDB (disposable)

## Overview

Move `web/` off Cloudflare. Features from the Cloudflare plan phases 1 to 5 stay as they are; only runtime, DB, storage, cache, limiter and deploy change. Architecture diagram + research: `plans/aws-architecture.html` (research run `wf_cb762a0c-17a`). DynamoDB, Terraform and Turnstile hostname items were not researched; UNVERIFIED items must be checked against docs when the phase starts.

## Cross-Plan Dependencies

| Relationship | Plan | Status |
|-------------|------|--------|
| Supersedes phases 0 and 6 of | [261122-1859-phone-shop-cloudflare](../261122-1859-phone-shop-cloudflare/plan.md) | superseded |

## Locked decisions

* Region ap-southeast-1. No VPC, NAT, EC2, public IPv4, custom domain, Route 53, ACM, WAF.
* Disposable: `make up` creates and seeds everything in `infra/app`, `make down` deletes it. `infra/bootstrap` (state bucket, OIDC role, budgets) is applied once and kept.
* Lambda Node + Lambda Web Adapter + `react-router-serve`, classic Function URL AuthType NONE, CloudFront adds a secret origin header the app checks.
* DynamoDB 1 table, on demand, TTL, no PITR. Catalog filtered in Lambda memory.
* S3 private behind CloudFront OAC for `/assets/*` and `/images/*`.
* Secrets in SSM Parameter Store, written by Terraform, read once per cold start. `APP_URL` goes through SSM to break the CloudFront/Lambda cycle.
* Terraform, AWS provider 6.x, S3 backend `use_lockfile = true`. Seed via `terraform_data` local-exec.
* GitHub Actions with OIDC: manual up and down workflows.
* Rate limit: DynamoDB counters. Turnstile stays (it is an HTTP API, works off Cloudflare).
* User rules: no tests, no docs, no journal. Each phase is checked by its manual Success Criteria.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 0 | [Bootstrap + spike](./phase-00-bootstrap-spike.md) | Code done, spike skipped, needs apply + gate answers |
| 1 | [Off Cloudflare runtime](./phase-01-off-cloudflare-runtime.md) | Code done (Mongo bridge skipped) |
| 2 | [DynamoDB data layer](./phase-02-dynamodb-data-layer.md) | Code done, manual checks pending |
| 3 | [Terraform app stack + CI](./phase-03-terraform-app-stack-ci.md) | Code done, needs make up |
| 4 | [Payments sandbox + cleanup](./phase-04-payments-cleanup.md) | Pending |

Phases run in order. Phase 0 is a gate: its answers can change phases 1 and 3.

## Dependencies

* User actions: AWS account + `aws configure sso` (or access keys) locally, Terraform 1.10+, GitHub repo secrets for CI, MoMo test keys (in `.env`), VNPay sandbox merchant, Turnstile widget.
* Node 22+ locally and in CI (seed runs in local-exec).
* Secrets: `SESSION_SECRET` (random), `ORIGIN_SECRET` (random), `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `TURNSTILE_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

## Top risks

* `placeOrder` transaction rules: same item twice is rejected, 100 items max, 2x cost.
* New `*.cloudfront.net` URL each full apply: VNPay IPN config and Turnstile hostnames may need an update each time.
* Secrets sit in plain text in Terraform state. State bucket private, encrypted, versioned.
* No WAF: a cache miss flood bills Lambda and DynamoDB. Run `make down` when not demoing.
