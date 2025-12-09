import { NextResponse } from 'next/server'; 
import prisma from '@/lib/prismaClient';
import { signToken } from '@/lib/jwt';
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // look up user in db
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, email: true },
    });

    // if user not found return
    if (!user) {
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    const resetToken = await signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      type: 'password-reset', // distinguish from auth tokens
    }, '1h');

    // need to put app url in env but for now we use localhost
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetPasswordLink = `${baseUrl}/reset-password?token=${resetToken}`;   
    
    // Send email to the User using nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>Hello ${user.username},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetPasswordLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { 
        message: 'If an account with that email exists, a password reset link has been sent.',
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}