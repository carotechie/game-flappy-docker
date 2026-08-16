variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "use_alb" {
  description = "true = full mode (register with the ALB target group, restrict SG to the ALB). false = low_cost mode (open the container port publicly, no target group)."
  type        = bool
}

variable "alb_security_group_id" {
  description = "Required when use_alb = true"
  type        = string
  default     = null
}

variable "target_group_arn" {
  description = "Required when use_alb = true"
  type        = string
  default     = null
}

variable "ecr_repository_url" {
  type = string
}

variable "image_tag" {
  type = string
}

variable "container_port" {
  type = number
}

variable "task_cpu" {
  type = number
}

variable "task_memory" {
  type = number
}

variable "desired_count" {
  description = "Initial desired task count (autoscaling takes over afterwards)"
  type        = number
}
