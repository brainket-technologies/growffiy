'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft } from 'lucide-react';
import Footer from './Footer';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--surface)',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Header bar */}
      <div style={{
        background: 'var(--bg-white)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 0',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{
          maxWidth: 800, margin: '0 auto', padding: '0 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            textDecoration: 'none',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src="/logo.png" alt="Growffiy" style={{ width: 18, height: 18, objectFit: 'contain' }} />
            </div>
            <span style={{
              fontSize: 16, fontWeight: 800, color: 'var(--text-heading)',
              fontFamily: 'var(--font-title)',
            }}>
              GROWFFIY
            </span>
          </Link>

          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 99,
            background: 'var(--surface)', border: '1px solid var(--border)',
            fontSize: 13, fontWeight: 600, color: 'var(--text-body)',
            textDecoration: 'none', transition: 'all 0.2s',
          }}>
            <ArrowLeft size={14} />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: 800, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px',
      }}>
        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, color: 'var(--text-heading)',
            fontFamily: 'var(--font-title)', letterSpacing: '-0.5px',
            marginBottom: 8,
          }}>
            {title}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', fontWeight: 500 }}>
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Card body */}
        <div style={{
          background: 'var(--bg-white)',
          borderRadius: 20,
          padding: 'clamp(20px, 5vw, 40px) clamp(16px, 5vw, 44px)',
          border: '1px solid #e8edf5',
          boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        }}>
          {children}
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* Reusable section component */
export function LegalSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{
        fontSize: 16, fontWeight: 700, color: 'var(--text-heading)',
        marginBottom: 10, fontFamily: 'var(--font-title)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 26, height: 26, borderRadius: 8,
          background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(99,102,241,0.1))',
          fontSize: 12, fontWeight: 800, color: '#0ea5e9',
          flexShrink: 0,
        }}>
          {number}
        </span>
        {title}
      </h3>
      <div style={{
        fontSize: 14, lineHeight: 1.75, color: 'var(--text-body)',
        paddingLeft: 34,
      }}>
        {children}
      </div>
    </div>
  );
}
