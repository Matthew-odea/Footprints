variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "core_table_name" {
  type    = string
  default = "footprints_core"
}

variable "completions_bucket_name" {
  type    = string
  default = "footprints-prod-completions"
}
