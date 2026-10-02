import { NextResponse } from 'next/server';
import { prisma } from '@/database/db';
import jwt from 'jsonwebtoken';
import { algoEngine } from '../../../../../shared/models/algoEngine';

const JWT_SECRET = process.env.JWT_SECRET || 'growffi-secret-key-fallback';

export async function GET(request: Request) {
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

    // Get Market Day Status from Settings
    const settings = await prisma.appSettings.findMany({
      where: {
        settingKey: {
          in: ['auto_trade_enabled', 'trading_days', 'market_holidays', 'special_market_days', 'isTradingActive']
        }
      }
    });

    const getSetting = (key: string, defaultVal: string) => {
      const s = settings.find(s => s.settingKey === key);
      return s ? s.settingValue : defaultVal;
    };

    const autoTradeEnabled = getSetting('auto_trade_enabled', 'true') !== 'false';
    const tradingDays = JSON.parse(getSetting('trading_days', '[]'));
    const holidays = JSON.parse(getSetting('market_holidays', '[]'));
    const specialDays = JSON.parse(getSetting('special_market_days', '[]'));
    const isTradingActive = getSetting('isTradingActive', 'false') === 'true';

    // Compute today string in IST (Indian Standard Time)
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });
    
    // en-CA format is YYYY-MM-DD
    const [{ value: year }, , { value: month }, , { value: day }] = formatter.formatToParts(new Date());
    const todayStr = `${year}-${month}-${day}`; 
    const weekday = weekdayFormatter.format(new Date());
    const holidayObj = Array.isArray(holidays) ? holidays.find((h: any) => h.date === todayStr) : null;
    const specialDayObj = Array.isArray(specialDays) ? specialDays.find((s: any) => s.date === todayStr) : null;
    
    const isMarketDay = specialDayObj || (Array.isArray(tradingDays) && tradingDays.includes(weekday));

    let engineStatus = isTradingActive ? 'Online' : 'Offline';

    let marketDayStatus = 'Market Closed';
    if (!autoTradeEnabled) {
      marketDayStatus = 'Auto OFF';
    } else if (holidayObj) {
      marketDayStatus = `${holidayObj.name} (Market Closed)`;
    } else if (specialDayObj) {
      marketDayStatus = `${specialDayObj.name} (Market Open)`;
    } else if (isMarketDay) {
      marketDayStatus = 'Market Day';
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          engineStatus,
          marketDayStatus,
          isTradingActive,
          todayDate: todayStr,
          weekday: weekday
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Engine Status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
