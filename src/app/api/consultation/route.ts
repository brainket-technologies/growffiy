import { NextResponse } from 'next/server';
import { prisma } from '../../../database/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, enquiry, message } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ success: false, error: 'Name, email, and phone are required.' }, { status: 400 });
    }

    // Save to the enquiries table in the database
    try {
      await prisma.enquiry.create({
        data: {
          name,
          email,
          phone,
          enquiry: enquiry || 'Momentum Breakout Strategy',
          message
        }
      });
    } catch (dbErr) {
      console.error('Failed to save enquiry in DB:', dbErr);
    }

    return NextResponse.json({ success: true, message: 'Consultation request submitted successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
