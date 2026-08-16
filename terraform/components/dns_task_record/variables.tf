variable "cluster_name" {
  type = string
}

variable "service_name" {
  type = string
}

variable "hosted_zone_id" {
  type = string
}

variable "record_name" {
  description = "Fully qualified record name, e.g. flappy-docker.carolinaherreramonteza.com"
  type        = string
}

variable "aws_region" {
  type = string
}
