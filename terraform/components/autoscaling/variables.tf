variable "cluster_name" {
  type = string
}

variable "service_name" {
  type = string
}

variable "min_capacity" {
  description = "Minimum number of tasks always running"
  type        = number
}

variable "max_capacity" {
  description = "Maximum number of tasks allowed"
  type        = number
}

variable "cpu_target_value" {
  description = "Target average CPU utilization (%) the policy scales towards"
  type        = number
}
