'use client';

import React from 'react';

/**
 * Institutional Financial Trading Background
 * Features:
 * 1. Top-Right: Stock Candlestick Chart watermark pattern (soft opacity ~0.20 for high visibility of top controls).
 * 2. Bottom: Multi-layered flowing horizon wave curve positioned at the bottom of the page content (scrolls naturally with page height).
 */
export const FinancialPageBackground: React.FC = () => {
  return (
    <>
      <style>{`
        .financial-bg-top-candles {
          position: absolute;
          top: var(--header-height, 70px);
          right: 0;
          width: 380px;
          height: 180px;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          opacity: 0.20;
          transition: opacity 0.2s ease;
        }

        .financial-bg-bottom-waves {
          position: absolute;
          bottom: 0;
          left: var(--sidebar-width, 260px);
          right: 0;
          height: 105px;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        :global([data-theme="dark"]) .financial-bg-top-candles {
          opacity: 0.14;
        }

        :global([data-theme="dark"]) .financial-bg-bottom-waves {
          opacity: 0.55;
        }

        @media (max-width: 1024px) {
          .financial-bg-bottom-waves {
            left: 0 !important;
          }
          .financial-bg-top-candles {
            width: 260px !important;
            height: 130px !important;
          }
        }
      `}</style>

      {/* Top-Right Candlestick Chart Watermark (Soft Opacity, Scrolls with Page) */}
      <div aria-hidden="true" className="financial-bg-top-candles">
        <svg
          viewBox="0 0 380 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Subtle horizontal grid lines */}
          <line x1="20" y1="140" x2="380" y2="140" stroke="#93c5fd" strokeOpacity="0.35" strokeDasharray="3 3" />
          <line x1="80" y1="95" x2="380" y2="95" stroke="#93c5fd" strokeOpacity="0.25" strokeDasharray="3 3" />
          <line x1="160" y1="50" x2="380" y2="50" stroke="#93c5fd" strokeOpacity="0.2" strokeDasharray="3 3" />

          {/* Candle 1: Cyan Bullish */}
          <line x1="40" y1="80" x2="40" y2="150" stroke="#38bdf8" strokeWidth="1.5" />
          <rect x="35" y="98" width="10" height="36" rx="2" fill="#38bdf8" fillOpacity="0.75" />

          {/* Candle 2: Magenta Bearish */}
          <line x1="75" y1="100" x2="75" y2="165" stroke="#e879f9" strokeWidth="1.5" />
          <rect x="70" y="112" width="10" height="42" rx="2" fill="#d946ef" fillOpacity="0.75" />

          {/* Candle 3: Royal Blue Bullish */}
          <line x1="110" y1="65" x2="110" y2="140" stroke="#3b82f6" strokeWidth="1.5" />
          <rect x="105" y="80" width="10" height="45" rx="2" fill="#2563eb" fillOpacity="0.8" />

          {/* Candle 4: Cyan Bullish */}
          <line x1="145" y1="55" x2="145" y2="125" stroke="#06b6d4" strokeWidth="1.5" />
          <rect x="140" y="68" width="10" height="42" rx="2" fill="#06b6d4" fillOpacity="0.8" />

          {/* Candle 5: Rose/Magenta Bearish */}
          <line x1="180" y1="70" x2="180" y2="145" stroke="#f43f5e" strokeWidth="1.5" />
          <rect x="175" y="85" width="10" height="40" rx="2" fill="#f43f5e" fillOpacity="0.75" />

          {/* Candle 6: Emerald Bullish */}
          <line x1="215" y1="40" x2="215" y2="115" stroke="#10b981" strokeWidth="1.5" />
          <rect x="210" y="52" width="10" height="48" rx="2" fill="#10b981" fillOpacity="0.8" />

          {/* Candle 7: Royal Blue Bullish */}
          <line x1="250" y1="25" x2="250" y2="100" stroke="#1d4ed8" strokeWidth="1.5" />
          <rect x="245" y="38" width="10" height="48" rx="2" fill="#1d4ed8" fillOpacity="0.85" />

          {/* Candle 8: Violet Bearish */}
          <line x1="285" y1="48" x2="285" y2="120" stroke="#a855f7" strokeWidth="1.5" />
          <rect x="280" y="60" width="10" height="42" rx="2" fill="#a855f7" fillOpacity="0.75" />

          {/* Candle 9: Bright Cyan Bullish Peak */}
          <line x1="320" y1="18" x2="320" y2="88" stroke="#0ea5e9" strokeWidth="1.5" />
          <rect x="315" y="28" width="10" height="44" rx="2" fill="#0ea5e9" fillOpacity="0.9" />

          {/* Candle 10: Deep Royal Blue High */}
          <line x1="355" y1="10" x2="355" y2="78" stroke="#2563eb" strokeWidth="1.5" />
          <rect x="350" y="18" width="10" height="40" rx="2" fill="#2563eb" fillOpacity="0.9" />

          {/* Subtle trendline */}
          <path
            d="M40 98 Q145 68 215 52 T355 18"
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

      {/* Bottom Fluid Wave Horizon Banner (Scrolls with Page, Sits at True Bottom) */}
      <div aria-hidden="true" className="financial-bg-bottom-waves">
        <svg
          viewBox="0 0 1200 105"
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
            d="M0,70 C220,95 420,25 680,50 C920,75 1080,20 1200,35 L1200,105 L0,105 Z"
            fill="url(#waveSkyLight)"
          />

          {/* Layer 2: Mid vibrant electric blue */}
          <path
            d="M0,80 C180,55 380,90 620,60 C880,30 1050,60 1200,45 L1200,105 L0,105 Z"
            fill="url(#waveMidCyan)"
          />

          {/* Layer 1: Deep royal navy blue base curve */}
          <path
            d="M0,90 C260,70 500,100 760,70 C980,40 1100,55 1200,60 L1200,105 L0,105 Z"
            fill="url(#waveDeepBlue)"
          />
        </svg>
      </div>
    </>
  );
};
