'use client';

import React from 'react';

/**
 * Institutional Financial Trading Background
 * Features:
 * 1. Top-Right: Stock Candlestick Chart pattern (cyan/magenta/blue candles with wicks).
 * 2. Bottom: Multi-layered flowing horizon wave curve in royal navy, electric blue, and sky blue.
 */
export const FinancialPageBackground: React.FC = () => {
  return (
    <>
      <style>{`
        .financial-bg-bottom-waves {
          position: fixed;
          bottom: 0;
          left: var(--sidebar-width, 260px);
          right: 0;
          height: 110px;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (max-width: 1024px) {
          .financial-bg-bottom-waves {
            left: 0 !important;
          }
        }
      `}</style>

      {/* Top-Right Candlestick Chart Watermark */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '420px',
          height: '220px',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
          opacity: 0.95
        }}
      >
        <svg
          viewBox="0 0 420 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Subtle horizontal grid lines */}
          <line x1="20" y1="170" x2="420" y2="170" stroke="rgba(147, 197, 253, 0.25)" strokeDasharray="3 3" />
          <line x1="80" y1="115" x2="420" y2="115" stroke="rgba(147, 197, 253, 0.2)" strokeDasharray="3 3" />
          <line x1="160" y1="60" x2="420" y2="60" stroke="rgba(147, 197, 253, 0.15)" strokeDasharray="3 3" />

          {/* Candle 1: Cyan Bullish */}
          <line x1="50" y1="95" x2="50" y2="175" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="44" y="115" width="12" height="42" rx="2" fill="#38bdf8" fillOpacity="0.75" />

          {/* Candle 2: Magenta Bearish */}
          <line x1="88" y1="120" x2="88" y2="195" stroke="#e879f9" strokeWidth="1.5" />
          <rect x="82" y="135" width="12" height="48" rx="2" fill="#d946ef" fillOpacity="0.75" />

          {/* Candle 3: Royal Blue Bullish */}
          <line x1="126" y1="80" x2="126" y2="165" stroke="#3b82f6" strokeWidth="1.5" />
          <rect x="120" y="95" width="12" height="52" rx="2" fill="#2563eb" fillOpacity="0.8" />

          {/* Candle 4: Cyan Bullish */}
          <line x1="164" y1="65" x2="164" y2="145" stroke="#06b6d4" strokeWidth="1.5" />
          <rect x="158" y="78" width="12" height="48" rx="2" fill="#06b6d4" fillOpacity="0.8" />

          {/* Candle 5: Rose/Magenta Bearish */}
          <line x1="202" y1="85" x2="202" y2="170" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="196" y="100" width="12" height="45" rx="2" fill="#f43f5e" fillOpacity="0.75" />

          {/* Candle 6: Emerald Bullish */}
          <line x1="240" y1="45" x2="240" y2="135" stroke="#10b981" strokeWidth="1.5" />
          <rect x="234" y="58" width="12" height="58" rx="2" fill="#10b981" fillOpacity="0.8" />

          {/* Candle 7: Royal Blue Bullish */}
          <line x1="278" y1="30" x2="278" y2="115" stroke="#1d4ed8" strokeWidth="1.5" />
          <rect x="272" y="42" width="12" height="55" rx="2" fill="#1d4ed8" fillOpacity="0.85" />

          {/* Candle 8: Violet Bearish */}
          <line x1="316" y1="55" x2="316" y2="140" stroke="#a855f7" strokeWidth="1.5" />
          <rect x="310" y="68" width="12" height="48" rx="2" fill="#a855f7" fillOpacity="0.75" />

          {/* Candle 9: Bright Cyan Bullish Peak */}
          <line x1="354" y1="20" x2="354" y2="100" stroke="#0ea5e9" strokeWidth="1.5" />
          <rect x="348" y="30" width="12" height="50" rx="2" fill="#0ea5e9" fillOpacity="0.9" />

          {/* Candle 10: Deep Royal Blue High */}
          <line x1="392" y1="10" x2="392" y2="88" stroke="#2563eb" strokeWidth="1.5" />
          <rect x="386" y="20" width="12" height="46" rx="2" fill="#2563eb" fillOpacity="0.9" />

          {/* Subtle trendline connecting higher lows */}
          <path
            d="M50 115 Q164 78 240 58 T392 20"
            stroke="url(#topCandleGrad)"
            strokeWidth="1.8"
            strokeDasharray="4 4"
            fill="none"
          />

          <defs>
            <linearGradient id="topCandleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom Fluid Wave Horizon Banner */}
      <div aria-hidden="true" className="financial-bg-bottom-waves">
        <svg
          viewBox="0 0 1200 110"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="waveDeepBlue" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0c3374" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#104193" stopOpacity="0.92" />
              <stop offset="75%" stopColor="#1e40af" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="waveMidCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#2563eb" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="waveSkyLight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#60a5fa" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Layer 3: Light sky blue crest */}
          <path
            d="M0,75 C220,100 420,30 680,55 C920,80 1080,25 1200,40 L1200,110 L0,110 Z"
            fill="url(#waveSkyLight)"
          />

          {/* Layer 2: Mid vibrant electric blue */}
          <path
            d="M0,85 C180,60 380,95 620,65 C880,35 1050,65 1200,50 L1200,110 L0,110 Z"
            fill="url(#waveMidCyan)"
          />

          {/* Layer 1: Deep royal navy blue base curve */}
          <path
            d="M0,95 C260,75 500,105 760,75 C980,45 1100,60 1200,65 L1200,110 L0,110 Z"
            fill="url(#waveDeepBlue)"
          />
        </svg>
      </div>
    </>
  );
};
