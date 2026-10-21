'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../../../shared/components/views/Button';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { APP_ROUTES } from '../../../../../core/constants';

export default function PerformanceErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Client performance page error:', error);
  }, [error]);

  return (
    <div style={{
      padding: '60px 24px',
      maxWidth: '650px',
      margin: '40px auto',
      textAlign: 'center',
      backgroundColor: 'var(--bg-card, #ffffff)',
      borderRadius: '16px',
      border: '1px solid var(--border-color, #e2e8f0)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: '#fef2f2',
        color: '#ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px'
      }}>
        <AlertTriangle size={32} />
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-heading, #0f172a)', marginBottom: '8px' }}>
        Unable to Load Client Performance
      </h2>
      <p style={{ fontSize: '13.5px', color: 'var(--text-secondary, #64748b)', lineHeight: '1.6', marginBottom: '20px' }}>
        An unexpected error occurred while preparing this client's performance report. This may happen if trade metrics or client records contain unexpected values.
      </p>

      {error?.message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#475569',
          fontFamily: 'monospace',
          marginBottom: '24px',
          wordBreak: 'break-all',
          textAlign: 'left'
        }}>
          <strong>Details:</strong> {error.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Button
          variant="secondary"
          onClick={() => router.push(APP_ROUTES.ADMIN_CLIENTS)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <ArrowLeft size={16} /> Back to Clients
        </Button>
        <Button
          variant="primary"
          onClick={() => reset()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} /> Retry Loading
        </Button>
      </div>
    </div>
  );
}
