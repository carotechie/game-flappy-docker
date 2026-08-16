variable "project_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "certificate_arn" {
  type = string
}

variable "container_port" {
  type = number
}

variable "hosted_zone_id" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "subdomain" {
  type = string
}
