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
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [appStoreUrl, setAppStoreUrl] = useState('');
  
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
    // Fetch branding from API directly (appName, appLogo are the correct field names)
    const fetchBranding = async () => {
      try {
        const res = await fetch('/api/settings/public', { cache: 'no-store' });
        const data = await res.json();
        if (data.success !== false) {
          if (data.appLogo) setBrandLogo(data.appLogo);
          if (data.appName) setBrandName(data.appName);
          if (data.appPlaystoreUrl) setPlayStoreUrl(data.appPlaystoreUrl);
          if (data.appAppstoreUrl) setAppStoreUrl(data.appAppstoreUrl);
        }
      } catch (err) {
        // Fallback: try localStorage
        const storedLogo = localStorage.getItem('brand_logo');
        const storedName = localStorage.getItem('brand_name');
        if (storedLogo) setBrandLogo(storedLogo);
        if (storedName) setBrandName(storedName);
      }
    };
    fetchBranding();
    window.addEventListener('branding-updated', fetchBranding);

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
      window.removeEventListener('branding-updated', fetchBranding);
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

            {/* Download App Dropdown */}
            <div
              style={{ position: 'relative', marginLeft: '8px' }}
              onMouseEnter={() => setDownloadOpen(true)}
              onMouseLeave={() => setDownloadOpen(false)}
            >
              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: '#334155',
                fontWeight: 600,
                fontSize: '14px',
                padding: '8px 14px',
                borderRadius: '8px',
                transition: 'all 0.2s',
                color: downloadOpen ? '#2563eb' : '#334155',
              } as React.CSSProperties}
              >
                Download App
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: 'transform 0.2s', transform: downloadOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {/* Invisible bridge to prevent gap-triggered close */}
              {downloadOpen && <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, height: '8px' }} />}

              {/* Dropdown Panel */}
              {downloadOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)',
                  padding: '8px',
                  minWidth: '220px',
                  zIndex: 2000,
                  animation: 'fadeInDown 0.15s ease',
                }}>

                  {/* Google Play - compact row */}
                  <a href={playStoreUrl || '#'} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#0f172a',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M4 3L19.5 12L4 21V3Z" fill="url(#nhgp0)"/>
                      <path d="M4 3L15 15L4 21V3Z" fill="url(#nhgp1)"/>
                      <path d="M4 3L11 11L4 21V3Z" fill="url(#nhgp2)"/>
                      <defs>
                        <linearGradient id="nhgp0" x1="4" y1="3" x2="19.5" y2="12" gradientUnits="userSpaceOnUse"><stop stopColor="#EA4335"/><stop offset="1" stopColor="#FBBC04"/></linearGradient>
                        <linearGradient id="nhgp1" x1="4" y1="3" x2="15" y2="15" gradientUnits="userSpaceOnUse"><stop stopColor="#4285F4"/><stop offset="1" stopColor="#34A853"/></linearGradient>
                        <linearGradient id="nhgp2" x1="4" y1="3" x2="11" y2="11" gradientUnits="userSpaceOnUse"><stop stopColor="#34A853"/><stop offset="1" stopColor="#0F9D58"/></linearGradient>
                      </defs>
                    </svg>
                    <div style={{ lineHeight: 1.3 }}>
                      <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.3px' }}>GET IT ON</div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>Google Play</div>
                    </div>
                  </a>

                  {/* App Store - compact row */}
                  <a href={appStoreUrl || '#'} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#0f172a',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="#0f172a" style={{ flexShrink: 0 }}>
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
                    </svg>
                    <div style={{ lineHeight: 1.3 }}>
                      <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.3px' }}>DOWNLOAD ON THE</div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>App Store</div>
                    </div>
                  </a>

                  <style>{`
                    @keyframes fadeInDown {
                      from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
                      to { opacity: 1; transform: translateX(-50%) translateY(0); }
                    }
                  `}</style>
                </div>
              )}
            </div>
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

            {/* Download links in mobile menu */}
            <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '8px', paddingTop: '12px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 16px 10px' }}>Download App</p>
              <a href={playStoreUrl || '#'} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', textDecoration: 'none', color: '#0f172a' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M4 3L19.5 12L4 21V3Z" fill="url(#mhgp0)"/>
                    <path d="M4 3L15 15L4 21V3Z" fill="url(#mhgp1)"/>
                    <path d="M4 3L11 11L4 21V3Z" fill="url(#mhgp2)"/>
                    <defs>
                      <linearGradient id="mhgp0" x1="4" y1="3" x2="19.5" y2="12" gradientUnits="userSpaceOnUse"><stop stopColor="#EA4335"/><stop offset="1" stopColor="#FBBC04"/></linearGradient>
                      <linearGradient id="mhgp1" x1="4" y1="3" x2="15" y2="15" gradientUnits="userSpaceOnUse"><stop stopColor="#4285F4"/><stop offset="1" stopColor="#34A853"/></linearGradient>
                      <linearGradient id="mhgp2" x1="4" y1="3" x2="11" y2="11" gradientUnits="userSpaceOnUse"><stop stopColor="#34A853"/><stop offset="1" stopColor="#0F9D58"/></linearGradient>
                    </defs>
                  </svg>
                </div>
                <div><div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>GET IT ON</div><div style={{ fontSize: '14px', fontWeight: 700 }}>Google Play</div></div>
              </a>
              <a href={appStoreUrl || '#'} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', textDecoration: 'none', color: '#0f172a' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/></svg>
                </div>
                <div><div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>DOWNLOAD ON THE</div><div style={{ fontSize: '14px', fontWeight: 700 }}>App Store</div></div>
              </a>
            </div>
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

      {/* Spacer to prevent content from hiding behind fixed header */}
      <div style={{ height: '110px' }} aria-hidden="true" />
    </>
  );
}
