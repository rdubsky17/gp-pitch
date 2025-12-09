import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prismaClient';
import { signToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, password, rememberMe } = await request.json();
    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email in the Database using Prisma
    const user = await prisma.user.findUnique({
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

    // If rememberMe is true: 7 days, otherwise: 1 day (session-like)
    const tokenExpiration = rememberMe ? '7d' : '1d';
    const cookieMaxAge = rememberMe 
      ? 60 * 60 * 24 * 7  // 7 days
      : 60 * 60 * 24;      // 1 day

    // Create JWT token with appropriate expiration
    const token = await signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    }, tokenExpiration);

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
      maxAge: cookieMaxAge,
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
