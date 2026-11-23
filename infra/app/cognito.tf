# Sign up: email code (ConfirmSignUp). Sign in: password + emailed PIN (required email MFA).
# Email MFA needs the Essentials tier and SES as sender (not COGNITO_DEFAULT).
# SES sandbox: mail only reaches verified addresses until production access is granted.

# Email address identity: SES mails a link to this address, click it before `make up` finishes using it.
resource "aws_sesv2_email_identity" "from" {
  email_identity = var.ses_from_email
}

resource "aws_cognito_user_pool" "main" {
  name                     = local.name
  user_pool_tier           = "ESSENTIALS"
  deletion_protection      = "INACTIVE" # disposable stack
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "ON"

  email_mfa_configuration {
    subject = "Mã đăng nhập PhoneShop"
    message = "Mã đăng nhập PhoneShop của bạn: {####}. Không chia sẻ mã này."
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Xác minh email PhoneShop"
    email_message        = "Mã xác minh PhoneShop của bạn: {####}"
  }

  # Cognito creates the service linked role for SES itself, no sending policy needed.
  email_configuration {
    email_sending_account = "DEVELOPER"
    source_arn            = aws_sesv2_email_identity.from.arn
    from_email_address    = "PhoneShop <${var.ses_from_email}>"
  }

  # Email MFA forbids email as the only recovery channel. No forgot password page, so admin only.
  account_recovery_setting {
    recovery_mechanism {
      name     = "admin_only"
      priority = 1
    }
  }

  # Length over character classes (NIST 800-63B). Matches the 8 char check in register.tsx.
  password_policy {
    minimum_length                   = 8
    require_lowercase                = false
    require_uppercase                = false
    require_numbers                  = false
    require_symbols                  = false
    temporary_password_validity_days = 7
  }
}

# Confidential client: only the Lambda knows the secret, so Cognito APIs cannot be called around the app guards. The app keeps its own cookie session, Cognito tokens are not stored.
resource "aws_cognito_user_pool_client" "web" {
  name                          = "${local.name}-web"
  user_pool_id                  = aws_cognito_user_pool.main.id
  generate_secret               = true
  explicit_auth_flows           = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  prevent_user_existence_errors = "ENABLED"
}
