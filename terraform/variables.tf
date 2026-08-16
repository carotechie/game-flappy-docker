variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name used to prefix/tag resources"
  type        = string
  default     = "flappy-docker"
}

variable "environment" {
  description = "Environment name (e.g. dev, prod)"
  type        = string
}

variable "deployment_mode" {
  description = <<-EOT
    Infrastructure profile:
      "full"     - ECR + ECS + ALB + ACM (HTTPS) + autoscaling (min_capacity..max_capacity tasks). ~$27-30/mo.
      "low_cost" - ECR + ECS + Route53 only. No ALB/ACM/autoscaling: a single Fargate task
                   with a public IP, served over plain HTTP. ~$9/mo. See SetupOnAWS.md for
                   the DNS-staleness trade-off this mode carries.
  EOT
  type        = string
  default     = "full"

  validation {
    condition     = contains(["full", "low_cost"], var.deployment_mode)
    error_message = "deployment_mode must be either \"full\" or \"low_cost\"."
  }
}

variable "domain_name" {
  description = "Root domain of the existing Route53 hosted zone"
  type        = string
  default     = "carolinaherreramonteza.com"
}

variable "subdomain" {
  description = "Subdomain to create for the app (without the root domain)"
  type        = string
  default     = "flappy-docker"
}

variable "container_port" {
  description = "Port the container listens on (nginx in the Dockerfile)"
  type        = number
  default     = 80
}

variable "task_cpu" {
  description = "Fargate task CPU units (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "task_memory" {
  description = "Fargate task memory in MiB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Initial desired task count (autoscaling manages it afterwards)"
  type        = number
  default     = 1
}

variable "min_capacity" {
  description = "Minimum number of tasks always running"
  type        = number
  default     = 1
}

variable "max_capacity" {
  description = "Maximum number of tasks under load"
  type        = number
  default     = 3
}

variable "cpu_target_value" {
  description = "Target average CPU utilization (%) for the autoscaling policy"
  type        = number
  default     = 60
}

variable "image_tag" {
  description = "Docker image tag to deploy (push it to ECR before applying)"
  type        = string
  default     = "latest"
}
