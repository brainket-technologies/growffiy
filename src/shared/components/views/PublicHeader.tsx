'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

interface Stock {
  symbol: string;
  name?: string;
  ltp: number;
  change: number;
}

export default function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');
  
  // Default fallback stocks
  const [stocks, setStocks] = useState<Stock[]>([
    { symbol: 'RELIANCE', ltp: 2432.85, change: 2.35 },
    { symbol: 'TCS', ltp: 3850.00, change: 1.20 },
    { symbol: 'INFY', ltp: 1580.00, change: 0.85 },
    { symbol: 'TATAMOTORS', ltp: 945.20, change: -1.85 },
    { symbol: 'HDFCBANK', ltp: 1678.60, change: 1.98 },
    { symbol: 'ICICIBANK', ltp: 1152.30, change: 1.72 },
    { symbol: 'NIFTY50', ltp: 24334.30, change: 1.09 },
    { symbol: 'BANKNIFTY', ltp: 58521.40, change: 1.63 },
    { symbol: 'INDIAVIX', ltp: 12.45, change: -2.20 },
    { symbol: 'WIPRO', ltp: 486.75, change: -1.32 },
    { symbol: 'SBIN', ltp: 1044.30, change: 1.27 },
  ]);

  useEffect(() => {
    // Load Branding
    const loadBrand = () => {
      const storedLogo = localStorage.getItem('growffiy_brand_logo');
      const storedName = localStorage.getItem('growffiy_brand_name');
      if (storedLogo) setBrandLogo(storedLogo);
      if (storedName) setBrandName(storedName);
    };
    loadBrand();
    window.addEventListener('branding-updated', loadBrand);

    // Scroll Handler
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);

    // Fetch live stocks
    const fetchStocks = async () => {
      try {
        const res = await fetch('/api/public/stocks');
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setStocks(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch public stocks:', err);
      }
    };
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000);

    return () => {
      window.removeEventListener('branding-updated', loadBrand);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const openConsultation = () => {
    window.dispatchEvent(new CustomEvent('open-consultation-modal'));
  };

  const isUp = (change: number) => change >= 0;

  // Active Link Helper
  const getLinkStyle = (path: string) => {
    const isActive = pathname === path;
    return {
      color: isActive ? '#2563eb' : '#334155',
      fontWeight: isActive ? 700 : 600,
      position: isActive ? 'relative' as const : 'static' as const,
      background: 'none'
    };
  };

  const activeUnderline = (
    <span style={{
      position: 'absolute',
      bottom: '-18px',
      left: '14px',
      right: '14px',
      height: '2px',
      background: '#2563eb',
      borderRadius: '99px'
    }} />
  );

  return (
    <>
      {/* ════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: '#ffffff',
        borderBottom: '1px solid rgba(226,232,240,0.8)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        transition: 'all 0.35s ease',
      }}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link href="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', background: 'none', WebkitTextFillColor: 'initial', color: 'initial' }}>
            <div className="navbar-logo-icon" style={{ width: '48px', height: '48px' }}>
              <img src={brandLogo || "/logo.png"} alt={`${brandName} Logo`} style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.25)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', lineHeight: '1.15' }}>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#2563eb', letterSpacing: '0.2px', fontFamily: 'var(--font-title)', textTransform: 'uppercase' }}>{brandName}</span>
              <span style={{ fontSize: '9px', color: '#334155', fontWeight: '700', letterSpacing: '-0.1px', whiteSpace: 'nowrap' }}>Automate. Trade. Grow.</span>
            </div>
          </Link>

          {/* Desktop Nav links */}
          <div className="navbar-nav" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <Link href="/" className="nav-link" style={getLinkStyle('/')}>
              Home
              {pathname === '/' && activeUnderline}
            </Link>
            <Link href="/products" className="nav-link" style={getLinkStyle('/products')}>
              Products
              {pathname === '/products' && activeUnderline}
            </Link>
            <Link href="/pricing" className="nav-link" style={getLinkStyle('/pricing')}>
              Pricing
              {pathname === '/pricing' && activeUnderline}
            </Link>
            <Link href="/about" className="nav-link" style={getLinkStyle('/about')}>
              About Us
              {pathname === '/about' && activeUnderline}
            </Link>
            <Link href="/login" className="nav-link" style={{ color: '#334155', fontWeight: 600, marginLeft: '8px' }}>Client Portal</Link>
            <button onClick={openConsultation} style={{
              marginLeft: '36px',
              background: '#2563eb',
              color: '#ffffff',
              padding: '9px 22px',
              borderRadius: '99px',
              fontWeight: '700',
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>Get Started →</button>
          </div>

          {/* Hamburger Button (mobile only) */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} color="#0f172a" /> : <Menu size={22} color="#0f172a" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mobile-nav">
            <Link href="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/products" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Products</Link>
            <Link href="/pricing" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/about" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            <Link href="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)} style={{ color: '#2563eb', fontWeight: 700 }}>Client Portal</Link>
            <button className="mobile-nav-cta" onClick={() => { openConsultation(); setMobileMenuOpen(false); }} style={{ border: 'none', textAlign: 'center', width: '100%', cursor: 'pointer' }}>
              Get Started →
            </button>
          </div>
        )}
      </nav>

      {/* ════════════════════════════════════════
          LIVE STOCK TICKER STRIP
      ════════════════════════════════════════ */}
      <div style={{
        background: '#ffffff',
        color: '#0f172a',
        padding: '5px 0',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        position: 'fixed',
        top: '70px',
        left: 0,
        right: 0,
        zIndex: 999,
        borderBottom: '1px solid #e2e8f0',
        borderTop: '1px solid #f1f5f9',
        transform: scrolled ? 'translateY(-70px)' : 'translateY(0)',
        opacity: scrolled ? 0 : 1,
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        pointerEvents: scrolled ? 'none' : 'auto'
      }}>
        <style>{`
          @keyframes ticker-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .ticker-track {
            display: inline-flex;
            animation: ticker-scroll 30s linear infinite;
            align-items: center;
          }
          .ticker-track:hover { animation-play-state: paused; }
        `}</style>
        <div className="ticker-track">
          {[...stocks, ...stocks].map((s, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0 28px',
              borderRight: '1px solid #e2e8f0',
              fontSize: 11, fontWeight: 600,
            }}>
              <span style={{ color: '#475569', fontWeight: 700, letterSpacing: '0.3px' }}>{s.symbol === 'TATAMOTORS' ? 'TATA MOTORS' : s.symbol === 'ICICIBANK' ? 'ICICI BANK' : s.symbol === 'HDFCBANK' ? 'HDFC BANK' : s.symbol === 'SBIN' ? 'SBI' : s.symbol.replace('50', ' 50').replace('NIFTY', ' NIFTY').trim()}</span>
              <span style={{ color: '#0f172a', fontFamily: 'var(--font-body)', fontWeight: 700 }}>{s.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span style={{
                color: isUp(s.change) ? '#10b981' : '#ef4444',
                fontSize: 11, fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3
              }}>
                {isUp(s.change) ? '▲' : '▼'} {Math.abs(s.change).toFixed(2)}%
              </span>
            </span>
          ))}
          {/* Append Live Market Indicator */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0 28px',
            fontSize: 11, fontWeight: 700,
            color: '#475569',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulseDot 1.5s ease-in-out infinite' }} />
            Live Market
          </span>
        </div>
      </div>
    </>
  );
}
