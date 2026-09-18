import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';
import PDFDocument from 'pdfkit';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing or invalid token format' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.id;
    const paymentId = (await params).id;

    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
      include: {
        plan: true,
        user: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Cannot access this payment' },
        { status: 403 }
      );
    }

    // Fetch GST settings
    const gstSetting = await prisma.appSettings.findUnique({
      where: { settingKey: 'gst_percentage' },
    });
    const gstPercentage = gstSetting ? parseFloat(gstSetting.settingValue) : 18;

    const totalPaid = parseFloat(payment.amount.toString());
    const baseAmount = totalPaid / (1 + (gstPercentage / 100));
    const gstAmount = totalPaid - baseAmount;

    return new Promise<Response>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        
        const response = new NextResponse(pdfData, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice_${payment.razorpayOrderId || payment.id}.pdf"`,
            'Content-Length': pdfData.length.toString(),
          },
        });
        resolve(response);
      });

      // --- Build PDF content ---
      doc.fontSize(20).text('INVOICE', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Date: ${payment.paymentDate ? payment.paymentDate.toISOString().split('T')[0] : payment.createdAt.toISOString().split('T')[0]}`);
      doc.text(`Payment ID: ${payment.razorpayPaymentId || 'N/A'}`);
      doc.text(`Order ID: ${payment.razorpayOrderId}`);
      doc.text(`Status: ${payment.status.toUpperCase()}`);
      
      doc.moveDown();
      doc.fontSize(14).text('Customer Details', { underline: true });
      doc.fontSize(12).text(`Name: ${payment.user.name}`);
      doc.text(`Email: ${payment.user.email}`);
      
      doc.moveDown();
      doc.fontSize(14).text('Subscription Details', { underline: true });
      doc.fontSize(12).text(`Plan: ${payment.plan.name}`);
      doc.text(`Duration: ${payment.plan.durationDays} Days`);
      
      doc.moveDown();
      doc.fontSize(14).text('Amount Breakdown', { underline: true });
      doc.fontSize(12).text(`Base Amount: Rs. ${baseAmount.toFixed(2)}`);
      doc.text(`GST (${gstPercentage}%): Rs. ${gstAmount.toFixed(2)}`);
      
      doc.moveDown();
      doc.fontSize(16).text(`Total Paid: Rs. ${totalPaid.toFixed(2)}`, { stroke: true });

      doc.moveDown(2);
      doc.fontSize(10).text('Thank you for subscribing to Growffi!', { align: 'center' });

      doc.end();
    });

  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
