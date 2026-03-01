terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  tags = {
    project     = "footprints"
    environment = "dev"
  }
}

module "dynamodb" {
  source     = "../../modules/dynamodb"
  table_name = var.core_table_name
  tags       = local.tags
}

module "s3" {
  source      = "../../modules/s3"
  bucket_name = var.completions_bucket_name
  tags        = local.tags
}
