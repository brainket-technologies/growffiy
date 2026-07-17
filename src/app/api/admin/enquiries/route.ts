import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const [dbEnquiries, totalCount] = await Promise.all([
      prisma.enquiry.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: skip,
      }),
      prisma.enquiry.count(),
    ]);

    const enquiries = dbEnquiries.map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      enquiry: item.enquiry,
      message: item.message || '',
      time: new Date(item.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    }));

    return NextResponse.json({ 
      success: true, 
      enquiries,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      enquiries: [], 
      pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } 
    });
  }
}
