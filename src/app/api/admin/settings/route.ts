import { NextResponse } from 'next/server';
import { prisma } from '../../../../database/db';

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
    settings['support_email'] = 'support@growffiy.com';
    settings['support_phone'] = '+91 98765 43210';
    settings['support_timings'] = 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)';
    settings['algo_preopen_fetch_time'] = '09:08';
    settings['algo_token_refresh_time'] = '08:00';
    settings['auto_trade_enabled'] = 'true';
    settings['trading_days'] = '["Mon","Tue","Wed","Thu","Fri"]';
    settings['special_market_days'] = '[]';
    settings['market_holidays'] = '[]';
    settings['app_name'] = 'Growffiy';
    settings['app_title'] = 'Growffiy — Algo Trading Terminal';
    settings['app_favicon'] = '';
    settings['app_logo'] = '';
    settings['meta_description'] = '';
    settings['meta_keywords'] = '';
    settings['footer_text'] = '';
    settings['google_analytics_id'] = '';


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
        support_email: 'support@growffiy.com',
        support_phone: '+91 98765 43210',
        support_timings: 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)',
        algo_preopen_fetch_time: '09:08',
        algo_token_refresh_time: '08:00',
        auto_trade_enabled: 'true',
        trading_days: '["Mon","Tue","Wed","Thu","Fri"]',
        special_market_days: '[]',
        market_holidays: '[]',
        app_name: 'Growffiy',
        app_title: 'Growffiy — Algo Trading Terminal',
        app_favicon: '',
        app_logo: '',
        meta_description: '',
        meta_keywords: '',
        footer_text: '',
        google_analytics_id: ''
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
      support_email,
      support_phone,
      support_timings,
      algo_preopen_fetch_time,
      algo_token_refresh_time,
      app_name,
      app_title,
      app_favicon,
      app_logo,
      meta_description,
      meta_keywords,
      footer_text,
      google_analytics_id
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
      support_email,
      support_phone,
      support_timings,
      algo_preopen_fetch_time,
      algo_token_refresh_time,
      auto_trade_enabled: body.auto_trade_enabled,
      trading_days: body.trading_days,
      special_market_days: body.special_market_days,
      market_holidays: body.market_holidays,
      app_name,
      app_title,
      app_favicon,
      app_logo,
      meta_description,
      meta_keywords,
      footer_text,
      google_analytics_id
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
