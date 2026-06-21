'use client';

import React from 'react';
import LegalLayout, { LegalSection } from '../../../shared/components/views/LegalLayout';

export default function Disclaimer() {
  return (
    <LegalLayout title="Risk Disclaimer" lastUpdated="June 10, 2026">
      <div style={{
        background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))',
        border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 32,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
        <p style={{ fontSize: 14, color: '#dc2626', fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
          Trading in financial instruments involves substantial risk of loss and is not suitable for all investors.
          Please read this disclaimer carefully before using Growffiy.
        </p>
      </div>

      <LegalSection number="1" title="Not a Financial Advisor">
        <p>
          Growffiy is <strong style={{ color: '#0f172a' }}>NOT a SEBI registered investment advisor, broker,
          sub-broker, portfolio manager, or research analyst</strong>. The platform is a software utility designed
          to execute pre-configured algorithmic strategies via the Zerodha Kite Connect API.
        </p>
      </LegalSection>

      <LegalSection number="2" title="No Guaranteed Returns">
        <p>
          All strategy performance data, win rates, and profit/loss statistics displayed on this platform are
          based on historical simulations or past trading data. Past performance is <strong style={{ color: '#0f172a' }}>
          NOT indicative of future results</strong>. There is no guarantee of profit.
        </p>
      </LegalSection>

      <LegalSection number="3" title="Market Risk">
        <p>
          Equity, derivatives, and currency markets are subject to extreme volatility. Algorithmic strategies
          may underperform or generate significant losses during periods of high volatility, black swan events,
          circuit breakers, or unexpected market conditions.
        </p>
      </LegalSection>

      <LegalSection number="4" title="User Responsibility">
        <p>
          Users are solely responsible for their trading decisions, risk parameters, capital allocation, and trade
          outcomes. By using Growffiy, you acknowledge that you fully understand the risks associated with
          algorithmic trading in Indian financial markets.
        </p>
      </LegalSection>

      <LegalSection number="5" title="Technical Risk">
        <p>
          System failures, network outages, API downtime, or software bugs may result in missed trades, duplicate
          orders, or unintended positions. Growffiy shall not be held liable for any losses arising from such
          technical failures.
        </p>
      </LegalSection>

      <LegalSection number="6" title="Seek Professional Advice">
        <p>
          Before deploying any trading strategy with real capital, we strongly recommend consulting a SEBI-registered
          financial advisor or investment consultant who can evaluate your specific financial situation and risk tolerance.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
