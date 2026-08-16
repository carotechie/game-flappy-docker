# Separate state key so experimenting with prod-lowcost.tfvars never
# clobbers the full-mode prod state.
#   terraform init -backend-config=vars/backend-prod-lowcost.hcl -reconfigure
bucket       = "tf-state-carotechie"
key          = "flappy-docker/prod-lowcost/terraform.tfstate"
region       = "us-east-1"
encrypt      = true
use_lockfile = true # native S3 locking (Terraform >= 1.10), no DynamoDB table needed
