import { Request, Response, NextFunction } from "express"
import { UserService } from "../services/user.service.js"
import { AppError } from "../utils/AppError.js"

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

	static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
		try {
			const { id } = req.params
			const { username } = req.body
			const authUser = (req as any).user

			if (!authUser || authUser.id !== id) {
				throw new AppError("Unauthorized", 403)
			}

			if (!username || username.trim().length === 0) {
				throw new AppError("Username is required", 400)
			}

			try {
				const result = await UserService.updateUser(id, username)
				res.json(result)
			} catch (err: any) {
				if (err.message === "Username already taken") {
					throw new AppError("Username already taken", 409)
				}
				throw err
			}
		} catch (err) {
			next(err)
		}
	}
}
