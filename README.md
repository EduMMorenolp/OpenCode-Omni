# OpenCode-Omni

Sistema de automatización basado en [OpenCode](https://opencode.ai) con control remoto vía Telegram, tareas programadas y dashboard web. Todo orquestado con Docker.

## Arquitectura

```
Telegram ──webhook──► backend-api (Express) ──HTTP Basic Auth──► opencode-core (serve)
                             │                                        │
                        node-cron                               browser-plugin
                        (tareas)                                 (Playwright)
                             │
                        SQLite (tasks.db)
                             │
Frontend (React) ──JWT──┤
```

## Servicios

| Servicio | Puerto | Descripción |
|---|---|---|
| `opencode-core` | 4096 | Motor de IA. `opencode serve` + browser plugin |
| `backend-api` | 3000 | Cerebro: Telegram, scheduler, proxy auth, API REST |
| `frontend-dashboard` | 5173 | Dashboard React admin |
| `ngrok` | — | Tunnel HTTPS para webhook Telegram |

## Requisitos

- Docker + Docker Compose
- Token de bot de Telegram (de [@BotFather](https://t.me/BotFather))
- Token de ngrok (de [dashboard.ngrok.com](https://dashboard.ngrok.com))
- (Opcional) [LaLlamaOllama](https://github.com/tuusuario/LaLlamaOllama) como provider de modelos

## Setup rápido

```bash
# 1. Clonar
git clone <repo> && cd OpenCode-Omni

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus tokens

# 3. Build y levantar
docker compose up --build

# 4. Obtener URL pública de ngrok
docker logs omni-ngrok

# 5. Registrar webhook en Telegram
curl "https://api.telegram.org/bot<TU_TOKEN>/setWebhook?url=https://<NGROK_URL>/telegram/webhook"
```

## Variables de entorno

| Variable | Obligatorio | Descripción |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | ✅ | Token de @BotFather |
| `OPENCODE_PASSWORD` | ✅ | Password para OpenCode server |
| `JWT_SECRET` | ✅ | Secreto para firmar JWT |
| `ADMIN_PASSWORD` | ✅ | Password del panel admin |
| `NGROK_AUTHTOKEN` | ✅ | Token de ngrok.io |
| `TZ` | ❌ | Zona horaria (default: `America/Argentina/Buenos_Aires`) |

## Uso

### Desde Telegram

| Comando | Descripción |
|---|---|
| `/start` | Menú de ayuda |
| `/task <prompt> \| <cron>` | Crear tarea programada. Ej: `/task Scrapear Amazon \| 0 9 * * *` |
| `/tasks` | Listar tareas activas |
| `/cancel <id>` | Deshabilitar tarea |
| `/delete <id>` | Eliminar tarea |
| `/status` | Estado del sistema |
| `/shell <cmd>` | Ejecutar comando shell en OpenCode |
| `/session <prompt>` | Chat directo con OpenCode |

### Desde el Dashboard

Acceder a `http://localhost:5173` y loguearse con `admin` / la contraseña definida en `ADMIN_PASSWORD`.

- **Tareas**: CRUD completo, toggle activar/desactivar, historial de ejecuciones
- **Sesiones**: Explorar sesiones activas de OpenCode, enviar prompts, eliminar sesiones

## Desarrollo local

```bash
# Backend (sin Docker)
cd backend
npm install
npm run dev

# Frontend (sin Docker)
cd frontend
npm install
npm run dev
```

## Estructura del proyecto

```
OpenCode-Omni/
├── docker-compose.yml
├── .env.example
├── opencode/
│   ├── Dockerfile
│   └── opencode.json        # Plugins + providers
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js          # Express entry point
│       ├── db/               # SQLite schema + init
│       ├── opencode/         # Cliente HTTP para opencode-core
│       ├── api/              # REST API (auth, tasks, proxy)
│       ├── telegram/         # Webhook + comandos
│       └── scheduler/        # Cron manager
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── api/              # Cliente HTTP
│   │   ├── App.jsx           # Router
│   │   └── pages/            # Login, Dashboard, Tasks, Sessions
│   └── vite.config.js
└── data/                     # Volúmenes Docker (persistencia)
```
