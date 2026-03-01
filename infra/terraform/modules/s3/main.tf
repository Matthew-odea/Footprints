resource "aws_s3_bucket" "completions" {
  bucket = var.bucket_name
  tags   = var.tags
}

resource "aws_s3_bucket_versioning" "completions" {
  bucket = aws_s3_bucket.completions.id

  versioning_configuration {
    status = "Enabled"
  }
}
