## Remote state in S3, using native S3 locking (Terraform >= 1.10) instead of
## a DynamoDB table. Left intentionally partial: no bucket/key is hardcoded
## here since it differs per environment. State lives in the existing
## tf-state-carotechie bucket, under a flappy-docker/<env>/ prefix.
##
## Run one of:
##   terraform init -backend-config=vars/backend-prod.hcl
##   terraform init -backend-config=vars/backend-prod-lowcost.hcl
##   terraform init -backend-config=vars/backend-dev.hcl

terraform {
  backend "s3" {}
}
