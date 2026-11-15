terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
  region     = var.aws_region

  skip_credentials_validation = true
  skip_region_validation      = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true

  endpoints {
    s3         = var.endpoints["s3"]
    iam        = var.endpoints["iam"]
    sts        = var.endpoints["sts"]
    ses        = var.endpoints["ses"]
    lambda     = var.endpoints["lambda"]
    apigateway = var.endpoints["apigateway"]
    cognitoidp = var.endpoints["cognitoidp"]
  }
}
