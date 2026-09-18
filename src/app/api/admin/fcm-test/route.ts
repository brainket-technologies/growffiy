import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, title, body: notificationBody } = body;

    // Get Firebase Service Account JSON from DB
    const fcmSetting = await prisma.appSettings.findUnique({
      where: { settingKey: 'firebase_service_account' }
    });

    if (!fcmSetting || !fcmSetting.settingValue || fcmSetting.settingValue.trim() === '') {
      return NextResponse.json({ success: false, error: 'Firebase Service Account JSON is not configured in settings.' }, { status: 400 });
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(fcmSetting.settingValue);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid Firebase Service Account JSON format.' }, { status: 400 });
    }

    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const message: admin.messaging.Message = {
      notification: {
        title: title || 'Test Notification',
        body: notificationBody || 'This is a test push notification from Growffiy Admin Panel.',
      },
    };

    if (token) {
      message.token = token;
    } else {
      message.topic = 'all_users'; // fallback topic if token is not provided
    }

    const response = await admin.messaging().send(message);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error('FCM Test Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send notification' }, { status: 500 });
  }
}
