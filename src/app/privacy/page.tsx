'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '../../views/components/Card';
import { Button } from '../../views/components/Button';
import { Activity, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', marginBottom: '20px', fontFamily: 'var(--font-title)' }}>Privacy Policy</h1>
          <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '24px' }}>Last Updated: June 10, 2026</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px', lineHeight: '1.6', color: '#d1d5db' }}>
            <div>
              <h3 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>1. Data Collection</h3>
              <p>We collect information provided directly by clients during account registration, including name, email address, contact numbers, and Zerodha Kite API keys. We do not store or inspect individual broker passwords or transactional banking details.</p>
            </div>

            <div>
              <h3 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>2. Key Encryption & Security</h3>
              <p>All client credentials (API Key, API Secret, Access Tokens) are encrypted using industry-standard AES-256 protocols before storage inside the database. Authorization keys are stored in memory and flushed immediately upon session timeouts.</p>
            </div>

            <div>
              <h3 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>3. Third-Party API integrations</h3>
              <p>Growffiy maps trades using the Zerodha Kite Connect API. Trade requests are authenticated on client behalf strictly within user-configured parameters. Payments are securely processed via Razorpay API checkout wrappers; no credit card details are stored locally.</p>
            </div>

            <div>
              <h3 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '8px' }}>4. Compliance & Consent</h3>
              <p>Clients maintain absolute control. Trading can be immediately suspended or revoked by client demand. By connecting your broker terminal, you consent to automatic MIS order placement within predefined risk rules.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
