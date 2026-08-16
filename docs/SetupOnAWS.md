🇪🇸 Versión en español disponible en [SetupOnAWS.es.md](./SetupOnAWS.es.md)

# Deploying to AWS (ECS with Terraform)

The infrastructure code lives in [`terraform/`](../terraform), organized into reusable modules (`components/`) and per-environment values (`vars/`):

```
terraform/
├── components/            # Reusable modules
│   ├── network/            # Default VPC/subnets lookup
│   ├── ecr/                 # ECR repository
│   ├── dns/                 # Lookup of the existing Route53 hosted zone
│   ├── acm/                 # Free TLS certificate (DNS-validated) — "full" mode only
│   ├── alb/                  # ALB + listeners (80→443) + subdomain DNS record — "full" mode only
│   ├── ecs/                  # Cluster, task definition, and Fargate service
│   ├── autoscaling/          # Application Auto Scaling (min↔max tasks, CPU target) — "full" mode only
│   └── dns_task_record/      # A record pointing to the task's public IP — "low_cost" mode only
├── vars/
│   ├── prod.tfvars                 # deployment_mode = "full"
│   ├── prod-lowcost.tfvars         # deployment_mode = "low_cost", alternative to prod.tfvars
│   ├── dev.tfvars                  # optional environment, full mode pinned to 1 task
│   ├── backend-prod.hcl
│   ├── backend-prod-lowcost.hcl
│   └── backend-dev.hcl
├── main.tf / variables.tf / outputs.tf
├── providers.tf / versions.tf / backend.tf
```

## Two infrastructure profiles

The `deployment_mode` variable picks between two complete architectures. Apply **one or the other**, never both against the same environment.

| | `full` (`vars/prod.tfvars`) | `low_cost` (`vars/prod-lowcost.tfvars`) |
|---|---|---|
| Resources | ECR + ECS + ALB + ACM + Autoscaling | ECR + ECS + Route53 |
| Tasks | 1 to 3 (CPU-based autoscaling, 60% target) | fixed at 1 |
| Protocol | HTTPS (free ACM certificate) | HTTP |
| Routing to the task | ALB with health checks, self-healing | A record pointing directly at the task's public IP |
| Approx. cost | **~$27-30/mo** (ALB ~$17-20 fixed + Fargate ~$9, up to ~$27 if it scales to 3) | **~$9/mo** (Fargate only) |
| DNS reliability | High — the ALB never routes to a dead task | ⚠️ See the limitation below |

### ⚠️ `low_cost` mode limitation

Without an ALB there's nothing stable to point DNS at. This mode resolves the running task's public IP **at `terraform apply` time** and writes an A record with a 60s TTL. If the task restarts or AWS reschedules it between two `apply` runs (a crash, maintenance, etc.), its IP changes and the record goes stale until the next `terraform apply`. There's no self-healing like in `full` mode. It's a reasonable trade-off for a low-traffic personal project, not for anything that needs guaranteed availability.

This mode also requires the `aws` CLI and `jq` installed on the machine running Terraform (used by `components/dns_task_record/get-task-ip.sh` to resolve the IP).

## Prerequisites

- A Route53 hosted zone already created for `carolinaherreramonteza.com`
- AWS CLI configured with credentials that have permissions over ECS, EC2 (VPC/SG/ENI), ELB, Route53, ACM, ECR, IAM, Application Auto Scaling, and S3 (for the state)
- Terraform >= 1.10 (the backend uses native S3 locking, available since that version)
- Docker (to build the image)
- `jq` (only if you're using `low_cost` mode)

## 1. Remote backend

State is stored in the existing S3 bucket **`tf-state-carotechie`**, under the `flappy-docker/<environment>/` prefix, using native S3 locking (`use_lockfile = true`, no DynamoDB). Nothing needs to be created — the bucket already exists. The `terraform/vars/backend-*.hcl` files already point there.

## 2. Build and publish the image to ECR

Terraform creates the ECR repository, but it needs the image already published before the first full `apply` (the ECS service will fail to start if it tries to pull an image that doesn't exist):

```bash
cd terraform
terraform init -backend-config=vars/backend-prod.hcl
terraform apply -target=module.ecr -var-file=vars/prod.tfvars

REPO_URL=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "${REPO_URL%%/*}"

docker build -t "$REPO_URL:latest" ..
docker push "$REPO_URL:latest"
```

## 3. Deploy the rest of the infrastructure

**Full mode** (ALB + HTTPS + autoscaling 1-3 tasks):

```bash
terraform apply -var-file=vars/prod.tfvars
terraform output app_url
```

**low_cost mode** (a single task, no ALB, HTTP):

```bash
terraform init -backend-config=vars/backend-prod-lowcost.hcl -reconfigure
terraform apply -target=module.ecr -var-file=vars/prod-lowcost.tfvars   # if you haven't published the image to this state yet
terraform apply -var-file=vars/prod-lowcost.tfvars
terraform output app_url
```

## Updating the deployed game

```bash
docker build -t "$REPO_URL:latest" .
docker push "$REPO_URL:latest"
aws ecs update-service --cluster flappy-docker-cluster --service flappy-docker-service --force-new-deployment
```

In `low_cost` mode, also run `terraform apply -var-file=vars/prod-lowcost.tfvars` after redeploying to resync the DNS record with the new task's IP.

## Dev environment (optional)

`vars/dev.tfvars` deploys a cheaper copy (`flappy-docker-dev.carolinaherreramonteza.com`, `full` mode but pinned to 1 task) to test changes before applying them to prod:

```bash
terraform init -backend-config=vars/backend-dev.hcl -reconfigure
terraform apply -var-file=vars/dev.tfvars
```

## Tearing down the infrastructure

```bash
terraform destroy -var-file=vars/prod.tfvars          # or vars/prod-lowcost.tfvars, whichever you applied
```
