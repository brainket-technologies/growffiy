'use client';

import React, { useState } from 'react';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { Settings, Shield, Server, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('kite_api_secret_key_xxxxxxx');
  const [defaultRisk, setDefaultRisk] = useState('1.00');
  const [slippage, setSlippage] = useState('0.10');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Settings saved successfully!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
          Terminal Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure global execution modes, broker APIs, and auto-risk sizes.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* API Configurations */}
        <Card>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
            <Server color="var(--primary)" size={20} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
              Zerodha Kite Connection
            </h3>
          </div>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Kite API Key
              </label>
              <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Redirect URL callback
              </label>
              <input type="text" readOnly value="https://growffiy.vercel.app/api/auth/callback" />
            </div>
            <Button type="submit">Save Configurations</Button>
          </form>
        </Card>

        {/* Global Auto Risk management */}
        <Card>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
            <Shield color="#10b981" size={20} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-title)' }}>
              Global Risk Manager
            </h3>
          </div>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Default Risk Size per trade (%)
              </label>
              <input type="number" step="0.05" value={defaultRisk} onChange={(e) => setDefaultRisk(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Max Slippage guard tolerance (%)
              </label>
              <input type="number" step="0.01" value={slippage} onChange={(e) => setSlippage(e.target.value)} required />
            </div>
            <Button type="submit">Save Risk Parameters</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
