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
docker compose up
```

| Service | URL |
|---------|-----|
| App | http://localhost:5173 |
| API Docs | http://localhost:3000/api-docs |

### Manual

```bash
# Server
cd server && npm install && npm run dev

# Client (separate terminal)
cd client && npm install && npm run dev
```

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
| `PORT` | `3000` | Server port |

---

## 🛠️ Built With

**Frontend:** Vue.js 3 • Pinia • Vite • Socket.IO  
**Backend:** Node.js • Express • MongoDB • Socket.IO

---

<div align="center">

Made with ❤️ and pixels

Logo by [@TommasoTurci](https://github.com/TommasoTurci) 🙏

</div>

