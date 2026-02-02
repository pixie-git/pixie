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

interface UpdateUserResponse {
	username: string
	token: string
}

interface AllUsersResponse {
	username: string
	isAdmin: boolean
	_id?: string
}

export class UserService {
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

	static async getAllUsers(): Promise<AllUsersResponse[]> {
		const users = await User.find({}, "username isAdmin")
		return users.map((user) => ({
			username: user.username,
			isAdmin: user.isAdmin,
			_id: user._id?.toString(),
		}))
	}

	static async updateUser(userId: string, newUsername: string): Promise<UpdateUserResponse> {
		const JWT_SECRET = CONFIG.JWT.SECRET

		const existing = await User.findOne({ username: newUsername })
		if (existing && existing._id.toString() !== userId) {
			throw new Error("Username already taken")
		}

		const user = await User.findByIdAndUpdate(userId, { username: newUsername }, { new: true })
		if (!user) {
			throw new Error("User not found")
		}

		const token = jwt.sign({ id: user._id, username: user.username, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: CONFIG.JWT.EXPIRES_IN as any })

		return {
			username: user.username,
			token
		}
	}
}

