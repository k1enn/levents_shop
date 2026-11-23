# Phase 0: Bootstrap + spike

Priority: P1. Status: Pending. Effort: 4h. Needs: AWS account.

## Context

* `plans/aws-architecture.html`: diagram, OAC POST trap, cost traps.
* Research: Function URL behind OAC breaks POST without `x-amz-content-sha256`, so use AuthType NONE + secret header.

## Overview

Make the account safe (budgets), make the state bucket and CI role, then prove the hardest infra path with a hello Lambda: CloudFront to Function URL, form POST, S3 via OAC, full destroy. Also create the table and bucket early so phases 1 and 2 can develop against them.

## Gate questions (answer first, write the answers into this file)

* A: CloudFront always free tier applies to this account? (UNVERIFIED: 1 TB, 10M requests per month.) Check the Billing free tier page.
* B: DynamoDB on demand price in ap-southeast-1 and free tier for this account (new accounts since mid 2025 get credits, not always the old 25 RCU/WCU, UNVERIFIED).
* C: How long CloudFront create and destroy take. Measure in step 3.
* D: Can a Turnstile widget hostname list hold `cloudfront.net` so every new subdomain works? (UNVERIFIED.) If not, plan B in phase 1.

## Steps

### 1. `infra/bootstrap` (local state, applied once)

* `aws_s3_bucket` `phoneshop-tfstate-<account id>`: versioning on, SSE S3, block all public access, `prevent_destroy` lifecycle.
* `aws_iam_openid_connect_provider` for `token.actions.githubusercontent.com`.
* `aws_iam_role` `phoneshop-deploy`: trust `sub` = `repo:k1enn/<repo>:ref:refs/heads/master` and `environment` claims via `StringLike`, `aud` = `sts.amazonaws.com`. Policy: what `infra/app` needs (start broad on the services used, tighten after phase 3 works).
* `aws_budgets_budget` monthly cost 5 USD, notifications at 20% and 100% to the user email (variable, not in git).
* Keep `infra/bootstrap/terraform.tfstate` out of git (add to `.gitignore`). shortcut: local state for bootstrap, move it into the bucket if it starts to change often.

### 2. `infra/app` skeleton

* `main.tf`: `terraform { backend "s3" { bucket, key = "app.tfstate", region = "ap-southeast-1", use_lockfile = true } }`, provider aws 6.x, `default_tags { Project = "phoneshop" }`.
* `data.tf`:
  * `aws_dynamodb_table` `phoneshop`: `billing_mode = "PAY_PER_REQUEST"`, hash `PK` (S), range `SK` (S), GSI1 (`GSI1PK`, `GSI1SK`), GSI2 (`GSI2PK`, `GSI2SK`), projection ALL, `ttl { attribute_name = "ttl", enabled = true }`, `deletion_protection_enabled = false`.
  * `aws_s3_bucket` `phoneshop-<random suffix>`, `force_destroy = true`, block public access.
  * `aws_s3_object` for `web/seed-images/**` at key `images/seed/<file>`, `content_type` from an extension map, `etag = filemd5(...)`.
* `outputs.tf`: `table_name`, `bucket`, `url`.

### 3. Spike: hello Lambda behind CloudFront

* `aws_lambda_function` Node 22 (or newest) with a 10 line inline handler that echoes method, path, body length and whether header `x-origin-secret` matches.
* `aws_lambda_function_url` AuthType NONE.
* `aws_cloudfront_distribution`: default cert, origin 1 = Function URL host with custom header `x-origin-secret = random_password.origin.result`, origin 2 = S3 with `aws_cloudfront_origin_access_control` (s3, sigv4 always). Behaviors `/images/*` to S3 (CachingOptimized), default to Lambda (CachingDisabled, AllViewerExceptHostHeader origin request policy).
* Bucket policy: `s3:GetObject` for `cloudfront.amazonaws.com` with `AWS:SourceArn` = distribution ARN.
* `aws_cloudwatch_log_group` `/aws/lambda/<name>`, 7 days, created before the function (`depends_on`).

## Success Criteria

* `curl -X POST -d a=1 https://<url>/x` returns method POST and secret ok.
* Direct call to the Function URL returns secret not ok (the real app will 403 on that).
* `https://<url>/images/seed/placeholder.svg` loads from S3, direct S3 URL is denied.
* `terraform destroy` finishes; Console shows no table, bucket, Lambda, log group, distribution left. `terraform apply` again works.
* Gate answers A to D written down. If A fails, expect a few cents per month of CloudFront, still fine.

## Risks

* CloudFront destroy waits for disable; may take 10+ minutes.
* Deploy role too broad at first. Tighten in phase 3.
