🇬🇧 English version is on [StarterKit.md](./StarterKit.md)

# Guía de inicio para principiantes 🐳

Esta guía es para quien nunca usó Docker ni una terminal antes. Si ya tienes Docker instalado y sabes moverte por la línea de comandos, ve directo al [README](../README.md).

## ¿Qué es todo esto?

- **Docker**: un programa que empaqueta una aplicación (en este caso, el juego) junto con todo lo que necesita para funcionar, en una unidad llamada **imagen**. Así, el juego funciona igual en tu equipo que en cualquier otro, sin instalar nada más que Docker.
- **Contenedor**: una imagen "encendida" y en ejecución. Es como una mini computadora aislada y liviana, que se inicia en segundos.
- **`Dockerfile`**: el archivo de este repositorio (`Dockerfile`) con las instrucciones para construir la imagen. En este proyecto son solo 4 líneas: toma un servidor web (nginx), copia los archivos del juego dentro, y lo deja listo para servir.
- **Docker Desktop**: la aplicación que se instala en tu equipo (Windows/macOS/Linux) para tener Docker funcionando. Sin Docker Desktop *abierto y ejecutándose en segundo plano*, los comandos `docker build` / `docker run` van a fallar con un error del tipo `Cannot connect to the Docker daemon`.

Para la explicación oficial y más completa: [¿Qué es Docker? (docs.docker.com)](https://docs.docker.com/get-started/docker-overview/).

## 1. Instalar y abrir Docker Desktop

1. Descárgalo desde [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) (elige tu sistema operativo: Windows, macOS o Linux).
2. Instálalo como cualquier otra aplicación.
3. **Ábrelo y déjalo abierto** — vas a ver el ícono de la ballena 🐳 en la barra de tareas (Windows) o en la barra de menú (macOS). Mientras esté ahí, Docker está funcionando y se pueden usar los comandos.
   - En Linux también se puede usar Docker Engine directamente (sin la aplicación "Desktop"), pero si es la primera vez, Docker Desktop es más simple.

## 2. Abrir una terminal

Una terminal es donde vas a escribir los comandos. No hace falta instalar nada adicional, cada sistema operativo ya trae una:

| Sistema | Terminal recomendada | Cómo abrirla |
|---|---|---|
| **Windows** | PowerShell | Busca "PowerShell" en el menú de inicio y ábrelo |
| **macOS** | Terminal (o [iTerm2](https://iterm2.com/)) | `Cmd + Espacio`, escribe "Terminal", Enter |
| **Linux** | La terminal de tu distribución | Depende del entorno de escritorio (GNOME Terminal, Konsole, etc.) |

## 3. Descargar el proyecto

**Opción A — con git** (si ya lo tienes instalado):

```bash
git clone https://github.com/carotechie/game-flappy-docker.git
```

Esto crea una carpeta `game-flappy-docker` con todo el código.

**Opción B — sin git, descargando el ZIP**:

1. Entra a [github.com/carotechie/game-flappy-docker](https://github.com/carotechie/game-flappy-docker)
2. Botón verde **"Code" → "Download ZIP"**
3. Extrae el ZIP donde prefieras (por ejemplo, tu carpeta de Descargas)

## 4. Ir a la carpeta del proyecto en la terminal

Con la terminal abierta, usa `cd` (change directory) para moverte hasta la carpeta que acabas de clonar o extraer.

**macOS / Linux:**

```bash
cd ~/Downloads/game-flappy-docker
```

**Windows (PowerShell):**

```powershell
cd $HOME\Downloads\game-flappy-docker
```

> 💡 **Truco si no conoces la ruta exacta**: escribe `cd ` (con un espacio al final) en la terminal, y luego **arrastra la carpeta** desde el Explorador de archivos / Finder hacia la ventana de la terminal. La ruta se completa sola — solo falta presionar Enter.

Para confirmar que estás en el lugar correcto, ejecuta `ls` (macOS/Linux) o `dir` (Windows) y deberías ver archivos como `Dockerfile`, `index.html`, `game.js`.

## 5. Construir y ejecutar el juego

Con Docker Desktop abierto y la terminal ubicada en la carpeta del proyecto, sigue los comandos de la sección [**"Levantar el juego"** del README](../README.md#levantar-el-juego).

## Problemas comunes

| Error | Causa probable | Solución |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop no está abierto | Abre Docker Desktop y espera a que el ícono de la ballena termine de "cargar" |
| `command not found: docker` / `'docker' no se reconoce...` | Docker Desktop recién instalado | Cierra y vuelve a abrir la terminal (a veces hace falta reiniciar el equipo) |
| `port is already allocated` | El puerto 8080 ya está en uso | Usa otro puerto, por ejemplo `-p 8081:80` en vez de `-p 8080:80`, y abre `http://localhost:8081` |
| `Error response from daemon: Conflict... container name "/flappy-docker" is already in use` | Ya existe un contenedor con ese nombre de una ejecución anterior | Ejecuta `docker stop flappy-docker && docker rm flappy-docker` e inténtalo de nuevo |

## Glosario rápido

- **Imagen**: el "molde" empaquetado (código + dependencias), creado con `docker build`.
- **Contenedor**: una imagen en ejecución, creada con `docker run`.
- **Docker Engine**: el motor que realmente ejecuta los contenedores.
- **Docker Desktop**: la aplicación con interfaz gráfica que instala y administra Docker Engine.

Con esto ya deberías tener el juego funcionando en `http://localhost:8080` 🐳🎮. Para cualquier otra duda, vuelve al [README](../README.md).
