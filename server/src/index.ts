import cors from "cors";
import express from "express";
import { createServer } from "http"; // REQUIRED: Native HTTP server wrapper
import { Server } from "socket.io";  // REQUIRED: Socket.io Server
import { connectDB } from "./db/connect";
import router from "./routes/index";
import { setupSocket } from "./sockets"; // Import the Socket Manager
import { CONFIG } from "./config";       // Use centralized config

// Configuration
const app = express();

// We need to wrap Express in a native HTTP server to attach Socket.io
const httpServer = createServer(app);

// Middleware
app.use(
  cors({
    origin: "*",
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
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST"]
  }
});

// Initialize Socket Logic (The Layered Architecture Entry Point)
setupSocket(io);

// Start Server
// IMPORTANT: We listen on 'httpServer', NOT 'app'
httpServer.listen(CONFIG.PORT, () => {
  console.log(`
  [INFO] 🚀 Server running on http://localhost:${CONFIG.PORT}
  -----------------------------------------------
  REST API:   Enabled (/api)
  Socket.io:  Enabled
  Database:   Connecting...
  -----------------------------------------------
  `);
});