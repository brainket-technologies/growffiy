import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

let inMemoryAuditLogs: any[] = [];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const [dbLogs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        include: { admin: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      }),
      prisma.auditLog.count(),
    ]);

    const mappedLogs = dbLogs.map(log => ({
      action: log.action,
      user: log.admin?.name || 'Administrator',
      details: log.newValue || `Action performed: ${log.action}`,
      time: new Date(log.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      type: log.action.toLowerCase().includes('login') ? 'security' : 'action',
    }));

    return NextResponse.json({ 
      success: true, 
      auditLogs: mappedLogs,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: true, 
      auditLogs: [], 
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } 
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, user, details, type } = body;
    
    const timeStr = new Date().toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newLog = {
      action,
      user: user || 'Firoz Mohammad',
      details,
      time: timeStr,
      type: type || 'action'
    };

    inMemoryAuditLogs.unshift(newLog);

    try {
      let admin = await prisma.user.findFirst({ where: { role: 'admin' } });
      if (!admin) {
        admin = await prisma.user.create({
          data: {
            name: 'Firoz Mohammad',
            email: 'admin@growffiy.com',
            userId: 'admin',
            password: 'admin_secure_password_123',
            role: 'admin'
          }
        });
      }
      if (admin) {
        await prisma.auditLog.create({
          data: {
            adminId: admin.id,
            action,
            newValue: details,
          }
        });
      }
    } catch (dbErr) {
      // Ignore DB errors in demo mode
    }

    return NextResponse.json({ success: true, log: newLog });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.auditLog.deleteMany({});
  } catch (error) {
    // Ignore DB errors
  }
  inMemoryAuditLogs = [];
  return NextResponse.json({ success: true });
}
