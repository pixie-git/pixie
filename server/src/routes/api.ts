import express, { Router } from "express"
import { LoginController } from "../controllers/LoginController.js"
import { UserController } from "../controllers/UserController.js"
import { authenticateToken } from "../middlewares/authMiddleware.js"

const router: Router = express.Router()

// Auth
router.post("/login", LoginController.login)

// Users
router.get("/users", authenticateToken, UserController.getAll)

// Test Error

export default router
