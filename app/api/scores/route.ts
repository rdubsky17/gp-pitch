import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { trackId, instrument, value, hits, total } = body;

    // Validate required fields
    if (
      typeof trackId !== 'number' ||
      typeof instrument !== 'string' ||
      typeof value !== 'number' ||
      typeof hits !== 'number' ||
      typeof total !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    // Validate value is a percentage
    if (value < 0 || value > 100) {
      return NextResponse.json(
        { error: 'Score value must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate hits <= total
    if (hits > total || hits < 0 || total < 0) {
      return NextResponse.json(
        { error: 'Invalid hits/total values' },
        { status: 400 }
      );
    }

    // Check if track exists
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    // Create score record
    const score = await prisma.score.create({
      data: {
        userId: payload.userId,
        trackId,
        instrument,
        value,
        hits,
        total,
      },
    });

    return NextResponse.json({ success: true, score }, { status: 201 });
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user scores
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const trackId = searchParams.get('trackId');

    // Build query
    const where: any = { userId: payload.userId };
    if (trackId) {
      where.trackId = parseInt(trackId, 10);
    }

    // Fetch scores
    const scores = await prisma.score.findMany({
      where,
      include: {
        track: {
          select: {
            id: true,
            songName: true,
            artist: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ scores }, { status: 200 });
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
