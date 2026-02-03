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

		const PALETTES = {
			default: [
				'#FFFFFF', '#000000', '#1D2B53', '#7E2553',
				'#008751', '#AB5236', '#5F574F', '#C2C3C7',
				'#FFF1E8', '#FF004D', '#FFA300', '#FFEC27',
				'#00E436', '#29ADFF', '#83769C', '#FF77A8'
			],
			retro: [
				'#FFFFFF', '#0f380f', '#306230', '#8bac0f', '#9bbc0f',
				'#0f380f', '#306230', '#8bac0f', '#9bbc0f',
				'#0f380f', '#306230', '#8bac0f', '#9bbc0f',
				'#0f380f', '#306230'
			],
			neon: [
				'#FFFFFF', '#000000', '#FF00FF', '#00FFFF',
				'#00FF00', '#FFFF00', '#FF0000', '#7B00FF',
				'#FF1493', '#00CED1', '#32CD32', '#FFD700',
				'#FF4500', '#9400D3', '#1E90FF', '#FF69B4'
			]
		};

		for (const lobbyName of lobbiesToCreate) {
			let lobby: ILobby | null = await Lobby.findOne({ name: lobbyName })

			if (!lobby) {
				console.log(`Creating '${lobbyName}'...`)

				// Determine palette
				let palette = PALETTES.default;
				if (lobbyName.includes("Neon")) palette = PALETTES.neon;
				if (lobbyName.includes("Gameboy") || lobbyName.includes("Retro")) palette = PALETTES.retro;

				lobby = await Lobby.createWithCanvas(lobbyName, undefined, { palette })

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
