import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';

export async function GET() {
  try {
    // Fetch relevant settings keys
    const keysToFetch = [
      'app_version_android',
      'app_build_android',
      'app_playstore_url',
      'app_version_ios',
      'app_build_ios',
      'app_appstore_url',
      'maintenance_mode',
      'maintenance_message'
    ];

    const settings = await prisma.appSettings.findMany({
      where: { settingKey: { in: keysToFetch } },
    });

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.settingKey] = setting.settingValue;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      success: true,
      data: {
        maintenance: {
          isUnderMaintenance: settingsMap['maintenance_mode'] === 'true',
          message: settingsMap['maintenance_message'] || 'We are currently under maintenance. Please check back later.',
        },
        android: {
          version: settingsMap['app_version_android'] || '1.0.0',
          buildNumber: parseInt(settingsMap['app_build_android'] || '1', 10),
          updateUrl: settingsMap['app_playstore_url'] || '',
        },
        ios: {
          version: settingsMap['app_version_ios'] || '1.0.0',
          buildNumber: parseInt(settingsMap['app_build_ios'] || '1', 10),
          updateUrl: settingsMap['app_appstore_url'] || '',
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('App Version Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch app version' },
      { status: 500 }
    );
  }
}

