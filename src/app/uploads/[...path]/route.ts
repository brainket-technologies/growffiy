import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Force dynamic execution so Next.js handles all runtime file requests
export const dynamic = 'force-dynamic';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams?.path || [];

    if (!pathSegments.length) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }

    // Security check: prevent directory traversal
    for (const segment of pathSegments) {
      if (segment === '..' || segment.includes('/') || segment.includes('\\')) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
      }
    }

    // Possible base locations where files might reside
    const candidates = [
      path.join(process.cwd(), 'public', 'uploads', ...pathSegments),
      path.join('/var/www/growffiy', 'public', 'uploads', ...pathSegments),
      path.join(process.cwd(), 'uploads', ...pathSegments),
    ];

    let targetPath: string | null = null;
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          targetPath = candidate;
          break;
        }
      } catch {
        // Continue checking
      }
    }

    if (!targetPath) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(targetPath);
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Content-Disposition': 'inline',
      },
    });
  } catch (error: any) {
    console.error('Error serving uploaded file:', error);
    return NextResponse.json(
      { error: 'Failed to read uploaded file' },
      { status: 500 }
    );
  }
}
