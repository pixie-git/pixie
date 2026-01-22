import { Request, Response } from "express"
import { UserService } from "../services/UserService.js"

export class LoginController {
	static async login(req: Request, res: Response): Promise<void> {
		try {
			const { username } = req.body

			if (!username || username.trim().length === 0) {
				res.status(400).json({ error: "Username is required" })
				return
			}

			const result = await UserService.login(username)
			res.status(200).json(result)
		} catch (error) {
			console.error("Login error:", error)
			res.status(500).json({ error: "Internal Server Error" })
		}
	}
}
