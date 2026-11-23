# Package staged by web/scripts/stage-lambda.sh into .lambda (build + prod node_modules + run.sh).
# shortcut: zip with full node_modules; bundle with esbuild if it nears the 250 MB limit or cold start hurts.
data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "${path.module}/.lambda"
  output_path = "${path.module}/.lambda.zip"
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/lambda/${local.name}"
  retention_in_days = 7
}

resource "aws_iam_role" "lambda" {
  name = "${local.name}-app-lambda"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole" }]
  })
}

# Least privilege. No logs:CreateLogGroup, so Lambda can never leave an orphan group after destroy.
resource "aws_iam_role_policy" "lambda" {
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query", "dynamodb:BatchGetItem", "dynamodb:BatchWriteItem", "dynamodb:ConditionCheckItem"]
        Resource = [aws_dynamodb_table.main.arn, "${aws_dynamodb_table.main.arn}/index/*"]
      },
      { Effect = "Allow", Action = "s3:PutObject", Resource = "${aws_s3_bucket.app.arn}/images/products/*" },
      { Effect = "Allow", Action = "cloudfront:CreateInvalidation", Resource = aws_cloudfront_distribution.main.arn },
      { Effect = "Allow", Action = "ssm:GetParametersByPath", Resource = "arn:aws:ssm:${var.region}:*:parameter/${local.name}" },
      { Effect = "Allow", Action = "kms:Decrypt", Resource = "*", Condition = { StringEquals = { "kms:ViaService" = "ssm.${var.region}.amazonaws.com" } } },
      { Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "${aws_cloudwatch_log_group.app.arn}:*" },
    ]
  })
}

resource "aws_lambda_function" "app" {
  function_name    = local.name
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  architectures    = ["arm64"]
  handler          = "run.sh"
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
  memory_size      = 1024
  timeout          = 15
  # Lambda Web Adapter runs react-router-serve as a normal HTTP server (ARN from the awslabs README, v30).
  layers = ["arn:aws:lambda:${var.region}:753240598075:layer:LambdaAdapterLayerArm64:30"]
  environment {
    variables = {
      AWS_LAMBDA_EXEC_WRAPPER = "/opt/bootstrap"
      AWS_LWA_PORT            = "3000"
      PORT                    = "3000"
      SSM_PREFIX              = "/${local.name}"
      NODE_ENV                = "production"
    }
  }
  # No depends_on to SSM or the role policy: both reference CloudFront, which needs this function (cycle).
  # A request before SSM exists fails init; the next cold start works.
  depends_on = [aws_cloudwatch_log_group.app]
}

# AuthType NONE: OAC on a Function URL breaks browser POSTs and gateway IPNs (no x-amz-content-sha256).
# The app 403s any request without CloudFront's x-origin-secret header instead.
resource "aws_lambda_function_url" "app" {
  function_name      = aws_lambda_function.app.function_name
  authorization_type = "NONE"
}

# UNVERIFIED: since Oct 2025 new public URLs need both permissions; the 2nd is limited to calls via the URL.
resource "aws_lambda_permission" "url" {
  statement_id           = "FunctionUrlPublic"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.app.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "url_invoke" {
  statement_id             = "FunctionUrlInvoke"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.app.function_name
  principal                = "*"
  invoked_via_function_url = true
}
