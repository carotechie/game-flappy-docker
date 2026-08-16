#!/usr/bin/env bash
# Invoked by `data "external"` in main.tf. Reads a JSON query object on stdin
# ({"cluster": "...", "service": "...", "region": "..."}) and prints
# {"ip": "<public ip>"} on stdout, per the external data source protocol.
set -euo pipefail

eval "$(jq -r '@sh "CLUSTER=\(.cluster) SERVICE=\(.service) REGION=\(.region)"')"

TASK_ARN=$(aws ecs list-tasks \
  --cluster "$CLUSTER" \
  --service-name "$SERVICE" \
  --desired-status RUNNING \
  --region "$REGION" \
  --query 'taskArns[0]' \
  --output text)

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" = "None" ]; then
  echo "get-task-ip.sh: no RUNNING task found for service '$SERVICE' in cluster '$CLUSTER' yet" >&2
  exit 1
fi

ENI_ID=$(aws ecs describe-tasks \
  --cluster "$CLUSTER" \
  --tasks "$TASK_ARN" \
  --region "$REGION" \
  --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value | [0]" \
  --output text)

PUBLIC_IP=$(aws ec2 describe-network-interfaces \
  --network-interface-ids "$ENI_ID" \
  --region "$REGION" \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text)

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
  echo "get-task-ip.sh: task ENI '$ENI_ID' has no public IP yet" >&2
  exit 1
fi

jq -n --arg ip "$PUBLIC_IP" '{"ip": $ip}'
