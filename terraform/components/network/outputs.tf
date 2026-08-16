output "vpc_id" {
  description = "ID of the default VPC"
  value       = data.aws_vpc.default.id
}

output "subnet_ids" {
  description = "IDs of the default VPC's public subnets (one per AZ)"
  value       = data.aws_subnets.public.ids
}
