🇪🇸 Versión en español disponible en [StarterKit.es.md](./StarterKit.es.md)

# Beginner's Starter Guide 🐳

This guide is for anyone who has never used Docker or a terminal before. If you already have Docker installed and know your way around the command line, go straight to the [README](../README.md).

## What is all this?

- **Docker**: a program that packages an app (in this case, the game) together with everything it needs to run, into a unit called an **image**. That way, the game runs the same on your machine as on anyone else's, with nothing else to install besides Docker.
- **Container**: an image "switched on" and running. It's like an isolated, lightweight mini-computer that starts up in seconds.
- **`Dockerfile`**: the file in this repo (`Dockerfile`) with the instructions to build the image. In this project it's just 4 lines: grab a web server (nginx), copy the game's files into it, and leave it ready to serve.
- **Docker Desktop**: the application you install on your machine (Windows/macOS/Linux) to have Docker running. Without Docker Desktop *open and running in the background*, the `docker build` / `docker run` commands will fail with an error like `Cannot connect to the Docker daemon`.

For the official, more complete explanation: [What is Docker? (docs.docker.com)](https://docs.docker.com/get-started/docker-overview/).

## 1. Install and open Docker Desktop

1. Download it from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) (choose your OS: Windows, macOS, or Linux).
2. Install it like any other application.
3. **Open it and leave it open** — you'll see the whale icon 🐳 in the taskbar (Windows) or the menu bar (macOS). As long as it's there, Docker is running and you can use the commands.
   - On Linux you can also use Docker Engine directly (without the "Desktop" app), but if it's your first time, Docker Desktop is simpler.

## 2. Open a terminal

A terminal is where you'll type the commands. No extra installation needed — every OS already ships with one:

| OS | Recommended terminal | How to open it |
|---|---|---|
| **Windows** | PowerShell | Search for "PowerShell" in the Start menu and open it |
| **macOS** | Terminal (or [iTerm2](https://iterm2.com/)) | `Cmd + Space`, type "Terminal", Enter |
| **Linux** | Your distro's terminal | Depends on your desktop environment (GNOME Terminal, Konsole, etc.) |

## 3. Download the project

**Option A — with git** (if you already have it installed):

```bash
git clone https://github.com/carotechie/game-flappy-docker.git
```

This creates a `game-flappy-docker` folder with all the code.

**Option B — without git, downloading the ZIP**:

1. Go to [github.com/carotechie/game-flappy-docker](https://github.com/carotechie/game-flappy-docker)
2. Green **"Code" → "Download ZIP"** button
3. Extract the ZIP wherever you like (for example, your Downloads folder)

## 4. Go to the project folder in the terminal

With the terminal open, use `cd` (change directory) to move into the folder you just cloned or extracted.

**macOS / Linux:**

```bash
cd ~/Downloads/game-flappy-docker
```

**Windows (PowerShell):**

```powershell
cd $HOME\Downloads\game-flappy-docker
```

> 💡 **Trick if you don't know the exact path**: type `cd ` (with a trailing space) in the terminal, then **drag the folder** from File Explorer / Finder into the terminal window. The path fills in by itself — just press Enter.

To confirm you're in the right place, run `ls` (macOS/Linux) or `dir` (Windows) and you should see files like `Dockerfile`, `index.html`, `game.js`.

## 5. Build and run the game

With Docker Desktop open and your terminal in the project folder, follow the commands in the [**"Levantar el juego"** section of the README](../README.md#levantar-el-juego).

## Common issues

| Error | Likely cause | Fix |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop isn't open | Open Docker Desktop and wait for the whale icon to stop "loading" |
| `command not found: docker` / `'docker' is not recognized...` | Docker Desktop was just installed | Close and reopen the terminal (sometimes a restart is needed) |
| `port is already allocated` | Port 8080 is already in use | Use a different port, e.g. `-p 8081:80` instead of `-p 8080:80`, and open `http://localhost:8081` |
| `Error response from daemon: Conflict... container name "/flappy-docker" is already in use` | A container with that name already exists from a previous run | Run `docker stop flappy-docker && docker rm flappy-docker` and try again |

## Quick glossary

- **Image**: the packaged "template" (code + dependencies), created with `docker build`.
- **Container**: a running instance of an image, created with `docker run`.
- **Docker Engine**: the engine that actually runs the containers.
- **Docker Desktop**: the graphical app that installs and manages Docker Engine for you.

With that, you should have the game running at `http://localhost:8080` 🐳🎮. For anything else, head back to the [README](../README.md).
