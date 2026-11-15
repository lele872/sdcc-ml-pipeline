variable "aws_access_key" {
  type    = string
  default = "test"
}

variable "aws_secret_key" {
  type    = string
  default = "test"
}

variable "aws_region" {
  type    = string
  default = "eu-south-1"
}

variable "endpoints" {
  description = "Endpoint dei servizi AWS, puntati sull'emulatore Floci"
  type        = map(string)
  default = {
    s3         = "http://localhost:4566"
    iam        = "http://localhost:4566"
    sts        = "http://localhost:4566"
    ses        = "http://localhost:4566"
    lambda     = "http://localhost:4566"
    apigateway = "http://localhost:4566"
    cognitoidp = "http://localhost:4566"
  }
}
