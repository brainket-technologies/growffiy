'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Application runtime error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
    }}>
      <div style={{
        maxWidth: '550px',
        width: '100%',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        padding: '40px 24px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#fef2f2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <AlertTriangle size={28} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '20px' }}>
          An unexpected error occurred while loading this page. You can try refreshing or navigate back.
        </p>

        {error?.message && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#64748b',
            fontFamily: 'monospace',
            marginBottom: '24px',
            wordBreak: 'break-word',
            textAlign: 'left',
          }}>
            <strong>Error:</strong> {error.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={15} /> Go Back
          </button>
          <button
            onClick={() => reset()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} /> Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
