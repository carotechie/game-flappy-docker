# Flappy Docker 🐳

Flappy Bird pero con la ballena Docker esquivando contenedores.

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
