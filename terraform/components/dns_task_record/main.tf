## low_cost mode has no ALB, so there's nothing stable to alias the DNS record to.
## Instead we look up the single running task's public IP at apply time and
## point a low-TTL A record directly at it.
##
## KNOWN LIMITATION: this IP is only refreshed on `terraform apply`. If the
## task crashes or AWS reschedules it between applies, its public IP changes
## and this record goes stale until the next apply. That's an acceptable
## trade-off for a personal/hobby deployment prioritizing low cost, but it is
## NOT a substitute for the ALB's health-checked, self-healing routing in
## "full" mode. Requires the AWS CLI and jq on the machine running Terraform.

data "external" "task_ip" {
  program = ["bash", "${path.module}/get-task-ip.sh"]

  query = {
    cluster = var.cluster_name
    service = var.service_name
    region  = var.aws_region
  }
}

resource "aws_route53_record" "app" {
  zone_id = var.hosted_zone_id
  name    = var.record_name
  type    = "A"
  ttl     = 60
  records = [data.external.task_ip.result.ip]
}
