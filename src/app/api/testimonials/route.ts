import { NextResponse } from 'next/server';
import { prisma } from '../../../database/db';

// GET /api/testimonials - Public API to fetch active testimonials for landing page
export async function GET() {
  try {
    let testimonials = await prisma.testimonial.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    // If database has 0 testimonials, seed default 5 testimonials into DB automatically!
    if (testimonials.length === 0) {
      const defaultReviews = [
        {
          name: 'Rajesh Verma',
          role: 'Intraday Trader',
          location: 'Delhi',
          avatar: '/testimonials/avatar-3.jpg',
          rating: 5,
          stat: '+38.4% PnL',
          text: 'Growffiy has completely transformed my trading discipline. The pre-open momentum strategy connects directly with my Zerodha Kite API and executes breakout trades in milliseconds without emotional bias.',
          status: 'active'
        },
        {
          name: 'Ananya Deshmukh',
          role: 'F&O System Trader',
          location: 'Mumbai',
          avatar: '/testimonials/avatar-1.jpg',
          rating: 5,
          stat: 'Zero Slippage',
          text: 'The automated stop-loss and 1% risk management engine is top-notch. I used to miss target exits while working, but Growffiy manages position sizing and square-off automatically at 3:15 PM.',
          status: 'active'
        },
        {
          name: 'Vikram Patel',
          role: 'Full-Time Trader',
          location: 'Ahmedabad',
          avatar: '/testimonials/avatar-5.jpg',
          rating: 5,
          stat: '99.9% Uptime',
          text: 'Operating client accounts with dedicated static proxy IPs was complex before Growffiy. Now everything runs smoothly with live logs, instant order signals, and absolute peace of mind.',
          status: 'active'
        },
        {
          name: 'Saurabh Mehta',
          role: 'Algo Investor',
          location: 'Bangalore',
          avatar: '/testimonials/avatar-4.jpg',
          rating: 5,
          stat: 'Automated SL',
          text: 'The real-time execution speeds and webhooks integration with Kite Connect are phenomenal. My equity momentum portfolio has seen consistent discipline without screen watching.',
          status: 'active'
        },
        {
          name: 'Pooja Agarwal',
          role: 'Swing & Day Trader',
          location: 'Kolkata',
          avatar: '/testimonials/avatar-2.jpg',
          rating: 5,
          stat: 'Sub-Second Speed',
          text: 'The pre-open session scanner identifies high-volume breakout stocks with zero effort. Automated order execution right at 9:15 AM market open gives a major edge!',
          status: 'active'
        },
        {
          name: 'Amit Sharma',
          role: 'Momentum Trader',
          location: 'Jaipur',
          avatar: '/testimonials/avatar-6.jpg',
          rating: 5,
          stat: '+42.1% Return',
          text: 'Automated pre-open entry on momentum breakout stocks saves me hours every morning. Growth in disciplined trading has been remarkable!',
          status: 'active'
        },
        {
          name: 'Neha Gupta',
          role: 'Portfolio Investor',
          location: 'Pune',
          avatar: '/testimonials/avatar-7.jpg',
          rating: 5,
          stat: '100% Automated',
          text: 'The Zerodha Kite API integration works seamlessly. Order placement, stop-loss triggers, and target management are completely hands-free.',
          status: 'active'
        },
        {
          name: 'Priya Joshi',
          role: 'Equity Intraday Trader',
          location: 'Indore',
          avatar: '/testimonials/avatar-8.jpg',
          rating: 5,
          stat: 'Sub-Second Execution',
          text: 'Real-time webhook triggers and instant risk management stop-loss rules give complete confidence during high volatility sessions.',
          status: 'active'
        }
      ];

      await prisma.testimonial.createMany({
        data: defaultReviews,
      });

      testimonials = await prisma.testimonial.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ testimonials });
  } catch (error: any) {
    console.error('Error fetching public testimonials:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch testimonials' }, { status: 500 });
  }
}
