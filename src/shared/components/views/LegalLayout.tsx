'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from './Footer';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const load = () => {
      setBrandLogo(localStorage.getItem('growffiy_brand_logo') || '');
      setBrandName(localStorage.getItem('growffiy_brand_name') || 'Growffiy');
    };
    load();
    window.addEventListener('branding-updated', load);
    return () => window.removeEventListener('branding-updated', load);
  }, []);

  return (
    <div data-theme="light" style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* Navbar - matches home page exactly */}
      <nav style={{
        position: 'sticky', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(226,232,240,0.8)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        transition: 'all 0.35s ease',
      }}>
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="navbar-logo-icon">
              <img src={brandLogo || '/logo.png'} alt={brandName} style={{ width: 20, height: 20, objectFit: 'contain' }} />
            </div>
            {brandName.toUpperCase()}
          </Link>

          <div className="navbar-nav">
            <Link href="/" className="nav-link nav-link-dark">Home</Link>
            <Link href="/vendor/privacy" className="nav-link nav-link-dark">Privacy</Link>
            <Link href="/vendor/terms" className="nav-link nav-link-dark">Terms</Link>
            <Link href="/vendor/refund" className="nav-link nav-link-dark">Refund</Link>
            <Link href="/vendor/disclaimer" className="nav-link nav-link-dark">Disclaimer</Link>
            <Link href="/vendor/login" target="_blank" className="btn-nav">Get Started →</Link>
          </div>

          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                : <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>
              }
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-nav">
            <Link href="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/vendor/privacy" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Privacy Policy</Link>
            <Link href="/vendor/terms" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Terms & Conditions</Link>
            <Link href="/vendor/refund" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Refund Policy</Link>
            <Link href="/vendor/disclaimer" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Risk Disclaimer</Link>
            <Link href="/vendor/login" target="_blank" className="mobile-nav-cta" onClick={() => setMobileMenuOpen(false)}>Get Started →</Link>
          </div>
        )}
      </nav>

      {/* Content */}
      <div style={{
        maxWidth: 800, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px',
      }}>
        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, color: '#1e293b',
            fontFamily: "'Inter', sans-serif", letterSpacing: '-0.5px',
            marginBottom: 8,
          }}>
            {title}
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
            Last Updated: {lastUpdated}
          </p>
        </div>

        {/* Card body */}
        <div style={{
          background: '#ffffff',
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
          background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(18,82,171,0.1))',
          fontSize: 12, fontWeight: 800, color: '#1E88FF',
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
