output "url" { value = "https://${aws_cloudfront_distribution.main.domain_name}" }
output "function_url" { value = aws_lambda_function_url.app.function_url }
output "table_name" { value = aws_dynamodb_table.main.name }
output "bucket" { value = aws_s3_bucket.app.bucket }
output "distribution_id" { value = aws_cloudfront_distribution.main.id }
