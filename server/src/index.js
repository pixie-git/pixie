import cors from "cors"
import express from "express"
import { connectDB } from "./db/connect.js"
import router from "./routes/index.js"

// Configuration
const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(
	cors({
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
)
app.use(express.json())

// Initialization
connectDB()

// API Routes (All routes are prefixed with /api)
app.use("/api", router)

// Start Server
app.listen(PORT, () => {
	console.log(`[INFO] Server listening on port ${PORT}`)
})
