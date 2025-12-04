import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;

    // Fetch user's uploaded tracks
    const tracks = await prisma.track.findMany({
      where: {
        isUserUpload: true,
        uploadedBy: userId,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      select: {
        id: true,
        songName: true,
        artist: true,
        filePath: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Fetch uploads error:', error);
    return NextResponse.json({ error: 'Failed to fetch uploads' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get('id');

    if (!trackId) {
      return NextResponse.json({ error: 'Track ID required' }, { status: 400 });
    }

    // Verify ownership
    const track = await prisma.track.findFirst({
      where: {
        id: parseInt(trackId),
        uploadedBy: userId,
        isUserUpload: true,
      },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found or unauthorized' }, { status: 404 });
    }

    // Delete file
    try {
      const { unlink } = await import('fs/promises');
      const { join } = await import('path');
      const filepath = join(process.cwd(), 'public', track.filePath);
      await unlink(filepath);
    } catch (error) {
      console.error('Failed to delete file:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.track.delete({
      where: { id: parseInt(trackId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete upload error:', error);
    return NextResponse.json({ error: 'Failed to delete upload' }, { status: 500 });
  }
}
