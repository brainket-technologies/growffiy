'use client';

import React, { useState } from 'react';
import { Card } from '../../views/components/Card';
import { Button } from '../../views/components/Button';
import { Activity } from 'lucide-react';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent, role: 'admin' | 'client') => {
    e.preventDefault();
    if (role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Activity size={28} color="#2563eb" />
        <span style={{ fontSize: '24px', fontWeight: 800, background: 'linear-gradient(to right, #2563eb, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'var(--font-title)' }}>
          GROWFFIY
        </span>
      </div>

      <Card style={{ width: '100%', maxWidth: '400px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', textAlign: 'center', fontFamily: 'var(--font-title)' }}>
          Secure Terminal Login
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginBottom: '24px' }}>
          Enter user credentials to access your trading workspace.
        </p>

        <form onSubmit={(e) => handleLogin(e, 'client')} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>User ID</label>
            <input
              type="text"
              required
              placeholder="e.g. aman_sharma"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <Button type="submit" style={{ width: '100%' }}>
              Sign In as Client
            </Button>
            <Button type="button" variant="secondary" onClick={(e) => handleLogin(e, 'admin')} style={{ width: '100%' }}>
              Sign In as Administrator
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
