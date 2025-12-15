import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    
    // Support both user uploads and library songs
    // Path can be: ['user-1', 'filename.gp'] or ['songs', 'filename.gp']
    let filePath: string;
    if (path[0] === 'songs') {
      // Library songs stored in public/songs/
      filePath = join(process.cwd(), 'public', 'songs', ...path.slice(1));
    } else {
      // User uploads stored in public/uploads/
      filePath = join(process.cwd(), 'public', 'uploads', ...path);
    }
    
    const file = await readFile(filePath);

    // Set appropriate content type for Guitar Pro files
    const ext = path[path.length - 1].split('.').pop()?.toLowerCase();
    const contentType = ext?.match(/^gp[x345]?$/) ? 'application/octet-stream' : 'application/octet-stream';

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
