# Disposable stack: `make up` creates and seeds it, `make down` deletes all of it.
terraform {
  required_version = ">= 1.10"
  required_providers {
    aws     = { source = "hashicorp/aws", version = "~> 6.0" }
    random  = { source = "hashicorp/random", version = "~> 3.6" }
    archive = { source = "hashicorp/archive", version = "~> 2.7" }
  }
  # bucket comes from `make up`: -backend-config=bucket=phoneshop-tfstate-<account id>
  backend "s3" {
    key          = "app.tfstate"
    region       = "ap-southeast-1"
    use_lockfile = true
  }
}

provider "aws" {
  region = var.region
  default_tags { tags = { Project = "phoneshop" } }
}

locals {
  name = "phoneshop"
  web  = "${path.module}/../../web"
  mime = { svg = "image/svg+xml", png = "image/png", jpg = "image/jpeg", webp = "image/webp", ico = "image/x-icon", js = "text/javascript", css = "text/css", woff2 = "font/woff2", json = "application/json" }
}
