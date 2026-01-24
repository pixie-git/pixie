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

		const lobbiesToCreate = [
			"Default Lobby",
			"Neon City",
			"Forest Realm",
			"Desert Oasis",
			"Cyberpunk Alley",
			"Medieval Castle",
			"Underwater World",
			"Space Station",
			"Candy Land",
			"Haunted House"
		];

		for (let i = 1; i <= 10; i++) {
			lobbiesToCreate.push(`Lobby #${i}`);
		}

		for (const lobbyName of lobbiesToCreate) {
			let lobby: ILobby | null = await Lobby.findOne({ name: lobbyName })

			if (!lobby) {
				console.log(`Creating '${lobbyName}'...`)
				lobby = await Lobby.createWithCanvas(lobbyName)

				// Draw something unique on this new canvas so we can see they are different
				const canvas = await Canvas.findById(lobby.canvas);
				if (canvas) {
					// Draw a random colored dot in a random position
					const width = CONFIG.CANVAS.WIDTH;
					const height = CONFIG.CANVAS.HEIGHT;
					const randomColor = Math.floor(Math.random() * 10) + 1;
					const randomX = Math.floor(Math.random() * width);
					const randomY = Math.floor(Math.random() * height);

					const index = randomY * width + randomX;
					canvas.data[index] = randomColor;

					// Draw a small diagonal based on index to differentiate further
					for (let k = 0; k < 10; k++) {
						if (index + k * width + k < canvas.data.length)
							canvas.data[index + k * width + k] = randomColor;
					}

					canvas.markModified("data");
					await canvas.save();
				}
			}
		}
		console.log("Lobbies seeded successfully");

	} catch (error) {
		console.error("Lobby seed failed:", error)
	}
}
