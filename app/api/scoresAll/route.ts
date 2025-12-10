import { PrismaClient } from "@/app/generated/prisma";
import { verifyToken } from "@/lib/jwt";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient

export async function GET(req: NextRequest) {
    try {
        {/*const token = req.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }*/}

        const {searchParams} = new URL(req.url)
        const trackId = searchParams.get('trackId');
        const instrument = searchParams.get('instrument')

        const where: any = {instrument}
        if (trackId) {
            where.trackId = parseInt(trackId);
        }

        const scores = await prisma.score.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            },
            orderBy: {
                value: 'desc'
            }
        })

        return NextResponse.json({scores}, {status: 200})
    }
    catch (error) {
        console.error('Error fetching scores:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}