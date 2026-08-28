import { NextResponse } from 'next/server';
import { algoEngine } from '../../../shared/models/algoEngine';

export async function GET() {
  await algoEngine.init();
  return NextResponse.json({ status: 'started' });
}
