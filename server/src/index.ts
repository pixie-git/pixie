import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./db/connect";
import router from "./routes/index";
import { setupSocket } from "./sockets/index"; // Import the Socket Manager
import { CONFIG } from "./config";

const PORT = CONFIG.PORT;

// Configuration
const app = express();

// We need to wrap Express in a native HTTP server to attach Socket.io
const httpServer = createServer(app);

// Middleware
app.use(
  cors({
    origin: CONFIG.CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Initialization
connectDB();

// API Routes (REST)
app.use("/api", router);

// --- SOCKET.IO SETUP (Real-time) ---
const io = new Server(httpServer, {
  cors: {
    origin: CONFIG.CLIENT_ORIGIN, // Allow all origins for development
    methods: ["GET", "POST"]
  }
});

// Initialize Socket Logic
setupSocket(io);

// Start Server
// IMPORTANT: We listen on 'httpServer', NOT 'app'
httpServer.listen(PORT, () => {
  console.log(`[INFO] Server listening on port ${PORT}`);
  console.log(`[INFO] Socket.io enabled`);
});
