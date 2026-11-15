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
  source = fileexists("../../.build/preprocess.zip") ? "../../.build/preprocess.zip" : null

  etag = fileexists("../../.build/preprocess.zip") ? filemd5("../../.build/preprocess.zip") : null
}

resource "aws_s3_object" "train_zip" {
  bucket = aws_s3_bucket.artifacts.id
  key    = "lambdas/train.zip"
  source = fileexists("../../.build/train.zip") ? "../../.build/train.zip" : null

  etag = fileexists("../../.build/train.zip") ? filemd5("../../.build/train.zip") : null
}

resource "aws_s3_object" "infer_zip" {
  bucket = aws_s3_bucket.artifacts.id
  key    = "lambdas/infer.zip"
  source = fileexists("../../.build/infer.zip") ? "../../.build/infer.zip" : null

  etag = fileexists("../../.build/infer.zip") ? filemd5("../../.build/infer.zip") : null
}

resource "aws_s3_object" "scan_zip" {
  bucket = aws_s3_bucket.artifacts.id
  key    = "lambdas/scan.zip"
  source = "../../.build/scan.zip"

  etag = filemd5("../../.build/scan.zip")
}
