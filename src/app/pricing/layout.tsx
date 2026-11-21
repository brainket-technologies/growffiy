import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Algo Trading Pricing & Subscription Plans',
  description: 'Affordable algo trading subscription plans in India. Connect your Zerodha demat account and automate your equity and options trades with high accuracy.',
  keywords: [
    'algo trading pricing',
    'algo trading subscription india',
    'cheap algo trading software',
    'zerodha algo pricing',
    'best algo trading plans'
  ],
  alternates: {
    canonical: 'https://growffi.com/pricing',
  },
  openGraph: {
    title: 'Algo Trading Pricing & Subscription Plans - Growffi',
    description: 'Choose the best algo trading subscription plans in India. Transparent pricing, Zerodha Kite API integration, and powerful strategies.',
    url: 'https://growffi.com/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
