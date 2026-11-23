data "aws_cloudfront_cache_policy" "optimized" { name = "Managed-CachingOptimized" }

# UNVERIFIED: this managed policy is expected to include CloudFront-Viewer-Address (client IP for limiter and VNPay).
data "aws_cloudfront_origin_request_policy" "all_except_host" { name = "Managed-AllViewerExceptHostHeader" }

# Origin Cache-Control decides: catalog pages are public max-age=60, everything else has none (TTL 0) or private.
resource "aws_cloudfront_cache_policy" "app" {
  name        = "${local.name}-app"
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 86400
  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
    cookies_config { cookie_behavior = "none" }
    headers_config { header_behavior = "none" }
    query_strings_config { query_string_behavior = "all" }
  }
}

# Seed images are SVG: block any script inside if opened directly.
resource "aws_cloudfront_response_headers_policy" "images" {
  name = "${local.name}-images"
  security_headers_config {
    content_type_options { override = true }
    content_security_policy {
      content_security_policy = "default-src 'none'; style-src 'unsafe-inline'"
      override                = true
    }
  }
}

resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "${local.name}-s3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "main" {
  enabled         = true
  is_ipv6_enabled = true
  http_version    = "http2and3"
  price_class     = "PriceClass_200"
  comment         = local.name

  origin {
    origin_id   = "lambda"
    domain_name = split("/", aws_lambda_function_url.app.function_url)[2]
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
    custom_header {
      name  = "x-origin-secret"
      value = random_password.origin.result
    }
  }

  origin {
    origin_id                = "s3"
    domain_name              = aws_s3_bucket.app.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  default_cache_behavior {
    target_origin_id         = "lambda"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    cache_policy_id          = aws_cloudfront_cache_policy.app.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_except_host.id
  }

  ordered_cache_behavior {
    path_pattern           = "/assets/*"
    target_origin_id       = "s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
  }

  ordered_cache_behavior {
    path_pattern               = "/images/*"
    target_origin_id           = "s3"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.images.id
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate { cloudfront_default_certificate = true }
}
