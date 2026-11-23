# Seeds only when the table or user pool is new. Manual reseed: terraform apply -replace=terraform_data.seed
resource "terraform_data" "seed" {
  triggers_replace = [aws_dynamodb_table.main.arn, aws_cognito_user_pool.main.arn]
  provisioner "local-exec" {
    working_dir = local.web
    command     = "node scripts/seed.mjs"
    environment = {
      TABLE          = aws_dynamodb_table.main.name
      USER_POOL_ID   = aws_cognito_user_pool.main.id
      AWS_REGION     = var.region
      ADMIN_EMAIL    = var.admin_email
      ADMIN_PASSWORD = var.admin_password
    }
  }
}
