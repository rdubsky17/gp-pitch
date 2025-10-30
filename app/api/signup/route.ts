import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prismaClient';

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    // check if this email exists in db
    const existing_email = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing_email) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // check if this username exists in db (username is not unique in schema)
    const existing_username = await prisma.users.findFirst({
      where: { username },
      select: { id: true },
    });
  
    if (existing_username){
      return NextResponse.json(
        { error: 'Username already registered' },
        { status: 409 }
      );
    }

    // email and username are not in db
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.users.create({
        data: {email: email, username: username, password: hashedPassword},
		select: {id: true, username: true, email: true}
	});

    // Success. return user data (without password)
    return NextResponse.json(
      {
        message: 'User created successful',
        user: newUser
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
