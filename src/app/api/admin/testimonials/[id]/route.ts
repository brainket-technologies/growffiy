import { NextResponse } from 'next/server';
import { prisma } from '../../../../../database/db';

// PUT /api/admin/testimonials/[id] - Update testimonial
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, role, location, avatar, rating, stat, text, status } = body;

    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(location !== undefined && { location }),
        ...(avatar !== undefined && { avatar }),
        ...(rating !== undefined && { rating: Number(rating) }),
        ...(stat !== undefined && { stat }),
        ...(text && { text }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ testimonial, message: 'Testimonial updated successfully' });
  } catch (error: any) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ error: error.message || 'Failed to update testimonial' }, { status: 500 });
  }
}

// DELETE /api/admin/testimonials/[id] - Delete testimonial
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.testimonial.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Testimonial deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete testimonial' }, { status: 500 });
  }
}
