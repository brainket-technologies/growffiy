import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

// GET /api/admin/testimonials - Fetch all testimonials for admin panel
export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ testimonials });
  } catch (error: any) {
    console.error('Error fetching admin testimonials:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch testimonials' }, { status: 500 });
  }
}

// POST /api/admin/testimonials - Create a new testimonial
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, role, location, avatar, rating, stat, text, status } = body;

    if (!name || !text || !role) {
      return NextResponse.json({ error: 'Name, Role, and Text are required fields.' }, { status: 400 });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        role,
        location: location || '',
        avatar: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
        rating: Number(rating) || 5,
        stat: stat || '',
        text,
        status: status || 'active',
      },
    });

    return NextResponse.json({ testimonial, message: 'Testimonial created successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json({ error: error.message || 'Failed to create testimonial' }, { status: 500 });
  }
}
