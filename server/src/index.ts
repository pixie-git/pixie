import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./db/connect.js";
import router from "./routes/index.js";
import { setupSocket } from "./sockets/index.js"; // Import the Socket Manager
import { CONFIG } from "./config.js";

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

// --- SOCKET.IO SETUP (Real-time) ---
const io = new Server(httpServer, {
  cors: {
    origin: CONFIG.CLIENT_ORIGIN, // Allow all origins for development
    methods: ["GET", "POST"]
  }
});

// Initialize Socket Logic
setupSocket(io);

// Attach IO to every request
app.use((req, res, next) => {
  (req as any).io = io;
  next();
});

// Implementation Note: moved socket init before routes so we can attach it to req

import { errorHandler } from "./middlewares/errorMiddleware.js";

// API Routes (REST)
app.use("/api", router);

// Swagger UI
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
const swaggerDocument = YAML.load("./pixie-api.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Global Error Handler
app.use(errorHandler);

// Start Server
// IMPORTANT: We listen on 'httpServer', NOT 'app'
httpServer.listen(PORT, () => {
  console.log(`[INFO] Server listening on port ${PORT}`);
  console.log(`[INFO] Socket.io enabled`);
});
