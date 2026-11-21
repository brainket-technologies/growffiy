import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import BrandingProvider from "../shared/components/branding/BrandingProvider";
import PwaRegister from "../shared/components/PwaRegister";
import { prisma } from "@/database/db";

export const viewport: Viewport = {
  themeColor: "#090d16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  let dbSettings: Record<string, string> = {};
  try {
    const rows = await prisma.appSettings.findMany();
    rows.forEach((r) => {
      dbSettings[r.settingKey] = r.settingValue;
    });
  } catch (err) {
    console.error("Error fetching settings for metadata:", err);
  }

  const title =
    dbSettings["app_title"] ||
    "Growffi | Best Algo Trading Platform in India | Automated Stock & Options Trading";
  const desc =
    dbSettings["meta_description"] ||
    "Growffi is India's leading automated algorithmic trading platform. Trade Nifty, Bank Nifty, and equity stocks seamlessly with Zerodha Kite API, custom breakout strategies, and low-latency execution.";
  const keywordsStr =
    dbSettings["meta_keywords"] ||
    "algo trading, algo trading india, trade, algorithmic trading, algorithmic trading india, automated trading platform, best algo trading software india, zerodha algo trading, kite connect algo, nifty algo trading, bank nifty automated trading, stock market algo software, intraday algo trading, options algo trading india, growffi, growffi algo trading, breakout trading strategies, indian stock market automation, algo trading software for retail traders, quantitative trading india";
  const keywords = keywordsStr
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const appName = dbSettings["app_name"] || "Growffi";

  return {
    metadataBase: new URL("https://growffi.com"),
    title: {
      default: title,
      template: `%s | ${appName}`,
    },
    description: desc,
    keywords: keywords,
    authors: [{ name: "Growffi Fintech", url: "https://growffi.com" }],
    creator: "Growffi Fintech Pvt Ltd",
    publisher: "Growffi",
    applicationName: appName,
    category: "Finance",
    manifest: "/manifest.json",
    alternates: {
      canonical: "https://growffi.com",
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: "https://growffi.com",
      siteName: `${appName} Algo Trading`,
      title: title,
      description: desc,
      images: [
        {
          url: "https://growffi.com/hero_mockup.png",
          width: 1200,
          height: 630,
          alt: `${appName} - Best Algo Trading Platform in India`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: desc,
      images: ["https://growffi.com/hero_mockup.png"],
      creator: "@growffi",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: dbSettings["app_favicon"] || "/favicon.ico",
      apple: dbSettings["app_logo"] || "/logo.png",
    },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://growffi.com/#organization",
      "name": "Growffi",
      "url": "https://growffi.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://growffi.com/logo.png",
        "width": 512,
        "height": 512,
      },
      "description":
        "Growffi is India's premier algorithmic and automated stock trading platform connecting with Zerodha Kite.",
      "sameAs": [
        "https://twitter.com/growffi",
        "https://www.linkedin.com/company/growffi",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://growffi.com/#website",
      "url": "https://growffi.com",
      "name": "Growffi Algo Trading",
      "publisher": {
        "@id": "https://growffi.com/#organization",
      },
      "inLanguage": "en-IN",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://growffi.com/#software",
      "name": "Growffi Algo Trading Platform",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web, Android, iOS",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR",
      },
      "description":
        "Advanced automated algo trading software for Indian stock market. Connects seamlessly with Zerodha Kite for Nifty, Bank Nifty and stock breakout trading.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Growffi" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Script
          id="theme-initializer"
          src="/theme.js"
          strategy="afterInteractive"
        />
        <BrandingProvider>
          <PwaRegister />
          {children}
        </BrandingProvider>
      </body>
    </html>
  );
}
