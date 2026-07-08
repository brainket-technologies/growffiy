import { NextResponse } from 'next/server';
import { prisma } from '../../../../../database/db';

export async function GET() {
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { settingKey: 'sheet_stream_status' }
    });
    const active = setting ? setting.settingValue === 'active' : false;
    return NextResponse.json({ success: true, active });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { active } = await request.json();
    const statusVal = active ? 'active' : 'inactive';
    
    await prisma.appSettings.upsert({
      where: { settingKey: 'sheet_stream_status' },
      update: { settingValue: statusVal },
      create: { settingKey: 'sheet_stream_status', settingValue: statusVal }
    });
    
    return NextResponse.json({ success: true, active });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
