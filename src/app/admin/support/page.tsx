'use client';

import React from 'react';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { LifeBuoy, Mail, Phone, MessageSquare } from 'lucide-react';

export default function SupportPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Help & Support Desk
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Get technical assistance, report brokerage problems, or read Kite API documentation.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {/* Support Options */}
        <Card>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
            <LifeBuoy color="var(--primary)" size={20} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
              Direct Support
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Mail size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: '14px' }}>support@growffiy.com</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Phone size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: '14px' }}>+91 98765 43210</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <MessageSquare size={16} color="var(--text-secondary)" />
              <span style={{ fontSize: '14px' }}>Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)</span>
            </div>
          </div>
        </Card>

        {/* Documentation Links */}
        <Card>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
            Reference Guides
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a
              href="https://kite.trade/docs/connect/v3/"
              target="_blank"
              rel="noreferrer"
              style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'block', fontWeight: 600, fontSize: '13px' }}
            >
              Zerodha Kite API Reference
            </a>
            <a
              href="#"
              style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'block', fontWeight: 600, fontSize: '13px' }}
            >
              System Trouble Guide
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
