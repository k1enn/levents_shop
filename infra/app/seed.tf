# Seeds only when the table is new. Manual reseed: terraform apply -replace=terraform_data.seed
resource "terraform_data" "seed" {
  triggers_replace = aws_dynamodb_table.main.arn
  provisioner "local-exec" {
    working_dir = local.web
    command     = "node scripts/seed.mjs"
    environment = {
      TABLE          = aws_dynamodb_table.main.name
      AWS_REGION     = var.region
      ADMIN_EMAIL    = var.admin_email
      ADMIN_PASSWORD = var.admin_password
    }
  }
}
