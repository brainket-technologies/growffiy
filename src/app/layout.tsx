import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
