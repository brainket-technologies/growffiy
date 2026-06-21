import type { Metadata } from "next";
import "./globals.css";
import BrandingProvider from "../shared/components/branding/BrandingProvider";

export const metadata: Metadata = {
  title: "Growffiy | Institutional Algo Trading Platform",
  description: "Advanced automated algorithmic trading platform, client portfolio management, and strategy breakout executor connected with Zerodha Kite API.",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('growffiy_theme');if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`
        }} />
      </head>
      <body>
        <BrandingProvider>{children}</BrandingProvider>
      </body>
    </html>
  );
}
