import { PrismaClient } from './app/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
	const email = 'admin@admin.com';
	const username = 'admin';
	const plainPassword = 'adminadmin';
	const password = await bcrypt.hash(plainPassword, 10);

	await prisma.user.upsert({
		where: { email },
		update: {},
		create: { username, email, password },
	});

	console.log('Seeded admin user:', { email, username });

	// Seed tracks from songs.json
	const tracks = [
		{ id: 1, songName: 'Feel Good Inc.', artist: 'Gorillaz', filePath: '/songs/Gorillaz-Feel Good Inc.-09-23-2025.gp', isUserUpload: false },
		{ id: 2, songName: 'Hysteria', artist: 'Muse', filePath: '/songs/Muse-Hysteria-09-20-2025.gp', isUserUpload: false },
		{ id: 3, songName: 'Aeroplane', artist: 'Red Hot Chili Peppers', filePath: '/songs/Red Hot Chili Peppers-Aeroplane-09-11-2025.gp', isUserUpload: false },
		{ id: 4, songName: 'SICKO MODE', artist: 'Travis Scott', filePath: '/songs/Travis Scott-Sicko Mode-12-11-2024.gp', isUserUpload: false },
		{ id: 5, songName: 'OG Lobby Theme', artist: 'Fortnite', filePath: '/songs/Fortnite-OG Lobby Theme-12-07-2024.gp', isUserUpload: false },
		{ id: 6, songName: 'Rockstar', artist: 'DaBaby feat. Roddy Ricch', filePath: '/songs/DaBaby feat. Roddy Ricch-Rockstar-08-01-2025.gp', isUserUpload: false },
	];

	for (const track of tracks) {
		await prisma.track.upsert({
			where: { id: track.id },
			update: { songName: track.songName, artist: track.artist, filePath: track.filePath, isUserUpload: track.isUserUpload },
			create: track,
		});
	}

	console.log('Seeded tracks:', tracks.length);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});