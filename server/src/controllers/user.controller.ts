import { Request, Response, NextFunction } from "express"
import { UserService } from "../services/user.service.js"

export class UserController {
	static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const users = await UserService.getAllUsers()
			res.json(users)
		} catch (err) {
			// @ts-ignore
			next(err)
		}
	}
}
