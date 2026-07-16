'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '../../shared/components/views/Footer';
import { Menu, X, Check, ArrowRight, ShieldCheck, Zap, Cpu, Award, Users, RefreshCw } from 'lucide-react';

interface Stock {
  symbol: string;
  ltp: number;
  change: number;
  high: number;
  low: number;
  volume: string;
}

export default function ProductsPage() {
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
      color: '#0f172a',
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
          .ticker-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0 24px;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.5px;
            border-right: 1px solid rgba(255,255,255,0.1);
          }
        ` }} />
        <div className="ticker-track">
          {[...stocks, ...stocks].map((s, idx) => (
            <span key={idx} className="ticker-item">
              <span style={{ color: '#94a3b8' }}>{s.symbol}</span>
              <span style={{ fontWeight: 700 }}>₹{s.ltp.toFixed(2)}</span>
              <span style={{
                color: isUp(s.change) ? '#4ade80' : '#f87171',
                fontSize: 10, fontWeight: 700,
              }}>
                {isUp(s.change) ? '▲' : '▼'} {Math.abs(s.change).toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Sticky Header Navbar */}
      <nav style={{
        position: 'sticky', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled || mobileMenuOpen
          ? 'rgba(255,255,255,0.97)'
          : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled || mobileMenuOpen ? '1px solid rgba(226,232,240,0.8)' : '1px solid transparent',
        boxShadow: scrolled || mobileMenuOpen ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.35s ease',
      }}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link href="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="navbar-logo-icon">
              <img src={brandLogo || '/logo.png'} alt={brandName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            {brandName.toUpperCase()}
          </Link>

          {/* Desktop Nav links */}
          <div className="navbar-nav">
            <Link href="/" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Home</Link>
            <Link href="/products" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`} style={{ color: '#1E88FF', fontWeight: 600 }}>Products</Link>
            <Link href="/pricing" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Pricing</Link>
            <Link href="/about" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>About Us</Link>
            <Link href="/login" target="_blank" className="btn-nav">Get Started →</Link>
          </div>

          {/* Hamburger Button (mobile only) */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} color="#0f172a" /> : <Menu size={22} color={scrolled ? '#0f172a' : '#0f172a'} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mobile-nav">
            <Link href="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link href="/products" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Products</Link>
            <Link href="/pricing" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/about" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            <Link href="/login" target="_blank" className="mobile-nav-cta" onClick={() => setMobileMenuOpen(false)}>
              Get Started →
            </Link>
          </div>
        )}
      </nav>

      {/* ═══ HERO — Light Premium Split Layout ═══ */}
      <section className="products-hero-section" style={{
        background: '#ffffff',
        padding: '70px 24px 0',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '420px', height: '420px', background: 'transparent', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20px', right: '-60px', width: '320px', height: '320px', background: 'transparent', pointerEvents: 'none' }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: '56px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }} className="product-hero-grid">

          {/* ── Left ── */}
          <div className="hero-card-left" style={{ paddingBottom: '70px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(30,136,255,0.08)',
              border: '1px solid rgba(30,136,255,0.15)',
              borderRadius: '20px', padding: '6px 14px',
              fontSize: '11px', fontWeight: 700, color: '#1E88FF',
              letterSpacing: '1px', textTransform: 'uppercase',
              marginBottom: '24px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1E88FF', display: 'inline-block', boxShadow: '0 0 6px rgba(30,136,255,0.5)' }} />
              India&apos;s #1 Trading Technology
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 4.8vw, 58px)',
              fontWeight: 900,
              color: '#0f172a',
              lineHeight: 1.08,
              letterSpacing: '-2px',
              marginBottom: '22px',
            }}>
              Smarter Tools.<br />
              Stronger Trades.<br />
              <span style={{
                background: 'linear-gradient(90deg, #1E88FF 0%, #0ea5e9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Better Growth.</span>
            </h1>

            <p style={{
              fontSize: '15px', color: '#475569', lineHeight: 1.75,
              maxWidth: '440px', marginBottom: '36px',
            }}>
              Powerful trading tools built for traders who want an edge in every market. Real-time scanners, algo automation, and AI-powered analytics — all in one platform.
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '36px' }}>
              {['Real-time Nifty 500 Scanner', 'Algo Trading Automation', '99.9% Uptime'].map((t) => (
                <span key={t} style={{
                  fontSize: '12px', fontWeight: 600, color: '#475569',
                  background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(226,232,240,0.8)',
                  borderRadius: '20px', padding: '5px 12px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <Check size={11} color="#1E88FF" strokeWidth={3} /> {t}
                </span>
              ))}
            </div>


          </div>

          {/* ── Right: Product Cards ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '14px', alignSelf: 'start', marginTop: '20px',
          }} className="product-cards-grid">

            {/* Card 1 — Scanner */}
            <div style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderBottom: 'none',
              borderRadius: '18px 18px 0 0',
              padding: '22px 18px 0',
              minHeight: '280px',
              display: 'flex', flexDirection: 'column',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #1E88FF, #06b6d4)' }} />
              <span style={{
                fontSize: '9px', fontWeight: 800, color: '#1E88FF',
                background: 'rgba(30,136,255,0.08)', border: '1px solid rgba(30,136,255,0.2)',
                padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.8px',
                display: 'inline-block', marginBottom: '14px', width: 'fit-content',
              }}>PRODUCT 1</span>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', lineHeight: 1.35, marginBottom: '8px' }}>
                INTRADAY LIVE<br />NIFTY 500 SCANNER
              </p>
              <div style={{ width: '28px', height: '2px', background: 'linear-gradient(90deg, #1E88FF, #06b6d4)', borderRadius: '2px', marginBottom: '10px' }} />
              <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.55, marginBottom: '18px' }}>
                Real-time scanner across Nifty 500 with advanced filters & momentum detection.
              </p>
              {/* SVG Bar Chart */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '5px', paddingBottom: '0', marginTop: 'auto' }}>
                {[40, 65, 50, 80, 60, 90, 75, 100].map((h, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{
                      height: `${h * 0.7}px`,
                      background: i === 7
                        ? 'linear-gradient(180deg, #22d3ee, #0ea5e9)'
                        : i % 2 === 0
                          ? 'rgba(30,136,255,0.4)' : 'rgba(30,136,255,0.2)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'all 0.3s',
                    }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2 — Algo */}
            <div style={{
              background: 'linear-gradient(150deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: 'none',
              borderRadius: '18px 18px 0 0',
              padding: '22px 18px 0',
              minHeight: '280px',
              display: 'flex', flexDirection: 'column',
              position: 'relative', overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(15,23,42,0.15)',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #6366f1, #a855f7)' }} />
              <div style={{ position: 'absolute', bottom: '-30px', right: '-30px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }} />
              <span style={{
                fontSize: '9px', fontWeight: 800, color: '#c084fc',
                background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)',
                padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.8px',
                display: 'inline-block', marginBottom: '14px', width: 'fit-content',
              }}>PRODUCT 2</span>
              <p style={{ fontSize: '13px', fontWeight: 800, color: 'white', lineHeight: 1.35, marginBottom: '8px' }}>
                ALGO TRADING &amp;<br />INTRADAY LIVE<br />NIFTY 500 SCANNER
              </p>
              <div style={{ width: '28px', height: '2px', background: 'linear-gradient(90deg, #6366f1, #a855f7)', borderRadius: '2px', marginBottom: '10px' }} />
              <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.55, marginBottom: '18px' }}>
                Automated algo trading with scanner insights to execute smarter and faster.
              </p>
              {/* Line chart visual */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', marginTop: 'auto', paddingBottom: '0' }}>
                <svg viewBox="0 0 140 60" style={{ width: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,50 L20,40 L40,45 L60,30 L80,35 L100,18 L120,20 L140,5" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M0,50 L20,40 L40,45 L60,30 L80,35 L100,18 L120,20 L140,5 L140,60 L0,60 Z" fill="url(#lineGrad)" />
                  <circle cx="140" cy="5" r="4" fill="#a855f7" />
                  <circle cx="140" cy="5" r="7" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>





      {/* Product 1: Live Nifty 500 Scanner */}
      <section id="scanner" className="products-section" style={{
        padding: '80px 24px',
        background: '#ffffff',
        borderTop: '1px solid #f1f5f9',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap: '60px',
          alignItems: 'center'
        }} className="product-grid">
          {/* Left Column: Visual representation */}
          <div className="product-visual-card" style={{
            background: 'radial-gradient(135deg, rgba(30,136,255,0.04) 0%, rgba(13,71,161,0.06) 100%)',
            borderRadius: '24px',
            padding: '40px',
            border: '1px solid rgba(30,136,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: '#1E88FF',
              color: 'white',
              fontSize: '10px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '20px',
              letterSpacing: '1px'
            }}>PRODUCT 1</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px' }}>REAL-TIME SCANNING</span>
              <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px' }}>NIFTY 500</span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Intraday Live Nifty 500 Scanner</h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
              Real-time scanner that helps traders find the best stocks for intraday trades from the Nifty 500 index. Focus only on high-quality setups without getting lost in charts.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Index Exposure</span>
                <span style={{ fontWeight: 700 }}>Nifty 500 Stocks</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Scan Frequency</span>
                <span style={{ fontWeight: 700 }}>Ticks Real-Time</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>UI Feedback</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>● Active Streaming</span>
              </div>
            </div>
          </div>

          {/* Right Column: Features & Info */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E88FF', letterSpacing: '1px' }}>FIND THE BEST INTRADAY TRADES</span>
            <h2 className="products-section-heading" style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginTop: '6px', letterSpacing: '-0.5px' }}>Growffi Scanner</h2>
            <p style={{ fontSize: '15px', color: '#475569', marginTop: '12px', lineHeight: 1.6 }}>
              The Intraday Live Nifty 500 Scanner continuously scans all Nifty 500 stocks throughout the trading session and identifies stocks that match powerful intraday trading conditions. Instead of manually analyzing hundreds of charts, our scanner instantly highlights the strongest opportunities based on predefined technical filters.
            </p>

            <h4 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a', marginTop: '28px', marginBottom: '12px' }}>Key Scan Features</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }} className="mobile-single-col">
              {[
                "Live scanning of Nifty 500",
                "Advanced price action filters",
                "Breakout & breakdown detection",
                "Gap Up & Gap Down scanner",
                "Volume breakout scanner",
                "Open = High / Open = Low",
                "First 5-Min Candle Breakout",
                "Momentum stock identification",
                "Trend confirmation filters",
                "Easy-to-use dashboard"
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a' }}>
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginTop: '30px' }} className="mobile-single-col">
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Benefits</h4>
                <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Save hours of daily analysis</li>
                  <li>Never miss high-prob setups</li>
                  <li>Reduce emotional decisions</li>
                  <li>Fast execution matching</li>
                </ul>
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Who Can Use It?</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {["Intraday Traders", "Scalpers", "Swing Traders", "Momentum"].map((who, i) => (
                    <span key={i} style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px' }}>{who}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product 2: Algo Trading Tools */}
      <section id="algo" className="products-section" style={{
        padding: '80px 24px',
        background: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: '60px',
          alignItems: 'center'
        }} className="product-grid">
          {/* Left Column: Features & Info */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E88FF', letterSpacing: '1px' }}>COMPLETE STRATEGY AUTOMATION</span>
            <h2 className="products-section-heading" style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginTop: '6px', letterSpacing: '-0.5px' }}>Growffi Algo Trading Tools</h2>
            <p style={{ fontSize: '15px', color: '#475569', marginTop: '12px', lineHeight: 1.6 }}>
              Our Algo Trading Tools help traders automate their trading strategies with speed, precision, and discipline. Once configured, the system continuously monitors live market hours and executes trades automatically based on your predefined rules.
            </p>

            <h4 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a', marginTop: '28px', marginBottom: '12px' }}>Key Algo Features</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }} className="mobile-single-col">
              {[
                "100% Strategy Automation",
                "Automatic Buy & Sell Orders",
                "Real-Time Execution",
                "Multi-Broker API Support",
                "Risk Management Controls",
                "Stop Loss & Target Guard",
                "Trailing Stop Loss Support",
                "Simple Strategy Builder",
                "Live Monitoring Dashboard",
                "Instant Telegram Alerts"
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: '#eff6ff', color: '#1E88FF' }}>
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', marginTop: '30px' }} className="mobile-single-col">
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Supported Strategies</h4>
                <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Opening Range Breakout</li>
                  <li>First 5-Min Breakout</li>
                  <li>Gap Up & Gap Down</li>
                  <li>Price Action / Momentum</li>
                </ul>
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Risk Management Rules</h4>
                <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '13px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Fixed Stop Loss & Target</li>
                  <li>Auto Position Sizing</li>
                  <li>Max Daily Loss Limit</li>
                  <li>Capital Protection Rules</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Visual representation */}
          <div className="product-visual-card" style={{
            background: 'radial-gradient(135deg, rgba(30,136,255,0.04) 0%, rgba(13,71,161,0.06) 100%)',
            borderRadius: '24px',
            padding: '40px',
            border: '1px solid rgba(30,136,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: '#1E88FF',
              color: 'white',
              fontSize: '10px',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '20px',
              letterSpacing: '1px'
            }}>PRODUCT 2</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px' }}>100% AUTOMATED</span>
              <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px' }}>BROKER CONNECTOR</span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Algo Trading & Execution Middleware</h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
              Configure your entry, targets, and risk parameters. The algorithmic trading engine executes orders instantly via your broker console with zero emotional latency.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Execution Latency</span>
                <span style={{ fontWeight: 700 }}>&lt; 500ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid rgba(0,0,0,0.04)', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Risk Guard Protection</span>
                <span style={{ fontWeight: 700 }}>Automatic 1% Risk</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Auto Square-Off</span>
                <span style={{ fontWeight: 700 }}>3:15 PM Intraday</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix Table */}
      <section className="products-section" style={{
        padding: '80px 24px',
        background: '#ffffff',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E88FF', letterSpacing: '1.5px', textTransform: 'uppercase' }}>PRODUCT COMPARISON</span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>Which Product is Right for You?</h2>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 700, color: '#475569' }}>Feature</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700, color: '#0f172a' }}>Intraday Live Nifty 500 Scanner</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700, color: '#1E88FF' }}>Algo Trading Tools</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>Find Trading Opportunities</td>
                  <td style={{ padding: '14px 20px', color: '#16a34a', fontWeight: 700 }}>✓ Yes</td>
                  <td style={{ padding: '14px 20px', color: '#ef4444', fontWeight: 700 }}>✕ No</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>Real-Time Market Scanning</td>
                  <td style={{ padding: '14px 20px', color: '#16a34a', fontWeight: 700 }}>✓ Yes</td>
                  <td style={{ padding: '14px 20px', color: '#ef4444', fontWeight: 700 }}>✕ No</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>Manual Trading Support</td>
                  <td style={{ padding: '14px 20px', color: '#16a34a', fontWeight: 700 }}>✓ Yes</td>
                  <td style={{ padding: '14px 20px', color: '#16a34a', fontWeight: 700 }}>✓ Yes</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>Automatic Trade Execution</td>
                  <td style={{ padding: '14px 20px', color: '#ef4444', fontWeight: 700 }}>✕ No</td>
                  <td style={{ padding: '14px 20px', color: '#16a34a', fontWeight: 700 }}>✓ Yes</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>Emotion-Free Trading</td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>Partial</td>
                  <td style={{ padding: '14px 20px', color: '#16a34a', fontWeight: 700 }}>✓ Yes</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>Strategy Automation</td>
                  <td style={{ padding: '14px 20px', color: '#ef4444', fontWeight: 700 }}>✕ No</td>
                  <td style={{ padding: '14px 20px', color: '#16a34a', fontWeight: 700 }}>✓ Yes</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>Risk Management Controls</td>
                  <td style={{ padding: '14px 20px', color: '#475569' }}>Basic</td>
                  <td style={{ padding: '14px 20px', color: '#1E88FF', fontWeight: 700 }}>Advanced</td>
                </tr>
                <tr style={{ background: '#f8fafc' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700 }}>Best For</td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#475569' }}>Intraday Technical Traders</td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1E88FF' }}>Traders wanting full automation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Grid: Why Choose Growffi */}
      <section className="products-section" style={{
        padding: '80px 24px',
        background: '#f8fafc',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E88FF', letterSpacing: '1.5px', textTransform: 'uppercase' }}>THE GROWFFI EDGE</span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>Why Traders Choose Our Technology</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {[
              { icon: <Cpu size={24} />, title: "Smart Technology", desc: "Our tools are designed using advanced market logic to help traders make faster and smarter decisions." },
              { icon: <Zap size={24} />, title: "Reliable Performance", desc: "Built for speed, stability, and real-time execution during live market hours without downtime." },
              { icon: <Award size={24} />, title: "Easy to Use", desc: "Simple clean interface suitable for both beginners and experienced algorithmic traders." },
              { icon: <Users size={24} />, title: "Dedicated Support", desc: "Our team is committed to helping traders get the most out of our platform through timely assistance." }
            ].map((box, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: 'rgba(30,136,255,0.08)',
                  color: '#1E88FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>{box.icon}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{box.title}</h3>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{box.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ═══ BEAUTIFUL FEATURE ICONS ROW — MOVED TO BOTTOM ═══ */}
      <section className="products-bottom-section" style={{ background: '#f8fafc', padding: '60px 24px 80px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Designed for Peak Performance</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>Every feature built with precision to give you a structural advantage.</p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
          }} className="features-grid">
            {[
              { icon: <Zap size={22} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', title: 'Real-time Scanning', desc: 'Scan market in real-time and catch high probability opportunities.' },
              { icon: <Cpu size={22} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', title: 'Algo Trading', desc: 'Automate your strategies and trade with speed, discipline and accuracy.' },
              { icon: <RefreshCw size={22} />, color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)', title: 'Advanced Analytics', desc: 'Data-driven insights and powerful filters to take smarter decisions.' },
              { icon: <ShieldCheck size={22} />, color: '#22c55e', bg: 'rgba(34,197,94,0.08)', title: 'Reliable & Secure', desc: 'Enterprise-grade security and 99.9% uptime you can depend on.' },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', gap: '16px',
                padding: '28px 24px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                transition: 'all 0.3s ease',
              }} className="feature-bottom-card">
                <div style={{
                  width: '46px', height: '46px', borderRadius: '12px',
                  background: f.bg, color: f.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>{f.title}</h3>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .feature-bottom-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(30,136,255,0.08) !important;
          border-color: rgba(30,136,255,0.2) !important;
        }
        @media (max-width: 768px) {
          .products-hero-section { padding: 40px 16px 0 !important; }
          .products-section { padding: 48px 16px !important; }
          .products-bottom-section { padding: 36px 16px 48px !important; }
          .products-section-heading { font-size: 24px !important; }
          .product-detail-heading { font-size: 24px !important; }
          .hero-card-left { padding-bottom: 40px !important; }
          .product-visual-card { padding: 24px !important; }
        }
        @media (max-width: 480px) {
          .products-hero-section { padding: 28px 12px 0 !important; }
          .products-section { padding: 36px 12px !important; }
          .products-bottom-section { padding: 28px 12px 36px !important; }
          .products-section-heading { font-size: 20px !important; }
          .product-detail-heading { font-size: 20px !important; }
          .product-visual-card { padding: 18px !important; }
          .hero-card-left { padding-bottom: 28px !important; }
        }
      ` }} />

      {/* Styled Product Grid Adaptations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .product-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
          .mobile-single-col {
            grid-template-columns: 1fr !important;
          }
          .product-hero-grid {
            grid-template-columns: 1fr !important;
          }
          .product-cards-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .features-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .product-cards-grid {
            grid-template-columns: 1fr !important;
          }
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
        }
      ` }} />

      {/* Footer component */}
      <Footer />
    </div>
  );
}
