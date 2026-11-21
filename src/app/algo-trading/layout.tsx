import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Algo Trading India | Automated Algorithmic Trading Software',
  description: 'Explore automated algo trading in India with Growffi. Seamless Zerodha Kite API integration, zero-emotion execution, Nifty & Bank Nifty breakout strategies.',
  keywords: [
    'algo trading',
    'algo trading india',
    'automated trading platform',
    'best algo trading in india',
    'zerodha algo software',
    'algorithmic trading strategies',
    'nifty automated trading',
    'bank nifty algo trading'
  ],
  alternates: {
    canonical: 'https://growffi.com/algo-trading',
  },
    openGraph: {
    title: 'Algo Trading India | Automated Algorithmic Trading Software - Growffi',
    description: 'Growffi provides advanced algo trading software in India. Connect Zerodha Kite and trade breakouts automatically with high speed and precision.',
    url: 'https://growffi.com/algo-trading',
    images: [
      {
        url: 'https://growffi.com/og-image.jpg',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'Growffi Algo Trading India',
      },
    ],
  },
};

export default function AlgoTradingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
