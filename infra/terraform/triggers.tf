resource "aws_lambda_permission" "raw_invoca_preprocess" {
  statement_id  = "AllowExecutionFromS3Raw"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.preprocess.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.raw.arn
}

resource "aws_s3_bucket_notification" "raw_trigger" {
  bucket = aws_s3_bucket.raw.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.preprocess.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "approved/"
    filter_suffix       = ".csv"
  }

  lambda_function {
    lambda_function_arn = aws_lambda_function.scan.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "incoming/"
  }

  depends_on = [
    aws_lambda_permission.raw_invoca_preprocess,
    aws_lambda_permission.raw_invoca_scan,
  ]
}

resource "aws_lambda_permission" "processed_invoca_train" {
  statement_id  = "AllowExecutionFromS3Processed"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.train.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.processed.arn
}

resource "aws_s3_bucket_notification" "processed_trigger" {
  bucket = aws_s3_bucket.processed.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.train.arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = "_processed.csv"
  }

  depends_on = [aws_lambda_permission.processed_invoca_train]
}

resource "aws_lambda_permission" "raw_invoca_scan" {
  statement_id  = "AllowExecutionFromS3RawScan"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scan.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.raw.arn
}
