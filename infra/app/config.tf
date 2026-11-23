resource "random_password" "session" {
  length = 48
}

# Goes in a header, so no special characters.
resource "random_password" "origin" {
  length  = 32
  special = false
}

# Lambda reads these once per cold start. APP_URL lives here (not in Lambda env) to break the CloudFront/Lambda cycle.
# shortcut: secrets sit in plain text in Terraform state; the state bucket is private, encrypted, versioned.
locals {
  computed = {
    SESSION_SECRET  = random_password.session.result
    ORIGIN_SECRET   = random_password.origin.result
    APP_URL         = "https://${aws_cloudfront_distribution.main.domain_name}"
    TABLE           = aws_dynamodb_table.main.name
    BUCKET          = aws_s3_bucket.app.bucket
    DISTRIBUTION_ID = aws_cloudfront_distribution.main.id
  }
  secrets = {
    MOMO_PARTNER_CODE = var.momo_partner_code
    MOMO_ACCESS_KEY   = var.momo_access_key
    MOMO_SECRET_KEY   = var.momo_secret_key
    VNP_TMN_CODE      = var.vnp_tmn_code
    VNP_HASH_SECRET   = var.vnp_hash_secret
    TURNSTILE_SECRET  = var.turnstile_secret
  }
  params = merge(local.computed, { for k, v in local.secrets : k => v if v != "" })
}

resource "aws_ssm_parameter" "app" {
  for_each = nonsensitive(toset(keys(local.params)))
  name     = "/${local.name}/${each.key}"
  type     = "SecureString"
  value    = local.params[each.key]
}
