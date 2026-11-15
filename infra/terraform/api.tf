resource "aws_api_gateway_rest_api" "infer_api" {
  name = "sdcc-infer-api"

  tags = {
    Progetto = "sdcc-ml-pipeline"
    Fase     = "4-inferenza"
  }
}

resource "aws_api_gateway_resource" "predici" {
  rest_api_id = aws_api_gateway_rest_api.infer_api.id
  parent_id   = aws_api_gateway_rest_api.infer_api.root_resource_id
  path_part   = "predici"
}

resource "aws_api_gateway_method" "predici_post" {
  rest_api_id   = aws_api_gateway_rest_api.infer_api.id
  resource_id   = aws_api_gateway_resource.predici.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "predici_lambda" {
  rest_api_id             = aws_api_gateway_rest_api.infer_api.id
  resource_id             = aws_api_gateway_resource.predici.id
  http_method             = aws_api_gateway_method.predici_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.infer.invoke_arn
}

resource "aws_lambda_permission" "apigw_invoca_infer" {
  statement_id  = "AllowExecutionFromApiGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.infer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.infer_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "infer_api" {
  rest_api_id = aws_api_gateway_rest_api.infer_api.id

  triggers = {
    redeployment = sha1(
      jsonencode([
        aws_api_gateway_resource.predici.id,
        aws_api_gateway_method.predici_post.id,
        aws_api_gateway_integration.predici_lambda.id,
      ])
    )
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "dev" {
  rest_api_id   = aws_api_gateway_rest_api.infer_api.id
  deployment_id = aws_api_gateway_deployment.infer_api.id
  stage_name    = "dev"
}

output "url_predici" {
  value = "${aws_api_gateway_stage.dev.invoke_url}/predici"
}
