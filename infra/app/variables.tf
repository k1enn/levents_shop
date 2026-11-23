variable "region" { default = "ap-southeast-1" }

variable "admin_email" {
  type      = string
  sensitive = true
}
# Sender for sign up codes and login PINs. Verified in SES by link (see cognito.tf).
variable "ses_from_email" { type = string }

variable "admin_password" {
  type      = string
  sensitive = true
}

# Empty = not written to SSM (that payment method then fails at checkout).
variable "momo_partner_code" {
  default   = ""
  sensitive = true
}
variable "momo_access_key" {
  default   = ""
  sensitive = true
}
variable "momo_secret_key" {
  default   = ""
  sensitive = true
}
variable "vnp_tmn_code" {
  default   = ""
  sensitive = true
}
variable "vnp_hash_secret" {
  default   = ""
  sensitive = true
}
# No default: a forgotten real key would leave Turnstile always passing in prod.
variable "turnstile_secret" {
  sensitive = true
}
