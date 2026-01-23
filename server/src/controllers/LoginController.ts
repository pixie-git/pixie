import { Request, Response, NextFunction } from "express"
import { UserService } from "../services/UserService.js"
import { AppError } from "../utils/AppError.js"

export class LoginController {
	static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { username } = req.body

			if (!username || username.trim().length === 0) {
				// @ts-ignore
				throw new AppError("Username is required", 400)
			}

			const result = await UserService.login(username)
			res.status(200).json(result)
		} catch (error) {
			// @ts-ignore
			next(error)
		}
	}
}
