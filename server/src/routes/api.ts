import express, { Router } from "express"
import { LoginController } from "../controllers/LoginController"
import { UserController } from "../controllers/UserController"
import { LobbyController } from "../controllers/lobby.controller"

const router: Router = express.Router()

// Auth
router.post("/login", LoginController.login)

// Users
router.get("/users", UserController.getAll)

// Lobbies
router.post("/lobbies", LobbyController.create)
router.get("/lobbies", LobbyController.getAll)

export default router
