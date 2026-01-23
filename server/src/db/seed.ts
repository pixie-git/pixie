import { User } from "../models/User"
import { Lobby } from "../models/Lobby"
import { Canvas } from "../models/Canvas"
import { CONFIG } from "../config"

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

export const seedLobbies = async (): Promise<void> => {
	try {
		console.log("Checking lobby seeds...")
		const lobbyName = "Default Lobby"
		const existingLobby = await Lobby.findOne({ name: lobbyName })

		if (!existingLobby) {
			console.log(`Creating '${lobbyName}'...`)
			const newLobby = await Lobby.createWithCanvas(lobbyName)

			// Get the canvas to draw some initial pixels
			const canvas = await Canvas.findById(newLobby.canvas)
			if (canvas) {
				// Draw a red diagonal line
				const width = CONFIG.CANVAS.WIDTH
				const height = CONFIG.CANVAS.HEIGHT
				const color = 4 // Assuming 4 is Red in the palette, or just a distinct color

				for (let i = 0; i < Math.min(width, height); i++) {
					const index = i * width + i
					canvas.data[index] = color
				}

				await canvas.save()
				console.log(`Seeded '${lobbyName}' with a diagonal pattern`)
			}
		} else {
			console.log(`'${lobbyName}' already exists`)
		}
	} catch (error) {
		console.error("Lobby seed failed:", error)
	}
}
