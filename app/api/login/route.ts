import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prismaClient';
import { signToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email using Prisma
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, username: true, email: true, password: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = await signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    // Create response with user data
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie with JWT token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
