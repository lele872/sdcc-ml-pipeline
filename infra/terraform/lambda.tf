resource "aws_lambda_function" "preprocess" {
  function_name = "sdcc-preprocess"
  role          = aws_iam_role.lambda_executor.arn

  runtime = "python3.12"
  handler = "handler.lambda_handler"

  s3_bucket        = aws_s3_object.preprocess_zip.bucket
  s3_key           = aws_s3_object.preprocess_zip.key
  source_code_hash = fileexists("../../.build/preprocess.zip") ? filebase64sha256("../../.build/preprocess.zip") : null

  timeout     = 120
  memory_size = 512

  depends_on = [aws_s3_object.preprocess_zip]
}

resource "aws_lambda_function" "train" {
  function_name = "sdcc-train"
  role          = aws_iam_role.lambda_executor.arn

  runtime = "python3.12"
  handler = "handler.lambda_handler"

  s3_bucket        = aws_s3_object.train_zip.bucket
  s3_key           = aws_s3_object.train_zip.key
  source_code_hash = fileexists("../../.build/train.zip") ? filebase64sha256("../../.build/train.zip") : null

  timeout     = 300
  memory_size = 1024

  depends_on = [aws_s3_object.train_zip]
}

resource "aws_lambda_function" "infer" {
  function_name = "sdcc-infer"
  role          = aws_iam_role.lambda_executor.arn

  runtime = "python3.12"
  handler = "handler.lambda_handler"

  s3_bucket        = aws_s3_object.infer_zip.bucket
  s3_key           = aws_s3_object.infer_zip.key
  source_code_hash = fileexists("../../.build/infer.zip") ? filebase64sha256("../../.build/infer.zip") : null

  timeout     = 60
  memory_size = 512

  depends_on = [aws_s3_object.infer_zip]
}

resource "aws_lambda_function" "scan" {
  function_name = "sdcc-scan"
  role          = aws_iam_role.lambda_executor.arn

  runtime = "python3.12"
  handler = "handler.lambda_handler"

  s3_bucket        = aws_s3_object.scan_zip.bucket
  s3_key           = aws_s3_object.scan_zip.key
  source_code_hash = fileexists("../../.build/scan.zip") ? filebase64sha256("../../.build/scan.zip") : null

  timeout     = 120
  memory_size = 256

  environment {
    variables = {
      CLAMD_HOST = "clamav"
      CLAMD_PORT = "3310"
    }
  }

  depends_on = [aws_s3_object.scan_zip]
}
