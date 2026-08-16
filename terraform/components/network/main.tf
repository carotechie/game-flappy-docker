## Uses the account's default VPC and its default (public) subnets, one per AZ.
## Fargate tasks get public IPs directly here, so no NAT Gateway is required.

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}
