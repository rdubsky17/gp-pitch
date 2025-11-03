import { PrismaClient } from './app/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
	const email = 'admin@admin.com';
	const username = 'admin';
	const plainPassword = 'adminadmin';
	const password = await bcrypt.hash(plainPassword, 10);

	await prisma.users.upsert({
		where: { email },
		update: {},
		create: { username, email, password },
	});

	console.log('Seeded admin user:', { email, username });
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});