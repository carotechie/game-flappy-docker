## Looks up the hosted zone that must already exist in Route53.
## Terraform does not create the zone itself (it's a shared, pre-existing resource).

data "aws_route53_zone" "this" {
  name         = var.domain_name
  private_zone = false
}
