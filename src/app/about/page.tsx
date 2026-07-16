'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Footer from '../../shared/components/views/Footer';
import { Target, Eye, Shield, Users, Award, Zap, ShieldCheck, Star, TrendingUp, Menu, X } from 'lucide-react';

interface Stock {
  symbol: string;
  ltp: number;
  change: number;
  high: number;
  low: number;
  volume: string;
}

export default function AboutPage() {
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [content, setContent] = useState('');
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

    fetch('/api/settings/legal?t=' + Date.now(), { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.legal_about_content) {
          setContent(data.settings.legal_about_content);
        }
      })
      .catch(() => {});

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
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const isUp = (change: number) => change >= 0;

  return (
    <div data-theme="light" style={{
      minHeight: '100vh',
      background: '#ffffff',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: '#0f172a'
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

      {/* Navbar */}
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
            <Link href="/about" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`} style={{ color: '#1E88FF', fontWeight: 600 }}>About Us</Link>
            <Link href="/login" target="_blank" className="btn-nav">Get Started →</Link>
          </div>

          <button className="hamburger-btn" onClick={() => setMobileMenuOpen(o => !o)}>
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

      {/* Main Container */}
      <div className="about-container" style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px 24px 80px',
      }}>
        {/* Top Hero: Text left, illustration right */}
        <div className="about-hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center',
          marginBottom: '48px'
        }}>
          {/* Left Column: Copy */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 16px',
              background: 'rgba(30,136,255,0.1)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#1E88FF',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '20px'
            }}>
              ABOUT US
            </div>
            
            <h1 style={{
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.2,
              letterSpacing: '-1px',
              marginBottom: '24px'
            }}>
              Empowering Traders.<br />
              Building Smarter Tools.<br />
              <span style={{ color: '#1E88FF' }}>Growing Together.</span>
            </h1>

            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#475569', marginBottom: '16px' }}>
              At Growffi, we believe that successful trading is built on three pillars: <strong>knowledge, discipline, and technology</strong>. We build intelligent scanners, advanced algo tools, and reliable solutions to help traders make confident decisions and achieve consistent growth.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#475569', marginBottom: '0' }}>
              Powered by <strong>Growffi Fintech Private Limited</strong>, we are committed to delivering tools that help you <strong style={{ color: '#1E88FF' }}>trade smarter and grow with confidence</strong>.
            </p>
          </div>

          {/* Right Column: Illustration */}
          <div style={{
            position: 'relative',
            borderRadius: '24px',
            overflow: 'hidden',
            maxWidth: '420px',
            margin: '0 auto',
          }}>
            <img 
              src="/about_illustration_transparent.png" 
              alt="About Us Illustration" 
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                maxHeight: '340px',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>

        {/* Full-width Dynamic Content from DB */}
        {content && (
          <div
            className="legal-rich-text"
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e8edf5',
              boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
              padding: 'clamp(24px, 5vw, 44px)',
              marginBottom: '48px',
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        {/* 4 Columns row immediately below */}
        <div className="about-values-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          marginBottom: '48px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Target size={18} color="#1E88FF" />
              <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>Our Mission</span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              To empower traders with innovative technology and data-driven tools.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Eye size={18} color="#1E88FF" />
              <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>Our Vision</span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              To be the most trusted trading tech platform for every trader.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Shield size={18} color="#1E88FF" />
              <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>Our Values</span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Transparency, Innovation, Integrity, and Trader Success.
            </p>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Users size={18} color="#1E88FF" />
              <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>Our Belief</span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              When traders grow, we grow. Together, we achieve more.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="about-stats-row" style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          padding: '24px 16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          textAlign: 'center',
          alignItems: 'center',
          marginBottom: '48px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E88FF', marginBottom: '4px' }}>
              <Users size={16} />
              <span style={{ fontSize: '18px', fontWeight: 800 }}>10K+</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Active Traders</div>
          </div>

          <div className="about-stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E88FF', marginBottom: '4px' }}>
              <TrendingUp size={16} />
              <span style={{ fontSize: '18px', fontWeight: 800 }}>500+</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Pre-Market Scans Every Day</div>
          </div>

          <div className="about-stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E88FF', marginBottom: '4px' }}>
              <Award size={16} />
              <span style={{ fontSize: '18px', fontWeight: 800 }}>95%+</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Strategy Accuracy</div>
          </div>

          <div className="about-stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E88FF', marginBottom: '4px' }}>
              <Zap size={16} />
              <span style={{ fontSize: '18px', fontWeight: 800 }}>24/7</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>AI Bots & Automation</div>
          </div>

          <div className="about-stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E88FF', marginBottom: '4px' }}>
              <ShieldCheck size={16} />
              <span style={{ fontSize: '18px', fontWeight: 800 }}>100%</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Secure & Reliable</div>
          </div>

          <div className="about-stat-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E88FF', marginBottom: '4px' }}>
              <Star size={16} />
              <span style={{ fontSize: '18px', fontWeight: 800 }}>4.8/5</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>User Rating</div>
          </div>
        </div>

        {/* Footer Callout */}
        <div className="about-footer-section" style={{
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', margin: 0 }}>
            We're not just building tools, we're building a strong trading community.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1E88FF', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Trade Smart.</span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1E88FF' }} />
              <span>Trade Better.</span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#1E88FF' }} />
              <span>Grow Together.</span>
            </h3>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .about-container { padding: 16px 16px 48px !important; }
          .about-hero-grid { gap: 28px !important; margin-bottom: 32px !important; }
          .about-values-grid { gap: 16px !important; margin-bottom: 32px !important; }
          .about-stats-row { margin-bottom: 32px !important; padding: 16px 12px !important; }
          .about-stats-row > .about-stat-item { border-left: none !important; }
          .about-mission-heading { font-size: 14px !important; }
          .about-footer-section { gap: 8px !important; }
        }
        @media (max-width: 480px) {
          .about-container { padding: 12px 12px 36px !important; }
          .about-hero-grid { gap: 20px !important; margin-bottom: 24px !important; }
          .about-values-grid { gap: 12px !important; margin-bottom: 24px !important; }
          .about-stats-row { margin-bottom: 24px !important; padding: 12px 8px !important; gap: 8px !important; }
          .about-stats-row > .about-stat-item { border-left: none !important; }
          .about-mission-heading { font-size: 13px !important; }
          .about-footer-section { gap: 6px !important; }
          .about-footer-tagline { font-size: 13px !important; }
          .about-footer-tagline h3 { font-size: 13px !important; }
        }
      `}</style>

      <Footer />
    </div>
  );
}
