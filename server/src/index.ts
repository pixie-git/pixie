import cors from "cors"
import express, { Express } from "express"
import { connectDB } from "./db/connect"
import router from "./routes/index"

const app: Express = express()
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

// API Routes
app.use("/api", router)

// Start Server
app.listen(PORT, () => {
	console.log(`[INFO] Server listening on port ${PORT}`)
})
