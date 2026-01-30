import express, { Router } from "express"
import { LoginController } from "../controllers/LoginController.js"
import { UserController } from "../controllers/UserController.js"
import { authenticateToken } from "../middlewares/authMiddleware.js"
import { requireLobbyAccess, requireLobbyOwner } from "../middlewares/permissionMiddleware.js"
import { LobbyController } from "../controllers/lobby.controller.js"
import { NotificationController } from "../controllers/notification.controller.js"

const router: Router = express.Router()

// Auth
router.post("/login", LoginController.login)

// Users
router.get("/users", authenticateToken, UserController.getAll)

// Test Error

// Notifications
router.get("/notifications/stream", authenticateToken, NotificationController.stream)

// Lobbies
router.post("/lobbies", authenticateToken, LobbyController.create)
router.get("/lobbies", authenticateToken, LobbyController.getAll)
router.get("/lobbies/:id", authenticateToken, requireLobbyAccess, LobbyController.getById)
router.get("/lobbies/:id/users", authenticateToken, requireLobbyAccess, LobbyController.getUsers)
router.delete("/lobbies/:id", authenticateToken, requireLobbyOwner, LobbyController.delete)
router.post("/lobbies/:id/kick", authenticateToken, requireLobbyOwner, LobbyController.kickUser)
router.get("/lobbies/:id/image", authenticateToken, requireLobbyAccess, LobbyController.getLobbyImage)
router.post("/lobbies/:id/ban", authenticateToken, requireLobbyOwner, LobbyController.banUser)

export default router
