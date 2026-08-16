# Alternative to prod.tfvars: same app, no ALB/ACM/autoscaling.
# ~$9/mo instead of ~$27-30/mo, plain HTTP, single task with no self-healing DNS
# (see the "low_cost" caveat in SetupOnAWS.md). Apply ONE of prod.tfvars or
# this file for a given environment, not both against the same state.
deployment_mode  = "low_cost"
environment      = "prod"
aws_region       = "us-east-1"
project_name     = "flappy-docker"
domain_name      = "carolinaherreramonteza.com"
subdomain        = "flappy-docker"
container_port   = 80
task_cpu         = 256
task_memory      = 512
desired_count    = 1
min_capacity     = 1
max_capacity     = 1
cpu_target_value = 60
image_tag        = "latest"
