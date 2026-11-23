variable "region" { default = "ap-southeast-1" }

variable "admin_email" {
  type      = string
  sensitive = true
}
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
# Default: Cloudflare always pass test secret (pairs with the test site key in Turnstile.tsx).
variable "turnstile_secret" {
  default   = "1x0000000000000000000000000000000AA"
  sensitive = true
}
