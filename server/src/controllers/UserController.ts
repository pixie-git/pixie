import { Request, Response } from "express"
import { UserService } from "../services/UserService.js"

export class UserController {
	static async getAll(req: Request, res: Response): Promise<void> {
		try {
			const users = await UserService.getAllUsers()
			res.json(users)
		} catch (err) {
			console.error("[ERROR] Fetch users error:", err)
			res.status(500).json({ error: "Server error fetching users" })
		}
	}
}
