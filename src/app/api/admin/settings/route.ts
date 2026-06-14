import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

export async function GET() {
  try {
    const dbSettings = await prisma.appSettings.findMany();
    const settings: Record<string, string> = {};
    
    // Set defaults
    settings['razorpay_test_key_id'] = '';
    settings['razorpay_test_key_secret'] = '';
    settings['razorpay_live_key_id'] = '';
    settings['razorpay_live_key_secret'] = '';
    settings['razorpay_mode'] = 'test';
    settings['smtp_host'] = '';
    settings['smtp_port'] = '587';
    settings['smtp_user'] = '';
    settings['smtp_password'] = '';
    settings['smtp_sender_name'] = 'Growffiy';
    settings['smtp_encryption'] = 'tls'; // ssl, tls, none
    settings['smtp_status'] = 'false'; // 'true' (on) or 'false' (off)
    settings['default_risk'] = '1.00';
    settings['slippage'] = '0.10';
    settings['support_email'] = 'support@growffiy.com';
    settings['support_phone'] = '+91 98765 43210';
    settings['support_timings'] = 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)';


    dbSettings.forEach((s) => {
      settings[s.settingKey] = s.settingValue;
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ 
      success: true, 
      settings: {
        razorpay_test_key_id: '',
        razorpay_test_key_secret: '',
        razorpay_live_key_id: '',
        razorpay_live_key_secret: '',
        razorpay_mode: 'test',
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: '',
        smtp_sender_name: 'Growffiy',
        smtp_encryption: 'tls',
        smtp_status: 'false',
        default_risk: '1.00',
        slippage: '0.10',
        support_email: 'support@growffiy.com',
        support_phone: '+91 98765 43210',
        support_timings: 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)'
      } 
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      razorpay_test_key_id, 
      razorpay_test_key_secret, 
      razorpay_live_key_id, 
      razorpay_live_key_secret, 
      razorpay_mode,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      smtp_sender_name,
      smtp_encryption,
      smtp_status,
      default_risk, 
      slippage,
      support_email,
      support_phone,
      support_timings
    } = body;

    const updates = {
      razorpay_test_key_id,
      razorpay_test_key_secret,
      razorpay_live_key_id,
      razorpay_live_key_secret,
      razorpay_mode,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      smtp_sender_name,
      smtp_encryption,
      smtp_status,
      default_risk,
      slippage,
      support_email,
      support_phone,
      support_timings
    };


    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        await prisma.appSettings.upsert({
          where: { settingKey: key },
          update: { settingValue: String(value) },
          create: {
            settingKey: key,
            settingValue: String(value),
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
