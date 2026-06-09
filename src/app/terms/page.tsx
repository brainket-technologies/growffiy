'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '../../views/components/Card';
import { Button } from '../../views/components/Button';
import { Activity, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#030712', color: '#f3f4f6', fontFamily: 'var(--font-family)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={24} color="#3b82f6" />
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-title)' }}>GROWFFIY</span>
          </div>
          <Link href="/">
            <Button variant="secondary" style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '20px', padding: '6px 16px' }}>
              <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back to Home
            </Button>
          </Link>
        </div>

        {/* Content */}
        <Card style={{ backgroundColor: 'rgba(255, 255, 255, 0.01)', borderColor: 'rgba(255, 255, 255, 0.06)', padding: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginBottom: '20px', fontFamily: 'var(--font-title)' }}>Terms & Conditions</h1>
          <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '24px' }}>Last Updated: June 10, 2026</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px', lineHeight: '1.6', color: '#d1d5db' }}>
            <div>
              <h3 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>1. Trading Risk Disclosure</h3>
              <p>Algorithmic trading involves high financial risks. Growffiy represents a software deployment tool and is not a registered financial advisor (SEBI or otherwise). Past performance metrics are simulated and do not guarantee future profitability. Clients assume full liability for trade outcomes.</p>
            </div>

            <div>
              <h3 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>2. API Integration Agreement</h3>
              <p>By connecting your Zerodha Kite token credentials, you authorize Growffiy to place automated trades on your behalf. Standard broker charges (brokerage, STT, exchange transaction charges) apply directly to your broker ledger.</p>
            </div>

            <div>
              <h3 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>3. Subscription & Payments</h3>
              <p>Subscription fees are billed in advance based on the selected Monthly, Quarterly, or Yearly plans. All payments processed via Razorpay are final and non-refundable unless specified otherwise.</p>
            </div>

            <div>
              <h3 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>4. Service Availability</h3>
              <p>While we strive for 100% execution uptime, Growffiy is not liable for system delays, broker API downtime, internet latency, or order cancellation failures that impact trade execution times.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
