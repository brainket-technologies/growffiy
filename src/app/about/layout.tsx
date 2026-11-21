import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Growffi | Leading Fintech & Algo Trading Innovator',
  description: 'Learn about Growffi Fintech Pvt Ltd, our mission to democratize algorithmic trading in India, and our institutional-grade technology.',
  alternates: {
    canonical: 'https://growffi.com/about',
  },
    openGraph: {
    title: 'About Growffi | Leading Fintech & Algo Trading Innovator',
    description: 'Growffi empowers retail traders and institutions across India with state-of-the-art algorithmic trading tools.',
    url: 'https://growffi.com/about',
    images: [
      {
        url: 'https://growffi.com/og-image.jpg',
        width: 1200,
        height: 630,
        type: 'image/jpeg',
        alt: 'About Growffi',
      },
    ],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
