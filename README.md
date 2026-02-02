# Pixie - Collaborative Pixel Art Editor

**Pixie** is a real-time collaborative pixel art editor that allows multiple users to draw together on a shared canvas.

## ✨ Features

- **Real-Time Collaboration**: Draw with friends instantly using WebSocket technology.
- **Lobbies System**: Create and join public rooms to manage art sessions.
- **Live Updates**: See new lobbies appear and disappear in real-time without refreshing.
- **User Profiles**: Manage your account, switch themes (Light/Dark), and toggle notifications.
- **Notifications System**: Get alerted when you are kicked, banned, or when important events happen.
- **Responsive Design**: Works on desktop and mobile devices.
- **Admin Tools**: Lobby owners can kick or ban users to maintain order.
- **Export Art**:  Download your creations as PNG images.

## 🛠️ Technology Stack

### Client (Frontend)
- **Framework**: [Vue.js 3](https://vuejs.org/) (Composition API)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **Routing**: [Vue Router](https://router.vuejs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Real-Time Communication**: [Socket.IO Client](https://socket.io/)
- **Styling**: Vanilla CSS (with CSS Variables for theming)

### Server (Backend)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (with Mongoose)
- **Real-Time Communication**: [Socket.IO](https://socket.io/)
- **API Documentation**: [Swagger UI](https://swagger.io/)
- **Authentication**: JWT (JSON Web Tokens)

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or a cloud URI)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/pixie.git
    cd pixie
    ```

2.  **Setup Server:**
    ```bash
    cd server
    npm install
    cp .env.example .env # Configure your MongoDB URI and secrets here
    npm run dev
    ```
    The server will run on `http://localhost:3000`. API Docs available at `/api-docs`.

3.  **Setup Client:**
    ```bash
    cd ../client
    npm install
    npm run dev
    ```
    The client will run on `http://localhost:5173`.

### Docker (Optional)
This project includes a `docker-compose.yml` file for easy deployment.
```bash
docker-compose up --build
```

## 📖 API Documentation
Once the server is running, you can access the full interactive API documentation at:
**[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

