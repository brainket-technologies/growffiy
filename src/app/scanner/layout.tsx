import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live NSE Stock Scanner & Breakout Screener',
  description: 'Real-time live market scanner for Indian stocks, Nifty 50, and Bank Nifty. Identify instant volume breakout, momentum, and intraday trade opportunities.',
  keywords: [
    'nse stock scanner',
    'breakout stock screener india',
    'intraday scanner live',
    'nifty volume scanner',
    'live market scanner'
  ],
  alternates: {
    canonical: 'https://growffi.com/scanner',
  },
    openGraph: {
    title: 'Live NSE Stock Scanner & Breakout Screener - Growffi',
    description: 'Real-time NSE stock breakout screener and intraday market scanner for Indian stock traders.',
    url: 'https://growffi.com/scanner',
    images: [
      {
        url: 'https://growffi.com/og-image.jpg',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'Live NSE Stock Scanner - Growffi',
      },
    ],
  },
};

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
