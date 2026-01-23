import { User } from "../models/User.js"
import { Lobby, ILobby } from "../models/Lobby.js"
import { Canvas } from "../models/Canvas.js"
import { CONFIG } from "../config.js"

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
		let lobby: ILobby | null = await Lobby.findOne({ name: lobbyName })

		if (!lobby) {
			console.log(`Creating '${lobbyName}'...`)
			lobby = await Lobby.createWithCanvas(lobbyName)
		} else {
			console.log(`'${lobbyName}' already exists`)
		}

		if (lobby) {
			// Get the canvas to check/draw pixels
			const canvas = await Canvas.findById(lobby.canvas)
			if (canvas) {
				const hasContent = canvas.data.some((pixel) => pixel !== 0)

				if (!hasContent) {
					console.log(`Canvas for '${lobbyName}' is empty. Seeding pattern...`)
					// Draw a red diagonal line
					const width = CONFIG.CANVAS.WIDTH
					const height = CONFIG.CANVAS.HEIGHT
					const color = 4 // Red

					for (let i = 0; i < Math.min(width, height); i++) {
						const index = i * width + i
						canvas.data[index] = color
					}

					canvas.markModified("data")
					await canvas.save()
					console.log(`Seeded '${lobbyName}' with a diagonal pattern`)
				}
			}
		}
	} catch (error) {
		console.error("Lobby seed failed:", error)
	}
}
