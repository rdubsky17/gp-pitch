import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prismaClient';

export async function GET(req: NextRequest) {
  try {
    // Fetch all tracks from database (both library songs and user uploads)
    const tracks = await prisma.track.findMany({
      orderBy: [
        { isUserUpload: 'asc' }, // Library songs first
        { songName: 'asc' }
      ],
      select: {
        id: true,
        songName: true,
        artist: true,
        filePath: true,
        isUserUpload: true,
        uploadedBy: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json({ tracks }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracks' },
      { status: 500 }
    );
  }
}
