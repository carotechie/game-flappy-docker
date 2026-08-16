output "task_public_ip" {
  value = data.external.task_ip.result.ip
}
