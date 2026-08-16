output "app_url" {
  description = "URL of the deployed application"
  value       = local.full_mode ? module.alb[0].app_url : "http://${var.subdomain}.${var.domain_name}"
}

output "deployment_mode" {
  value = var.deployment_mode
}

output "ecr_repository_url" {
  description = "Push images here before running terraform apply"
  value       = module.ecr.repository_url
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "ecs_service_name" {
  value = module.ecs.service_name
}
