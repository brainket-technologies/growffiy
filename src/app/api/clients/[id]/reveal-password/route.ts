export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import { decryptText } from '../../../../../shared/utils/crypto';

// GET /api/clients/[id]/reveal-password
// Admin-only endpoint to securely reveal the decrypted login password of a client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    if (!client.user?.password) {
      return NextResponse.json({ success: true, password: '' });
    }

    let decryptedPassword = '';
    const raw = client.user.password;

    if (raw.startsWith('aes:')) {
      // AES encrypted
      try {
        decryptedPassword = decryptText(raw);
      } catch {
        return NextResponse.json({ success: false, error: 'Failed to decrypt password' }, { status: 500 });
      }
    } else if (raw.startsWith('$2b$') || raw.startsWith('$2a$')) {
      // bcrypt hashed — cannot be reversed
      return NextResponse.json({ success: false, error: 'Password is bcrypt hashed and cannot be revealed' }, { status: 400 });
    } else {
      // Plain text (old records)
      decryptedPassword = raw;
    }

    return NextResponse.json({ success: true, password: decryptedPassword });
  } catch (err: any) {
    console.error('reveal-password error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
