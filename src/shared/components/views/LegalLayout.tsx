'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from './Footer';
import { Menu, X, TrendingUp } from 'lucide-react';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
  bannerSrc?: string;
}

interface Stock {
  symbol: string;
  ltp: number;
  change: number;
  high: number;
  low: number;
  volume: string;
}

export default function LegalLayout({ title, lastUpdated, children, bannerSrc }: LegalLayoutProps) {
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([
    { symbol: 'RELIANCE', ltp: 2420.50, change: 1.25, high: 2435.00, low: 2410.00, volume: '4.8M' },
    { symbol: 'TCS', ltp: 3250.10, change: -0.45, high: 3280.00, low: 3240.00, volume: '1.2M' },
    { symbol: 'INFY', ltp: 1510.80, change: 0.85, high: 1525.00, low: 1502.00, volume: '2.5M' },
    { symbol: 'HDFCBANK', ltp: 1620.30, change: -1.10, high: 1640.00, low: 1615.00, volume: '3.1M' },
    { symbol: 'ICICIBANK', ltp: 940.75, change: 0.35, high: 950.00, low: 935.00, volume: '1.8M' },
  ]);

  useEffect(() => {
    const load = () => {
      setBrandLogo(localStorage.getItem('growffiy_brand_logo') || '');
      setBrandName(localStorage.getItem('growffiy_brand_name') || 'Growffiy');
    };
    load();
    window.addEventListener('branding-updated', load);

    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          const appName = data.settings.appName || 'Growffiy';
          const appLogo = data.settings.appLogo || '';
          setBrandName(appName);
          setBrandLogo(appLogo);
          localStorage.setItem('growffiy_brand_name', appName);
          localStorage.setItem('growffiy_brand_logo', appLogo);
        }
      })
      .catch(err => console.error('Failed to fetch public settings:', err));

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const fetchStocks = async () => {
      try {
        const res = await fetch('/api/public/stocks', { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.stocks?.length > 0) {
          setStocks(data.stocks);
        }
      } catch (err) {
        console.error('Failed to fetch stock prices:', err);
      }
    };
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000);

    return () => {
      window.removeEventListener('branding-updated', load);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const isUp = (change: number) => change >= 0;

  return (
    <div data-theme="light" style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* Stock Ticker Bar at the very top */}
      <div style={{
        background: '#0f172a',
        color: '#f8fafc',
        height: '38px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'relative',
        zIndex: 1001,
      }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes ticker-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .ticker-track {
            display: inline-flex;
            animation: ticker-scroll 30s linear infinite;
          }
          .ticker-track:hover { animation-play-state: paused; }
        `}}></style>
        <div className="ticker-track">
          {[...stocks, ...stocks].map((s, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0 28px',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              fontSize: 12, fontWeight: 600,
            }}>
              <span style={{ color: '#94a3b8', fontWeight: 700, letterSpacing: '0.3px' }}>{s.symbol}</span>
              <span style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: 13 }}>₹{s.ltp.toFixed(2)}</span>
              <span style={{
                color: isUp(s.change) ? '#4ade80' : '#f87171',
                fontSize: 11, fontWeight: 700,
              }}>
                {isUp(s.change) ? '▲' : '▼'} {Math.abs(s.change).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>

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
              <img src={brandLogo || '/logo.png'} alt={brandName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            {brandName.toUpperCase()}
          </Link>

          <div className="navbar-nav">
            <Link href="/" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Home</Link>
            <Link href="/products" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Products</Link>
            <Link href="/pricing" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Pricing</Link>
            <Link href="/about" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>About Us</Link>
            <Link href="/login" target="_blank" className="btn-nav">Get Started →</Link>
          </div>

          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} color="#0f172a" /> : <Menu size={22} color={scrolled ? '#0f172a' : '#0f172a'} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-nav">
            <Link href="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/products" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Products</Link>
            <Link href="/pricing" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/about" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            <Link href="/login" target="_blank" className="mobile-nav-cta" onClick={() => setMobileMenuOpen(false)}>Get Started →</Link>
          </div>
        )}
      </nav>

      {/* Banner if provided */}
      {bannerSrc && (
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '24px 24px 0 24px',
        }}>
          <div style={{
            width: '100%',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
          }}>
            <img 
              src={bannerSrc} 
              alt={title} 
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }} 
            />
          </div>
        </div>
      )}

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
