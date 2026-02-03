import jwt from "jsonwebtoken"
import { User } from "../models/User.js"
import { CONFIG } from "../config.js"

interface LoginResponse {
	username: string
	id: string
	token: string
	isNewUser: boolean
	isAdmin: boolean
}

interface AllUsersResponse {
	username: string
	isAdmin: boolean
	_id?: string
}

export class UserService {
	/**
	 * Handle user login/registration and token generation
	 */
	static async login(username: string): Promise<LoginResponse> {
		const JWT_SECRET = CONFIG.JWT.SECRET

		let user = await User.findOne({ username })
		let isNewUser = false

		if (!user) {
			user = await User.create({ username })
			isNewUser = true
		}

		const token = jwt.sign({ id: user._id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: CONFIG.JWT.EXPIRES_IN as any })

		return {
			username: user.username,
			id: user._id.toString(),
			token: token,
			isNewUser: isNewUser,
			isAdmin: user.isAdmin,
		}
	}

	/**
	 * Retrieve all users with limited fields
	 */
	static async getAllUsers(): Promise<AllUsersResponse[]> {
		const users = await User.find({}, "username isAdmin")
		return users.map((user) => ({
			username: user.username,
			isAdmin: user.isAdmin,
			_id: user._id?.toString(),
		}))
	}
}
