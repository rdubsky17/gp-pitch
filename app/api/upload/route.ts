import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { verifyToken } from '@/lib/jwt';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Debug: Log all cookies
    console.log('All cookies:', req.cookies.getAll());
    
    // Verify authentication
    const token = req.cookies.get('auth-token')?.value;
    console.log('Token value:', token ? 'exists' : 'missing');
    
    if (!token) {
      return NextResponse.json({ error: 'Sign-In Required to Upload Songs' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    console.log('Decoded token:', decoded);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    console.log('User ID:', userId);

    // Check upload limit (max 5 songs per user)
    const uploadCount = await prisma.track.count({
      where: {
        isUserUpload: true,
        uploadedBy: userId,
      },
    });

    if (uploadCount >= 5) {
      return NextResponse.json({ error: 'Upload limit reached. Maximum 5 songs allowed per user.' }, { status: 400 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const songName = formData.get('songName') as string || file.name.replace(/\.[^/.]+$/, '');
    const artist = formData.get('artist') as string || 'Unknown Artist';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.match(/\.(gp|gp3|gp4|gp5|gpx|gtp)$/i)) {
      return NextResponse.json({ error: 'Invalid file type. Only Guitar Pro files are supported.' }, { status: 400 });
    }

    // Validate file size (max 200KB)
    if (file.size > 200 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 200KB.' }, { status: 400 });
    }

    // Create user upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', `user-${userId}`);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedFilename}`;
    const filepath = join(uploadDir, filename);
    const relativeFilePath = `/api/files/user-${userId}/${filename}`;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save to database
    const track = await prisma.track.create({
      data: {
        songName,
        artist,
        filePath: relativeFilePath,
        isUserUpload: true,
        uploadedBy: userId,
      },
    });

    return NextResponse.json({
      success: true,
      track: {
        id: track.id,
        songName: track.songName,
        artist: track.artist,
        filePath: track.filePath,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
