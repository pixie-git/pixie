import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./db/connect.js";
import router from "./routes/index.js";
import { setupSocket } from "./sockets/index.js";
import { CONFIG } from "./config.js";
import { errorHandler } from "./middlewares/errorMiddleware.js";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { setupRedisDataClient, closeRedisDataClient } from "./db/redis.js";
import { setupRedisAdapter, closeRedisAdapterClients } from "./sockets/redisAdapter.js";
import { CoordinationService } from "./services/coordination.service.js";

const PORT = CONFIG.PORT;

const app = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: CONFIG.CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Connect to Redis (Data Client)
    await setupRedisDataClient();

    // 3. Setup Socket.io with Redis Adapter
    const io = new Server(httpServer, {
      cors: {
        origin: CONFIG.CLIENT_ORIGIN,
        methods: ["GET", "POST"]
      }
    });

    const redisAdapter = await setupRedisAdapter();
    io.adapter(redisAdapter);

    // Initialize Socket Logic
    setupSocket(io);

    // Start background flush worker
    CoordinationService.startFlushWorker();

    // Attach IO to every request
    app.use((req, res, next) => {
      (req as any).io = io;
      next();
    });

    // API Routes (REST)
    app.use("/api", router);

    // Swagger UI
    const swaggerDocument = YAML.load("./pixie-api.yaml");
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    // Global Error Handler
    app.use(errorHandler);

    httpServer.listen(PORT, () => {
      console.log(`[INFO] Server listening on port ${PORT} (ID: ${process.env.SERVER_ID || 'standalone'})`);
      console.log(`[INFO] Socket.io enabled with Redis Adapter`);
    });
  } catch (err) {
    console.error("[CRITICAL] Failed to start server:", err);
    process.exit(1);
  }
};

startServer();

// --- GRACEFUL SHUTDOWN ---
const handleShutdown = async (signal: string) => {
  console.log(`\n[INFO] Received ${signal}. Initiating graceful shutdown...`);

  setTimeout(() => {
    console.error('[ERROR] Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000).unref();

  try {
    httpServer.close();

    CoordinationService.stopFlushWorker();
    await CoordinationService.flushDirtyLobbies();

    // Close Redis connections
    await closeRedisDataClient();
    await closeRedisAdapterClients();

    const mongoose = await import("mongoose");
    await mongoose.connection.close();

    console.log(`[INFO] Shutdown complete.`);
    process.exit(0);
  } catch (err) {
    console.error(`[ERROR] Error during graceful shutdown:`, err);
    process.exit(1);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
