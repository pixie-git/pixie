import express, { Router } from "express"
import { LoginController } from "../controllers/LoginController"
import { UserController } from "../controllers/UserController"

const router: Router = express.Router()

// Auth
router.post("/login", LoginController.login)

// Users
router.get("/users", UserController.getAll)

export default router
