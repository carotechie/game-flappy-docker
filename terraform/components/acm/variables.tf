variable "fqdn" {
  description = "Fully qualified domain name the certificate is issued for"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID used for DNS validation"
  type        = string
}
