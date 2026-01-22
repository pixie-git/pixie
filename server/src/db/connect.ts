import mongoose from "mongoose"
import { seedUsers } from "./seed"

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/pixie"

export const connectDB = async (): Promise<void> => {
	try {
		await mongoose.connect(MONGO_URI, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 10000,
		})
		console.log("[INFO] MongoDB Connected successfully")

		// Test la connessione
		await mongoose.connection.db?.admin().ping()
		console.log("[INFO] MongoDB is ready")

		await seedUsers()
	} catch (err) {
		const error = err as Error
		console.error("[ERROR] MongoDB Connection Error:", error.message)
		console.log("[INFO] Retrying connection in 5 seconds...")
		setTimeout(connectDB, 5000)
	}
}
