# Despliegue en AWS (ECS con Terraform)

El código de infraestructura vive en [`terraform/`](./terraform), organizado en módulos reutilizables (`components/`) y valores por entorno (`vars/`):

```
terraform/
├── components/            # Módulos reutilizables
│   ├── network/            # Lookup de la VPC/subnets por defecto
│   ├── ecr/                 # Repositorio ECR
│   ├── dns/                 # Lookup de la hosted zone existente en Route53
│   ├── acm/                 # Certificado TLS gratuito (validado por DNS) — solo modo "full"
│   ├── alb/                  # ALB + listeners (80→443) + registro DNS del subdominio — solo modo "full"
│   ├── ecs/                  # Cluster, task definition y servicio Fargate
│   ├── autoscaling/          # Application Auto Scaling (min↔max tareas, target CPU) — solo modo "full"
│   └── dns_task_record/      # Registro A apuntando a la IP pública de la tarea — solo modo "low_cost"
├── vars/
│   ├── prod.tfvars                 # deployment_mode = "full"
│   ├── prod-lowcost.tfvars         # deployment_mode = "low_cost", alternativa a prod.tfvars
│   ├── dev.tfvars                  # entorno opcional, full mode fijo en 1 tarea
│   ├── backend-prod.hcl
│   ├── backend-prod-lowcost.hcl
│   └── backend-dev.hcl
├── main.tf / variables.tf / outputs.tf
├── providers.tf / versions.tf / backend.tf
```

## Dos perfiles de infraestructura

La variable `deployment_mode` elige entre dos arquitecturas completas. Se aplica **una u otra**, no ambas a la vez sobre el mismo entorno.

| | `full` (`vars/prod.tfvars`) | `low_cost` (`vars/prod-lowcost.tfvars`) |
|---|---|---|
| Recursos | ECR + ECS + ALB + ACM + Autoscaling | ECR + ECS + Route53 |
| Tareas | 1 a 3 (autoscaling por CPU, target 60%) | 1 fija |
| Protocolo | HTTPS (certificado ACM gratuito) | HTTP |
| Ruteo a la tarea | ALB con health checks, se auto-repara | Registro A apuntando directo a la IP pública de la tarea |
| Costo aprox. | **~$27-30/mes** (ALB ~$17-20 fijo + Fargate ~$9, hasta ~$27 si escala a 3) | **~$9/mes** (solo Fargate) |
| Confiabilidad del DNS | Alta — el ALB nunca apunta a una tarea caída | ⚠️ Ver limitación abajo |

### ⚠️ Limitación del modo `low_cost`

Sin ALB no hay nada estable a lo que apuntar el DNS. Este modo resuelve la IP pública de la tarea en ejecución **en el momento del `terraform apply`** y escribe un registro A con TTL de 60s. Si la tarea se reinicia o AWS la reprograma entre dos `apply` (crash, mantenimiento, etc.), su IP cambia y el registro queda desactualizado hasta el siguiente `terraform apply`. No hay auto-reparación como en el modo `full`. Es un trade-off razonable para un proyecto personal de bajo tráfico, no para algo que necesite disponibilidad garantizada.

Este modo además requiere `aws` CLI y `jq` instalados en la máquina donde corres Terraform (los usa `components/dns_task_record/get-task-ip.sh` para resolver la IP).

## Prerrequisitos

- Una hosted zone ya creada en Route53 para `carolinaherreramonteza.com`
- AWS CLI configurado con credenciales con permisos sobre ECS, EC2 (VPC/SG/ENI), ELB, Route53, ACM, ECR, IAM, Application Auto Scaling y S3 (para el state)
- Terraform >= 1.10 (el backend usa locking nativo de S3, disponible desde esa versión)
- Docker (para construir la imagen)
- `jq` (solo si vas a usar el modo `low_cost`)

## 1. Backend remoto

El estado se guarda en el bucket S3 existente **`tf-state-carotechie`**, bajo el prefijo `flappy-docker/<entorno>/`, con locking nativo de S3 (`use_lockfile = true`, sin DynamoDB). No hace falta crear nada — el bucket ya existe. Los archivos `terraform/vars/backend-*.hcl` ya apuntan ahí.

## 2. Construir y publicar la imagen en ECR

El repositorio ECR lo crea Terraform, pero necesita la imagen ya publicada antes del primer `apply` completo (el servicio ECS fallará si intenta arrancar una imagen que no existe):

```bash
cd terraform
terraform init -backend-config=vars/backend-prod.hcl
terraform apply -target=module.ecr -var-file=vars/prod.tfvars

REPO_URL=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "${REPO_URL%%/*}"

docker build -t "$REPO_URL:latest" ..
docker push "$REPO_URL:latest"
```

## 3. Desplegar el resto de la infraestructura

**Modo full** (ALB + HTTPS + autoscaling 1-3 tareas):

```bash
terraform apply -var-file=vars/prod.tfvars
terraform output app_url
```

**Modo low_cost** (una sola tarea, sin ALB, HTTP):

```bash
terraform init -backend-config=vars/backend-prod-lowcost.hcl -reconfigure
terraform apply -target=module.ecr -var-file=vars/prod-lowcost.tfvars   # si aún no publicaste la imagen en este state
terraform apply -var-file=vars/prod-lowcost.tfvars
terraform output app_url
```

## Actualizar el juego desplegado

```bash
docker build -t "$REPO_URL:latest" .
docker push "$REPO_URL:latest"
aws ecs update-service --cluster flappy-docker-cluster --service flappy-docker-service --force-new-deployment
```

En modo `low_cost`, corré además `terraform apply -var-file=vars/prod-lowcost.tfvars` después del redeploy para resincronizar el registro DNS con la IP de la nueva tarea.

## Entorno dev (opcional)

`vars/dev.tfvars` despliega una copia más barata (`flappy-docker-dev.carolinaherreramonteza.com`, modo `full` pero fija en 1 tarea) para probar cambios antes de aplicarlos en prod:

```bash
terraform init -backend-config=vars/backend-dev.hcl -reconfigure
terraform apply -var-file=vars/dev.tfvars
```

## Destruir la infraestructura

```bash
terraform destroy -var-file=vars/prod.tfvars          # o vars/prod-lowcost.tfvars, según el que hayas aplicado
```
