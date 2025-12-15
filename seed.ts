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

	// Seed tracks - using API file serving paths for consistency with uploads
	const tracks = [
		{ id: 1, songName: 'Feel Good Inc.', artist: 'Gorillaz', filePath: '/api/files/songs/Gorillaz-Feel Good Inc.-09-23-2025.gp', isUserUpload: false },
		{ id: 2, songName: 'Hysteria', artist: 'Muse', filePath: '/api/files/songs/Muse-Hysteria-09-20-2025.gp', isUserUpload: false },
		{ id: 3, songName: 'Aeroplane', artist: 'Red Hot Chili Peppers', filePath: '/api/files/songs/Red Hot Chili Peppers-Aeroplane-09-11-2025.gp', isUserUpload: false },
		{ id: 4, songName: 'I Want You Back', artist: 'Jackson 5', filePath: '/api/files/songs/Jackson 5-I Want You Back-11-19-2025.gp', isUserUpload: false },
		{ id: 5, songName: 'Creep', artist: 'Radiohead', filePath: '/api/files/songs/Radiohead-Creep-12-05-2025.gp', isUserUpload: false },
		{ id: 6, songName: 'Money', artist: 'Pink Floyd', filePath: '/api/files/songs/Pink Floyd-Money-10-26-2025.gp', isUserUpload: false },
		{ id: 7, songName: 'Dark Necessities', artist: 'Red Hot Chili Peppers', filePath: '/api/files/songs/Red Hot Chili Peppers-Dark Necessities-08-25-2025.gp', isUserUpload: false },
		{ id: 8, songName: "Can't Stop", artist: 'Red Hot Chili Peppers', filePath: "/api/files/songs/Red Hot Chili Peppers-Can't Stop-12-10-2025.gp", isUserUpload: false },
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