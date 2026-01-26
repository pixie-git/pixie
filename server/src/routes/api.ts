import express, { Router } from "express"
import { LoginController } from "../controllers/LoginController.js"
import { UserController } from "../controllers/UserController.js"
import { authenticateToken } from "../middlewares/authMiddleware.js"
import { LobbyController } from "../controllers/lobby.controller.js"

const router: Router = express.Router()

// Auth
router.post("/login", LoginController.login)

// Users
router.get("/users", authenticateToken, UserController.getAll)

// Test Error

// Lobbies
router.post("/lobbies", authenticateToken, LobbyController.create)
router.get("/lobbies", authenticateToken, LobbyController.getAll)
router.get("/lobbies/:id", authenticateToken, LobbyController.getById)
router.get("/lobbies/:id/users", authenticateToken, LobbyController.getUsers)

export default router
