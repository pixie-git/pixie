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

Access everything through the client port:
- **App**: http://localhost:3080
- **API**: http://localhost:3080/api
- **Swagger**: http://localhost:3080/api-docs
- **Mongo Express**: http://localhost:8081

The client's nginx proxies API/Socket requests internally.

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | **Yes** | - | Secret for JWT tokens |
| `CLIENT_ORIGIN` | No | `*` | CORS origins (comma-separated for multiple) |
| `CLIENT_PORT` | No | `3080` | Host port for frontend |
| `ME_PORT` | No | `8081` | Host port for Mongo Express |
| `ME_USERNAME` | No | `admin` | Mongo Express username |
| `ME_PASSWORD` | No | `changeme` | Mongo Express password |
| `VITE_API_URL` | No | `` | API URL (only if exposing API on separate domain) |

### Portainer + Nginx Proxy Manager

The client's nginx proxies API/Socket internally, so you only need to expose the app itself.

**Minimal setup (recommended):**

| Domain | Forward To | Port | WebSocket |
|--------|------------|------|-----------|
| `app.example.com` | `pixie-client` | 3080 | **Yes** |

That's it. API, Swagger, and Socket.io are all proxied through the client.

**Optional: Expose additional services**

If you want direct access to other services (NPM must be on the same Docker network, or add port mappings to compose):

| Domain | Forward To | Port | WebSocket |
|--------|------------|------|-----------|
| `api.example.com` | `pixie-server` | 3000 | **Yes** |
| `mongo.example.com` | `pixie-mongo-express` | 8081 | No |

**Steps:**

1. **Deploy Stack in Portainer**
   - Create new stack, paste `docker-compose.prod.yml`
   - Add environment variables:
     ```
     JWT_SECRET=your-long-random-secret
     CLIENT_ORIGIN=https://app.example.com
     ME_PASSWORD=secure-password
     ```
   - If exposing API separately, add it to CORS: `CLIENT_ORIGIN=https://app.example.com,https://api.example.com`

2. **Create NPM Proxy Host**
   - Domain: `app.example.com`
   - Forward: `pixie-client` port `3080`
   - Enable **Websockets Support**
   - Add SSL via Let's Encrypt

3. **SSL**: Use NPM's built-in Let's Encrypt for HTTPS.

### CORS Configuration

`CLIENT_ORIGIN` supports:
- Single origin: `https://app.example.com`
- Multiple origins: `https://app.example.com,https://api.example.com`
- Allow all: `*` (not recommended for production)

Include both your app domain and API domain if Swagger needs to make requests.

### Architecture

**Standalone** (single entry point):
```
localhost:3080 ──► pixie-client (nginx)
                      ├── /           → static files
                      ├── /api/       → proxy to pixie-server:3000
                      ├── /api-docs   → proxy to pixie-server:3000
                      └── /socket.io/ → proxy to pixie-server:3000 (WebSocket)
```

**With NPM** (separate domains):
```
app.example.com ──► NPM ──► pixie-client:3080
api.example.com ──► NPM ──► pixie-server:3000 (enable WebSocket)
mongo.example.com ──► NPM ──► pixie-mongo-express:8081
```

MongoDB is **not exposed** externally—only accessible within the Docker network.
