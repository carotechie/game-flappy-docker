output "repository_url" {
  description = "URL of the ECR repository (used as the container image base)"
  value       = aws_ecr_repository.this.repository_url
}

output "repository_name" {
  value = aws_ecr_repository.this.name
}
