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
		{ id: 1, songName: 'Feel Good Inc.', artist: 'Gorillaz' },
		{ id: 2, songName: 'Hysteria', artist: 'Muse' },
		{ id: 3, songName: 'Aeroplane', artist: 'Red Hot Chili Peppers' },
		{ id: 4, songName: 'SICKO MODE', artist: 'Travis Scott' },
		{ id: 5, songName: 'OG Lobby Theme', artist: 'Fortnite' },
		{ id: 6, songName: 'Rockstar', artist: 'DaBaby feat. Roddy Ricch' },
	];

	for (const track of tracks) {
		await prisma.track.upsert({
			where: { id: track.id },
			update: { songName: track.songName, artist: track.artist },
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