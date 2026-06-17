import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'NOT_DEFINED';
  const maskedUrl = dbUrl !== 'NOT_DEFINED' 
    ? dbUrl.replace(/:([^:@]+)@/, ':****@') 
    : 'NOT_DEFINED';

  try {
    // Test direct query
    const clientCount = await prisma.client.count();
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful!",
      databaseUrl: maskedUrl,
      clientCount,
      envKeys: Object.keys(process.env).filter(key => key.includes('DB') || key.includes('DATA'))
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: "Database connection failed",
      databaseUrl: maskedUrl,
      error: error.message || String(error),
      stack: error.stack || '',
      envKeys: Object.keys(process.env).filter(key => key.includes('DB') || key.includes('DATA'))
    }, { status: 500 });
  }
}
