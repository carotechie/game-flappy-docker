locals {
  full_mode = var.deployment_mode == "full"
}

# Guards against a misconfigured low_cost deployment: there's no ALB to
# distribute traffic, so more than one task doesn't make sense there.
resource "terraform_data" "validate_low_cost_capacity" {
  lifecycle {
    precondition {
      condition     = local.full_mode || (var.min_capacity == 1 && var.max_capacity == 1)
      error_message = "deployment_mode = \"low_cost\" has no ALB to distribute traffic across tasks, so min_capacity and max_capacity must both be 1."
    }
  }
}

module "network" {
  source = "./components/network"
}

module "ecr" {
  source       = "./components/ecr"
  project_name = var.project_name
}

module "dns" {
  source      = "./components/dns"
  domain_name = var.domain_name
}

module "acm" {
  count          = local.full_mode ? 1 : 0
  source         = "./components/acm"
  fqdn           = "${var.subdomain}.${var.domain_name}"
  hosted_zone_id = module.dns.zone_id
}

module "alb" {
  count           = local.full_mode ? 1 : 0
  source          = "./components/alb"
  project_name    = var.project_name
  vpc_id          = module.network.vpc_id
  subnet_ids      = module.network.subnet_ids
  certificate_arn = module.acm[0].certificate_arn
  container_port  = var.container_port
  hosted_zone_id  = module.dns.zone_id
  domain_name     = var.domain_name
  subdomain       = var.subdomain
}

module "ecs" {
  source                = "./components/ecs"
  project_name          = var.project_name
  environment           = var.environment
  aws_region            = var.aws_region
  vpc_id                = module.network.vpc_id
  subnet_ids            = module.network.subnet_ids
  use_alb               = local.full_mode
  alb_security_group_id = local.full_mode ? module.alb[0].security_group_id : null
  target_group_arn      = local.full_mode ? module.alb[0].target_group_arn : null
  ecr_repository_url    = module.ecr.repository_url
  image_tag             = var.image_tag
  container_port        = var.container_port
  task_cpu              = var.task_cpu
  task_memory           = var.task_memory
  desired_count         = var.desired_count
}

module "autoscaling" {
  count            = local.full_mode ? 1 : 0
  source           = "./components/autoscaling"
  cluster_name     = module.ecs.cluster_name
  service_name     = module.ecs.service_name
  min_capacity     = var.min_capacity
  max_capacity     = var.max_capacity
  cpu_target_value = var.cpu_target_value
}

# low_cost mode: no ALB alias record exists (it lives inside the alb module),
# so sync a plain A record to the single task's current public IP instead.
module "dns_task_record" {
  count          = local.full_mode ? 0 : 1
  source         = "./components/dns_task_record"
  cluster_name   = module.ecs.cluster_name
  service_name   = module.ecs.service_name
  hosted_zone_id = module.dns.zone_id
  record_name    = "${var.subdomain}.${var.domain_name}"
  aws_region     = var.aws_region

  depends_on = [module.ecs]
}
