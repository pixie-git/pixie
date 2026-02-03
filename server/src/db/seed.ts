import { User } from "../models/User.js"
import { Lobby, ILobby } from "../models/Lobby.js"
import { Canvas } from "../models/Canvas.js"
import { CONFIG } from "../config.js"

export const seedUsers = async (): Promise<void> => {
	const isProduction = process.env.NODE_ENV === 'production';

	const users = isProduction
		? [{ username: "admin", isAdmin: true }]
		: [
			{ username: "Matteo", isAdmin: true },
			{ username: "Andrea", isAdmin: true },
			{ username: "Guest", isAdmin: false },
			{ username: "Alice", isAdmin: false },
			{ username: "Bob", isAdmin: false },
		];

	try {
		console.log(`Seeding users (Production: ${isProduction})...`)
		for (const u of users) {
			const existing = await User.findOne({ username: u.username })
			if (!existing) {
				await User.create(u)
				console.log(`Created user: ${u.username}`)
			} else {
				console.log(`User already exists: ${u.username}`)
			}
		}
		console.log("Users seeded")
	} catch (error) {
		console.error("Seed failed:", error)
	}
}

export const seedLobbies = async (): Promise<void> => {
	if (process.env.NODE_ENV === 'production') {
		console.log("Skipping lobby seeding in production.");
		return;
	}

	try {
		console.log("Seeding lobbies...")

		// Fetch Users to assign ownership
		const matteo = await User.findOne({ username: "Matteo" })
		const andrea = await User.findOne({ username: "Andrea" })
		const alice = await User.findOne({ username: "Alice" })
		const bob = await User.findOne({ username: "Bob" })

		const lobbyConfigs = [
			// Matteo's Lobbies (Admin)
			{ name: "Matteo's Classic", owner: matteo?._id, width: 64, height: 64 },
			{ name: "Matteo's Grand", owner: matteo?._id, width: 100, height: 100 },

			// Andrea's Lobbies (Admin)
			{ name: "Andrea's Wide", owner: andrea?._id, width: 128, height: 64 },
			{ name: "Andrea's Studio", owner: andrea?._id, width: 64, height: 64 },

			// Alice's Lobbies (User)
			{ name: "Alice's Tall", owner: alice?._id, width: 64, height: 128 },
			{ name: "Alice's Playground", owner: alice?._id, width: 32, height: 32 },

			// Bob's Lobbies (User)
			{ name: "Bob's Tiny", owner: bob?._id, width: 16, height: 16 },
			{ name: "Bob's Workshop", owner: bob?._id, width: 48, height: 48 },

			// Public/Unassigned Lobbies
			{ name: "Public Sandbox", owner: undefined, width: 128, height: 128, palette: "neon" },
			{ name: "Digital Desert", owner: undefined, width: 80, height: 40, palette: "retro" },
		]

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
		}

		for (const config of lobbyConfigs) {
			// Check if lobby already exists
			const existingLobby = await Lobby.findOne({ name: config.name })
			if (existingLobby) {
				console.log(`Lobby already exists: ${config.name}`)
				continue
			}

			// Determine palette
			let palette = PALETTES.default;
			if (config.palette === "neon") palette = PALETTES.neon;
			if (config.palette === "retro") palette = PALETTES.retro;

			const lobby = await Lobby.createWithCanvas(config.name, config.owner?.toString(), {
				width: config.width,
				height: config.height,
				palette: palette
			})
			console.log(`Created lobby: ${config.name}`)

			// Draw something unique on this new canvas
			const canvas = await Canvas.findById(lobby.canvas);
			if (canvas) {
				// Random noise to make it look used
				const count = Math.floor((config.width * config.height) * 0.05); // Fill 5%
				for (let i = 0; i < count; i++) {
					const idx = Math.floor(Math.random() * canvas.data.length);
					const color = Math.floor(Math.random() * 15) + 1; // Random color 1-15
					canvas.data[idx] = color;
				}

				canvas.markModified("data");
				await canvas.save();
			}
		}

		console.log("Lobbies seeded successfully with variation");

	} catch (error) {
		console.error("Lobby seed failed:", error)
	}
}
