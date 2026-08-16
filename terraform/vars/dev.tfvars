# Optional lower-cost environment for previewing changes before prod.
# Pinned to a single task (no autoscaling) to keep it cheap.
deployment_mode  = "full"
environment      = "dev"
aws_region       = "us-east-1"
project_name     = "flappy-docker-dev"
domain_name      = "carolinaherreramonteza.com"
subdomain        = "flappy-docker-dev"
container_port   = 80
task_cpu         = 256
task_memory      = 512
desired_count    = 1
min_capacity     = 1
max_capacity     = 1
cpu_target_value = 60
image_tag        = "latest"
