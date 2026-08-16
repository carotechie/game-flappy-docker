#   terraform init -backend-config=vars/backend-prod.hcl
bucket       = "tf-state-carotechie"
key          = "flappy-docker/prod/terraform.tfstate"
region       = "us-east-1"
encrypt      = true
use_lockfile = true # native S3 locking (Terraform >= 1.10), no DynamoDB table needed
