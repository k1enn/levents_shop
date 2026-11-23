# Phase 3: Terraform app stack + CI

Priority: P1. Status: Pending. Effort: 6h. Needs: phases 0 to 2.

## Overview

Turn the phase 0 skeleton into the full disposable stack: real app on Lambda, SSM config, cache behaviors, seed, Makefile, CI. Goal: from an empty account (bootstrap only), `make up` gives a working seeded shop; `make down` leaves nothing.

## Layout

```
infra/app/
  main.tf      backend + provider (phase 0)
  data.tf      table, bucket, seed images (phase 0) + aws_s3_object for build/client/assets/**
  lambda.tf    archive_file, Lambda, Function URL, IAM role + policy, log group
  cdn.tf       CloudFront, OAC, cache policies, response headers policy
  config.tf    random_password x2, aws_ssm_parameter per secret, APP_URL param
  seed.tf      terraform_data local-exec
  variables.tf momo/vnpay/turnstile/admin vars, all sensitive = true
  outputs.tf
Makefile
.github/workflows/up.yml, down.yml
```

## Steps

### 1. Lambda (`lambda.tf`)

* Package: `web/build` + prod `node_modules` + `run.sh` (`exec node node_modules/.bin/react-router-serve build/server/index.js`). `make up` runs `npm ci --omit=dev` into a staging dir before zipping. shortcut: zip with node_modules (maybe 30 to 60 MB unzipped); bundle with esbuild if it nears the 250 MB limit or cold start hurts.
* `data "archive_file"` from the staging dir, `source_code_hash` from it.
* Runtime newest Node LTS, arm64, memory 1024 MB, timeout 15 s (IPN and checkout need a few calls).
* Layer: Lambda Web Adapter public layer ARN for ap-southeast-1 arm64 (UNVERIFIED: copy the current ARN from the awslabs/aws-lambda-web-adapter README). Env: `AWS_LAMBDA_EXEC_WRAPPER = /opt/bootstrap`, `AWS_LWA_PORT = 3000`, `PORT = 3000`, `SSM_PREFIX = /phoneshop/`, `NODE_ENV = production`.
* Handler `run.sh`.
* IAM policy, least privilege:
  * `dynamodb:GetItem, PutItem, UpdateItem, Query, BatchGetItem, BatchWriteItem, TransactWriteItems` on the table ARN and `<table ARN>/index/*`.
  * `s3:PutObject` on `<bucket ARN>/images/products/*`.
  * `cloudfront:CreateInvalidation` on the distribution ARN.
  * `ssm:GetParametersByPath` on `/phoneshop` path, `kms:Decrypt` on the AWS managed SSM key (via `kms:ViaService` condition).
  * Logs: `logs:CreateLogStream, PutLogEvents` on the log group (no `CreateLogGroup`, so Lambda can never make an orphan group).
* `aws_cloudwatch_log_group` 7 days, `depends_on` from the function.
* Reserved concurrency: optional cap 10 (UNVERIFIED: new accounts may have a low account limit that blocks reserving). Cheap brake against a flood.

### 2. Config (`config.tf`)

* `random_password.session` (48), `random_password.origin` (32, no special chars, goes in a header).
* `aws_ssm_parameter` SecureString per key under `/phoneshop/`: SESSION_SECRET, ORIGIN_SECRET, TABLE, BUCKET, MOMO_*, VNP_*, TURNSTILE_SECRET. String: `APP_URL = "https://${aws_cloudfront_distribution.main.domain_name}"`, `DISTRIBUTION_ID`.
* Cycle check: Lambda must not reference CloudFront. CloudFront references the Function URL. SSM params reference both. Lambda reads SSM at cold start, so first request after apply sees all values.
* Variables from `TF_VAR_momo_partner_code` etc. Locally a `infra/app/.env` sourced by the Makefile (in `.gitignore`); CI from GitHub secrets.

### 3. CloudFront (`cdn.tf`)

* Origins: Function URL (custom origin, HTTPS only, header `x-origin-secret`), S3 with OAC.
* Behaviors:
  * `/assets/*`: S3, managed CachingOptimized, compress.
  * `/images/*`: S3, CachingOptimized, response headers policy with `nosniff` + CSP `default-src 'none'; style-src 'unsafe-inline'`.
  * default: Lambda, custom cache policy: min TTL 0, default 0, max 1 day, query strings all, no cookies and no headers in the key (so origin `Cache-Control` decides; responses with `Set-Cookie` or `private` are not cached). Origin request policy AllViewerExceptHostHeader plus `CloudFront-Viewer-Address`. Allowed methods all 7.
* UNVERIFIED: whether the managed AllViewerExceptHostHeader already includes `CloudFront-Viewer-Address`; if not, make a custom origin request policy with all viewer headers except Host + that header.
* Check that cart, checkout, account, admin, IPN responses never get `public` Cache-Control (they read the session, so they must be `private, no-store`). Add `headers` export where missing.
* `price_class = "PriceClass_200"` (includes Asia, cheaper than All), default cert, `http2and3`.

### 4. Static assets

* `aws_s3_object` for `web/build/client/assets/**`, `content_type` from extension map (js, css, woff2, svg, png, webp, ico), `cache_control = "public, max-age=31536000, immutable"`. File names are hashed, so no invalidation needed.

### 5. Seed (`seed.tf`)

```hcl
resource "terraform_data" "seed" {
  triggers_replace = aws_dynamodb_table.main.arn
  provisioner "local-exec" {
    working_dir = "${path.module}/../../web"
    command     = "node scripts/seed.mjs"
    environment = { TABLE = aws_dynamodb_table.main.name, AWS_REGION = var.region, ADMIN_EMAIL = var.admin_email, ADMIN_PASSWORD = var.admin_password }
  }
}
```

* Runs only when the table is new. Manual reseed: `terraform apply -replace=terraform_data.seed`.

### 6. Makefile (repo root)

```make
up:    ; cd web && npm ci && npm run build && ./scripts/stage-lambda.sh && cd ../infra/app && terraform init -input=false && terraform apply -auto-approve
down:  ; cd infra/app && terraform destroy -auto-approve
url:   ; cd infra/app && terraform output -raw url
```

* `stage-lambda.sh`: copy `build`, `package.json`, `package-lock.json`, `run.sh` to `infra/app/.lambda`, `npm ci --omit=dev` there.

### 7. CI

* `up.yml` and `down.yml`, `on: workflow_dispatch`, `permissions: id-token: write, contents: read`, `concurrency: phoneshop-infra` (no up and down at the same time).
* Steps: checkout, setup-node 22, setup-terraform, `aws-actions/configure-aws-credentials` with `role-to-assume` from bootstrap output and region, then `make up` / `make down`. Secrets as `TF_VAR_*` env.
* Tighten the deploy role policy in bootstrap to the services and name prefixes used here.

## Success Criteria

* From bootstrap only: `make up` finishes, `make url` prints the URL, the shop loads seeded phones and images, admin login works, COD checkout works.
* `curl -I <url>/phones` shows a CloudFront cache hit on the 2nd call; `curl -I <url>/cart` never does.
* Direct Function URL call returns 403.
* `make down` finishes; Console shows nothing tagged `Project=phoneshop` except bootstrap. `make up` again works and seeds again.
* Same run through GitHub Actions up and down.

## Risks

* Zip size and cold start with full node_modules.
* First request after apply may come before SSM params exist if Lambda is invoked during apply. Harmless: env load throws, next cold start works. Add `depends_on` from the Function URL to the SSM params to make it unlikely.
* `terraform destroy` fails if someone adds objects outside Terraform: `force_destroy` covers S3; nothing else stores state.
