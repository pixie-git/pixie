# Deployment Guide

## Development

```bash
docker compose up
```

Access:
- **App**: http://localhost:5173
- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api-docs
- **Mongo Express**: http://localhost:8081

## Production

### Standalone (No Reverse Proxy)

```bash
JWT_SECRET=your-secret-here docker compose -f docker-compose.prod.yml up -d --build
```

Access everything through the entry point port:
- **App**: http://localhost:3080
- **API**: http://localhost:3080/api
- **Swagger**: http://localhost:3080/api-docs
- **Mongo Express**: http://localhost:8081

Traefik handles routing and sticky sessions for Socket.io.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Yes** | - | Secret for JWT tokens |
| `CLIENT_ORIGIN` | No | `*` | CORS origins (comma-separated for multiple) |
| `CLIENT_PORT` | No | `3080` | Host port for frontend/entry point |
| `REDIS_URL` | No | `redis://redis:6379` | Internal Redis URL |
| `CANVAS_WIDTH` | No | `64` | Default canvas width |
| `CANVAS_HEIGHT` | No | `64` | Default canvas height |
| `ME_PORT` | No | `8081` | Host port for Mongo Express |
| `ME_USERNAME` | No | `admin` | Mongo Express username |
| `ME_PASSWORD` | No | `changeme` | Mongo Express password |
| `VITE_API_URL` | No | `` | API URL (used at build time for client) |

### Portainer + Reverse Proxy

Traefik handles internal routing, so you only need to expose the Traefik entry point.

**Minimal setup (recommended):**

| Domain | Forward To | Port | WebSocket |
|--------|------------|------|-----------|
| `app.example.com` | `pixie-traefik` | 80 | **Yes** |

**Steps:**

1. **Deploy Stack in Portainer**
   - Create new stack, paste `docker-compose.prod.yml`
   - Add environment variables:
     ```
     JWT_SECRET=your-long-random-secret
     CLIENT_ORIGIN=https://app.example.com
     ME_PASSWORD=secure-password
     ```

2. **Reverse Proxy (Nginx Proxy Manager / Caddy)**
   - Point your domain to the Docker host.
   - Forward traffic to the Docker host on port `3080` (or your configured `CLIENT_PORT`), or directly to the `pixie-traefik` container on port `80` if the proxy is on the same Docker network.
   - Enable **Websockets Support**.

### Architecture

**Standalone** (Traefik as entry point):
```
localhost:3080 ──► pixie-traefik
                      ├── /           → pixie-client:80
                      ├── /api/       → pixie-server:3000
                      ├── /api-docs   → pixie-server:3000
                      └── /socket.io/ → pixie-server:3000 (WebSocket + Sticky Sessions)
```

MongoDB and Redis are **not exposed** externally—only accessible within the Docker network.
