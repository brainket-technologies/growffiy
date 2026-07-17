'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from './Footer';
import { Menu, X, TrendingUp, ShieldCheck, Lock, Upload, PauseCircle, Headphones, Check, Shield, FileText, Scale, User, File } from 'lucide-react';

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
  const isUp = (change: number) => change >= 0;
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

  // Dynamic header configurations based on the page title
  const isTerms = title.toLowerCase().includes('terms');
  const isDisclaimer = title.toLowerCase().includes('disclaimer');

  // Set header text fields dynamically
  const tagLabel = isTerms ? "TERMS & CONDITIONS PAGE" : isDisclaimer ? "DISCLAIMER PAGE" : "POLICY PAGE";
  
  const mainHeading = isTerms ? (
    <>Clear Terms.<br /><span style={{ color: '#0052e0' }}>Fair Use.</span><br />Built on Trust.</>
  ) : isDisclaimer ? (
    <>Important Information.<br />Read. Understand.<br /><span style={{ color: '#0052e0' }}>Trade Responsibly.</span></>
  ) : (
    <>Our Policies.<br /><span style={{ color: '#0052e0' }}>Your Trust.</span><br />Our Responsibility.</>
  );

  const subHeadingText = isTerms 
    ? "Our Terms & Conditions define the rules and guidelines for using Growffi's platform and services. By using our website and tools, you agree to these terms."
    : isDisclaimer
    ? "Growffi provides advanced trading tools, scanners, and technology solutions for educational and informational purposes only. All trading and investment decisions are your sole responsibility."
    : "At Growffi, we are committed to transparency, security, and compliance. Our policies ensure a safe, fair, and trustworthy trading experience for every user.";

  const headerBadges = isTerms ? [
    { icon: <Check size={14} />, label: "Fair & Transparent", color: '#0052e0' },
    { icon: <User size={14} />, label: "Defined Guidelines", color: '#16a34a' },
    { icon: <ShieldCheck size={14} />, label: "Secure & Compliant", color: '#ea580c' },
    { icon: <Scale size={14} />, label: "User Responsibility", color: '#4f46e5' }
  ] : isDisclaimer ? [
    { icon: <Shield size={14} />, label: "Informational Only", color: '#0052e0' },
    { icon: <TrendingUp size={14} />, label: "No Guarantee", color: '#16a34a' },
    { icon: <Scale size={14} />, label: "Trading Risk", color: '#ea580c' },
    { icon: <User size={14} />, label: "User Responsibility", color: '#4f46e5' },
    { icon: <ShieldCheck size={14} />, label: "No Liability", color: '#0284c7' }
  ] : [
    { icon: <ShieldCheck size={14} />, label: "Secure & Protected", color: '#0052e0' },
    { icon: <User size={14} />, label: "User First Approach", color: '#16a34a' },
    { icon: <FileText size={14} />, label: "Transparent Practices", color: '#ea580c' },
    { icon: <Scale size={14} />, label: "Legal Compliance", color: '#4f46e5' }
  ];

  // We can customize checklist items inside the simulated clipboard!
  const clipboardItems = isDisclaimer ? [
    { title: "Not Investment Advice", desc: "We do not provide investment advice or recommendations." },
    { title: "No Guaranteed Returns", desc: "Past performance is not a guarantee of future results." },
    { title: "Market Risk", desc: "Financial markets are volatile. You may lose part or all of capital." },
    { title: "Technology Platform", desc: "Growffi is a tech provider. We do not execute trades on your behalf." },
    { title: "Third-Party Services", desc: "We are not responsible for third-party brokers or data." }
  ] : isTerms ? [
    { title: "Terms of Use", desc: "Rules and guidelines for accessing our systems and software." },
    { title: "Fair Usage Policy", desc: "No malicious automated scraping or exploitation is tolerated." },
    { title: "Service Limitations", desc: "Server downtime rules, data lag limits, and integrations." }
  ] : [
    { title: "Privacy Focused", desc: "We protect your personal data with secure storage mechanisms." },
    { title: "Transparent Practices", desc: "Clear and straightforward policies with no hidden agendas." },
    { title: "Security Measures", desc: "Industry-standard data security and validation procedures." }
  ];

  const floatingLabels = isTerms ? [
    { label: "FAIR USAGE", top: '40px', left: '40px', icon: <ShieldCheck size={10} color="#0052e0" /> },
    { label: "SERVICE USAGE", top: '45px', right: '20px', icon: <FileText size={10} color="#16a34a" /> },
    { label: "USER RESPONSIBILITIES", bottom: '150px', left: '0px', icon: <User size={10} color="#ea580c" /> },
    { label: "DATA PROTECTION", bottom: '160px', right: '0px', icon: <Lock size={10} color="#8b5cf6" /> },
    { label: "LEGAL COMPLIANCE", bottom: '90px', right: '40px', icon: <Scale size={10} color="#4f46e5" /> }
  ] : isDisclaimer ? [
    { label: "MARKET RISK", top: '40px', left: '40px', icon: <TrendingUp size={10} color="#ea580c" /> },
    { label: "NOT ADVICE", top: '45px', right: '20px', icon: <Scale size={10} color="#0052e0" /> },
    { label: "USER RESPONSIBILITY", bottom: '150px', left: '0px', icon: <User size={10} color="#16a34a" /> },
    { label: "NO GUARANTEES", bottom: '160px', right: '0px', icon: <ShieldCheck size={10} color="#ef4444" /> }
  ] : [
    { label: "PRIVACY PROTECTION", top: '40px', left: '40px', icon: <Lock size={10} color="#0052e0" /> },
    { label: "DATA SECURITY", top: '45px', right: '20px', icon: <FileText size={10} color="#16a34a" /> },
    { label: "USER RIGHTS", bottom: '150px', left: '0px', icon: <User size={10} color="#ea580c" /> },
    { label: "LEGAL COMPLIANCE", bottom: '160px', right: '0px', icon: <Scale size={10} color="#4f46e5" /> }
  ];

  const bottomBannerItems = isDisclaimer ? [
    { icon: <ShieldCheck size={28} />, title: "No Investment Advice", desc: "Growffi does not provide investment, financial, or portfolio advice." },
    { icon: <TrendingUp size={28} />, title: "Risk of Loss", desc: "You may lose part or all of your capital. Trade only with risk capital." },
    { icon: <User size={28} />, title: "Your Decisions", desc: "All decisions, actions and trades are entirely your own responsibility." },
    { icon: <Scale size={28} />, title: "Technology Only", desc: "We provide tools and technology. Execution depends on you and your broker." },
    { icon: <FileText size={28} />, title: "Read Carefully", desc: "Please read this disclaimer carefully before using our platform." }
  ] : isTerms ? [
    { icon: <ShieldCheck size={28} />, title: "Clear & Transparent", desc: "Our terms are written in simple language for complete clarity and transparency." },
    { icon: <FileText size={28} />, title: "Defined Rights & Rules", desc: "Understand what you can expect and what is expected from you." },
    { icon: <Lock size={28} />, title: "Secure & Reliable", desc: "We ensure a safe, secure and trustworthy platform for every user." },
    { icon: <Scale size={28} />, title: "Legal & Compliant", desc: "We operate in compliance with applicable laws and regulations." }
  ] : [
    { icon: <ShieldCheck size={28} />, title: "Privacy Focused", desc: "We protect your personal information and ensure data privacy." },
    { icon: <FileText size={28} />, title: "Transparent Policies", desc: "Clear and easy to understand policies with no hidden terms." },
    { icon: <Lock size={28} />, title: "Secure Platform", desc: "Industry-standard security measures to keep your data safe." },
    { icon: <ShieldCheck size={28} />, title: "Your Trust Matters", desc: "We follow ethical practices to build long-term trust and reliability." }
  ];

  const clipboardTitle = isDisclaimer ? "Disclaimer" : isTerms ? "Terms & Conditions" : "Policies";

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

      {/* ═══ BEAUTIFUL POLICY PAGE HERO BANNER ═══ */}
      <section style={{
        background: 'linear-gradient(135deg, #f0f7ff 0%, #e0efff 100%)',
        padding: '80px 24px 60px',
        borderBottom: '1px solid #d0e4ff',
        overflow: 'hidden',
        position: 'relative'
      }} className="policy-hero-section">
        {/* Subtle grid lines background overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(#1E88FF 0.8px, transparent 0.8px)',
          backgroundSize: '24px 24px',
          opacity: 0.15,
          pointerEvents: 'none'
        }} />

        {/* Floating Candlestick Background Decorations */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0.08
        }}>
          {/* Candle 1 (Green) */}
          <div style={{ position: 'absolute', left: '8%', top: '20%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '2px', height: '100px', background: '#22c55e' }} />
            <div style={{ width: '12px', height: '50px', background: '#22c55e', borderRadius: '2px', position: 'absolute', top: '25px' }} />
          </div>
          {/* Candle 2 (Red) */}
          <div style={{ position: 'absolute', left: '22%', top: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '2px', height: '90px', background: '#ef4444' }} />
            <div style={{ width: '12px', height: '40px', background: '#ef4444', borderRadius: '2px', position: 'absolute', top: '20px' }} />
          </div>
          {/* Candle 3 (Green) */}
          <div style={{ position: 'absolute', left: '42%', top: '10%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '2px', height: '120px', background: '#22c55e' }} />
            <div style={{ width: '12px', height: '70px', background: '#22c55e', borderRadius: '2px', position: 'absolute', top: '20px' }} />
          </div>
          {/* Candle 4 (Red) */}
          <div style={{ position: 'absolute', left: '58%', top: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '2px', height: '80px', background: '#ef4444' }} />
            <div style={{ width: '12px', height: '35px', background: '#ef4444', borderRadius: '2px', position: 'absolute', top: '15px' }} />
          </div>
          {/* Candle 5 (Green) */}
          <div style={{ position: 'absolute', left: '76%', top: '25%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '2px', height: '110px', background: '#22c55e' }} />
            <div style={{ width: '12px', height: '60px', background: '#22c55e', borderRadius: '2px', position: 'absolute', top: '25px' }} />
          </div>
          {/* Candle 6 (Red) */}
          <div style={{ position: 'absolute', left: '90%', top: '15%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '2px', height: '100px', background: '#ef4444' }} />
            <div style={{ width: '12px', height: '45px', background: '#ef4444', borderRadius: '2px', position: 'absolute', top: '30px' }} />
          </div>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '48px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2
        }} className="policy-hero-grid">
          
          {/* Left Column: Heading and Taglines */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: '#ffffff',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#0052e0',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              marginBottom: '28px',
              border: '1px solid rgba(0, 82, 224, 0.1)'
            }}>
              <Shield size={12} fill="#0052e0" style={{ opacity: 0.2 }} /> {tagLabel}
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-1.5px',
              lineHeight: 1.15,
              marginBottom: '20px'
            }}>
              {mainHeading}
            </h1>

            <p style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#475569',
              maxWidth: '520px',
              marginBottom: '32px'
            }}>
              {subHeadingText}
            </p>

            {/* 4 small badges */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px 24px',
              maxWidth: '540px'
            }}>
              {headerBadges.map((badge, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155'
                }}>
                  <div style={{
                    color: badge.color,
                    display: 'flex',
                    alignItems: 'center'
                  }}>{badge.icon}</div>
                  <span>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Visual illustration mockup */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '380px'
          }} className="policy-visual-column">
            
            {/* Background glowing circles */}
            <div style={{
              position: 'absolute',
              width: '320px',
              height: '320px',
              background: 'radial-gradient(circle, rgba(30,136,255,0.15) 0%, rgba(30,136,255,0) 70%)',
              pointerEvents: 'none'
            }} />

            {/* Simulated Clipboard Component */}
            <div style={{
              width: '260px',
              background: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0, 82, 224, 0.08)',
              border: '1px solid rgba(0, 82, 224, 0.1)',
              padding: '30px 24px 24px',
              position: 'relative',
              zIndex: 3,
              transform: 'rotate(-2deg)'
            }} className="simulated-clipboard">
              
              {/* Clipboard top header pin */}
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '90px',
                height: '24px',
                background: '#e2e8f0',
                borderRadius: '8px 8px 12px 12px',
                border: '1px solid #cbd5e1',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#64748b' }} />
              </div>

              {/* Document Title inside clipboard */}
              <div style={{
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                borderBottom: '2px solid #f1f5f9',
                paddingBottom: '16px',
                marginBottom: '20px'
              }}>
                {clipboardTitle}
              </div>

              {/* List Checklist items inside clipboard */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {clipboardItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: '1.5px solid #0052e0',
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0052e0',
                      flexShrink: 0,
                      marginTop: '2px'
                    }}>
                      <Check size={8} strokeWidth={3} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{item.title}</div>
                      <div style={{ fontSize: '8px', color: '#64748b', lineHeight: 1.2 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shield and Lock Floating elements */}
            <div style={{
              position: 'absolute',
              bottom: '40px',
              right: '20px',
              background: '#0052e0',
              color: '#ffffff',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0, 82, 224, 0.3)',
              border: '2px solid #ffffff',
              zIndex: 4,
              transform: 'scale(1.1)'
            }}>
              <Shield size={28} />
            </div>

            <div style={{
              position: 'absolute',
              bottom: '90px',
              left: '20px',
              background: '#ffffff',
              color: '#0052e0',
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(0, 82, 224, 0.15)',
              border: '1.5px solid rgba(0, 82, 224, 0.1)',
              zIndex: 4,
              transform: 'rotate(10deg)'
            }}>
              <Lock size={22} fill="rgba(0, 82, 224, 0.1)" />
            </div>

            {/* Floating text badges */}
            {floatingLabels.map((badge, index) => (
              <div key={index} style={{
                position: 'absolute',
                top: badge.top || 'auto',
                bottom: badge.bottom || 'auto',
                left: badge.left || 'auto',
                right: badge.right || 'auto',
                background: '#ffffff',
                border: '1px solid rgba(0, 82, 224, 0.1)',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 800,
                color: '#334155',
                boxShadow: '0 4px 12px rgba(0, 82, 224, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                zIndex: 4
              }}>
                {badge.icon} {badge.label}
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* ═══ BOTTOM DARK BLUE BANNER ═══ */}
      <section style={{
        background: '#091b3e',
        color: '#ffffff',
        padding: '36px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px 32px'
        }} className="policy-bottom-grid">
          {bottomBannerItems.map((item, index) => (
            <div key={index} style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
              borderRight: index < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
              paddingRight: '20px'
            }} className="policy-bottom-item">
              <div style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px', color: '#ffffff' }}>{item.title}</h4>
                <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Content */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: 'clamp(24px, 5vw, 48px) clamp(16px, 4vw, 24px) 80px',
      }}>

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

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 991px) {
          .policy-hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .policy-visual-column { height: auto !important; min-height: 380px; }
        }
        @media (max-width: 768px) {
          .policy-bottom-item { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; padding-right: 0 !important; }
          .policy-bottom-item:last-child { border-bottom: none !important; padding-bottom: 0; }
        }
      `}}></style>

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
