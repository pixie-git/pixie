import { User } from "../models/User.js"

export const seedUsers = async (): Promise<void> => {
	const users = [
		{ username: "Matteo", isAdmin: true },
		{ username: "Andrea", isAdmin: true },
		{ username: "Guest", isAdmin: false },
	]

	try {
		console.log("Checking user seeds...")
		for (const u of users) {
			await User.findOneAndUpdate({ username: u.username }, u, {
				upsert: true,
				new: true,
			})
		}
		console.log("Users seeded")
	} catch (error) {
		console.error("Seed failed:", error)
	}
}
