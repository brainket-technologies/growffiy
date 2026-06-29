import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join(process.cwd(), 'logs', 'runtime.log');

export async function GET(req: Request) {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({ logs: [] });
    }

    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    // Return last 500 lines to avoid massive payloads
    const lastLines = lines.slice(-500);
    return NextResponse.json({ logs: lastLines });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (fs.existsSync(LOG_FILE)) {
      fs.writeFileSync(LOG_FILE, '');
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
