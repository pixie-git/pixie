import express, { Router } from "express"
import { LoginController } from "../controllers/login.controller.js"
import { UserController } from "../controllers/user.controller.js"
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
// Notifications
router.get("/notifications/stream", authenticateToken, NotificationController.stream)
router.get("/notifications", authenticateToken, NotificationController.getHistory)
router.put("/notifications/:id/read", authenticateToken, NotificationController.markAsRead)
router.put("/notifications/read-all", authenticateToken, NotificationController.markAllAsRead)

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
