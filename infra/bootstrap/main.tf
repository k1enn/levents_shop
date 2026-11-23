# Applied once and kept: state bucket, GitHub OIDC deploy role, budget.
# shortcut: local state for bootstrap, move it into the bucket if it starts to change often.
terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }
  }
}

provider "aws" {
  region = var.region
  default_tags { tags = { Project = "phoneshop-bootstrap" } }
}

variable "region" { default = "ap-southeast-1" }
variable "github_repo" { default = "k1enn/levents_shop" }
variable "budget_email" {
  type      = string
  sensitive = true
}

data "aws_caller_identity" "me" {}

resource "aws_s3_bucket" "state" {
  bucket = "phoneshop-tfstate-${data.aws_caller_identity.me.account_id}"
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# The account already has this provider (shared with other projects), so read it, never own it.
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_role" "deploy" {
  name = "phoneshop-deploy"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = data.aws_iam_openid_connect_provider.github.arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com" }
        StringLike   = { "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/master" }
      }
    }]
  })
}

# Scoped to the services and name prefixes infra/app uses. IAM is limited to phoneshop-* roles.
resource "aws_iam_role_policy" "deploy" {
  role = aws_iam_role.deploy.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["s3:ListBucket"], Resource = aws_s3_bucket.state.arn },
      { Effect = "Allow", Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"], Resource = "${aws_s3_bucket.state.arn}/*" },
      { Effect = "Allow", Action = ["dynamodb:*"], Resource = "arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.me.account_id}:table/phoneshop*" },
      { Effect = "Allow", Action = ["s3:*"], Resource = ["arn:aws:s3:::phoneshop-app-*", "arn:aws:s3:::phoneshop-app-*/*"] },
      { Effect = "Allow", Action = ["lambda:*"], Resource = "arn:aws:lambda:${var.region}:${data.aws_caller_identity.me.account_id}:function:phoneshop*" },
      { Effect = "Allow", Action = ["lambda:GetLayerVersion"], Resource = "*" },
      { Effect = "Allow", Action = ["logs:*"], Resource = "arn:aws:logs:${var.region}:${data.aws_caller_identity.me.account_id}:log-group:/aws/lambda/phoneshop*" },
      { Effect = "Allow", Action = ["logs:DescribeLogGroups"], Resource = "*" },
      { Effect = "Allow", Action = ["ssm:*"], Resource = "arn:aws:ssm:${var.region}:${data.aws_caller_identity.me.account_id}:parameter/phoneshop*" },
      { Effect = "Allow", Action = ["ssm:DescribeParameters"], Resource = "*" },
      { Effect = "Allow", Action = ["cloudfront:*"], Resource = "*" },
      { Effect = "Allow", Action = ["iam:GetRole", "iam:CreateRole", "iam:DeleteRole", "iam:TagRole", "iam:UntagRole", "iam:PutRolePolicy", "iam:GetRolePolicy", "iam:DeleteRolePolicy", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies", "iam:ListInstanceProfilesForRole", "iam:PassRole"], Resource = "arn:aws:iam::${data.aws_caller_identity.me.account_id}:role/phoneshop-app-*" },
    ]
  })
}

resource "aws_budgets_budget" "monthly" {
  name         = "phoneshop-monthly"
  budget_type  = "COST"
  limit_amount = "5"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  dynamic "notification" {
    for_each = [20, 100]
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = [var.budget_email]
    }
  }
}

output "state_bucket" { value = aws_s3_bucket.state.bucket }
output "deploy_role_arn" { value = aws_iam_role.deploy.arn }
