<div align="center">

<img src="logo.png" alt="Pixie Logo" width="200">

# 🎨 Pixie

**Real-time collaborative pixel art editor**

Draw together on a shared canvas — like r/place, but for friends.

</div>

---

## ✨ Features

- **Real-time drawing** — See every pixel update instantly
- **Lobby system** — Create and join public drawing rooms
- **Customizable canvases** — Multiple sizes and color palettes
- **Admin tools** — Kick and ban disruptive users
- **Export to PNG** — Download your artwork
- **Mobile-friendly** — Touch support with pan & zoom

---

## 🚀 Quick Start

### Docker (Recommended)

```bash
docker compose up -d --scale server=3
```

| Service | URL |
|---------|-----|
| App | http://localhost:3080 |
| API Docs | http://localhost:3080/api-docs |

> 💡 **Dynamic Scaling:** You can add more server instances at any time using `--scale server=N`. Traefik is configured with `least_conn` and sticky sessions to balance active connections across all instances.

### Manual

```bash
# Prerequisites: MongoDB and Redis running locally

# Server
cd server && npm install && npm run dev

# Client (separate terminal)
cd client && npm install && npm run dev
```

### Testing

Run the full test suite (requires Docker):
```bash
npm test
```
This script handles temporary infrastructure (Redis) automatically.

### Production

```bash
JWT_SECRET=your-secret docker compose -f docker-compose.prod.yml up -d --build
```

> 📖 See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `dev-secret-key` | **Required in production** |
| `MONGO_URI` | `mongodb://localhost:27017/pixie` | Database connection |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection for scaling |
| `PORT` | `3000` | Server port |

---

## 🛠️ Built With

**Frontend:** Vue.js 3 • Pinia • Vite • Socket.IO  
**Backend:** Node.js • Express • MongoDB • Redis • Socket.IO

---

<div align="center">

Made with ❤️ and pixels

Logo by [@TommasoTurci](https://github.com/TommasoTurci) 🙏

</div>

