# Flappy Docker 🐳

Flappy Bird pero con la ballena Docker esquivando contenedores.

> 🆕 **¿Primera vez con Docker o con la terminal?** Sigue la [Guía de inicio para principiantes](./docs/StarterKit.es.md) antes de continuar — explica qué es Docker, cómo abrir Docker Desktop, y cómo descargar y ubicarte en este proyecto paso a paso.

## Requisitos

- [Docker](https://www.docker.com/) instalado y corriendo

## Levantar el juego

```bash
# 1. Construir la imagen
docker build -t flappy-docker .

# 2. Correr el contenedor
docker run -d -p 8080:80 --name flappy-docker flappy-docker

# 3. Abrir en el navegador
open http://localhost:8080
```

## Detener el contenedor

```bash
docker stop flappy-docker && docker rm flappy-docker
```

## Controles

| Acción | Tecla / Gesto |
|--------|--------------|
| Volar  | Clic, Espacio, ↑, Enter |
| Tocar  | Toque en pantalla |

## Dificultad

La velocidad de los contenedores aumenta cada 5 puntos. La mejor puntuación se guarda en el navegador.

## Despliegue en AWS

También se puede desplegar en AWS ECS (Fargate) con Terraform, con dos perfiles a elegir: uno completo (ALB + HTTPS + autoscaling 1-3 tareas, ~$27-30/mes) y uno de bajo costo (una sola tarea, sin ALB, ~$9/mes). Los pasos completos están en [docs/SetupOnAWS.es.md](./docs/SetupOnAWS.es.md).
