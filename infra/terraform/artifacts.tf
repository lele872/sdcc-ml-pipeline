resource "aws_s3_bucket" "artifacts" {
  bucket = "sdcc-artifacts"

  tags = {
    Progetto = "sdcc-ml-pipeline"
    Uso      = "pacchetti-lambda"
  }
}

resource "aws_s3_object" "preprocess_zip" {
  bucket = aws_s3_bucket.artifacts.id
  key    = "lambdas/preprocess.zip"
  source = "../../.build/preprocess.zip"

  etag = filemd5("../../.build/preprocess.zip")
}

resource "aws_s3_object" "train_zip" {
  bucket = aws_s3_bucket.artifacts.id
  key    = "lambdas/train.zip"
  source = "../../.build/train.zip"

  etag = filemd5("../../.build/train.zip")
}

resource "aws_s3_object" "infer_zip" {
  bucket = aws_s3_bucket.artifacts.id
  key    = "lambdas/infer.zip"
  source = "../../.build/infer.zip"

  etag = filemd5("../../.build/infer.zip")
}

resource "aws_s3_object" "scan_zip" {
  bucket = aws_s3_bucket.artifacts.id
  key    = "lambdas/scan.zip"
  source = "../../.build/scan.zip"

  etag = filemd5("../../.build/scan.zip")
}
