'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '../../shared/components/views/Footer';
import { Menu, X, Check, ArrowRight, ShieldCheck, Zap, Cpu, Award, Users, RefreshCw, User, Mail, Phone, Activity, ChevronDown, MessageSquare, Play, Settings, BarChart, HelpCircle } from 'lucide-react';

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

  // Consultation Modal States
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationName, setConsultationName] = useState('');
  const [consultationEmail, setConsultationEmail] = useState('');
  const [consultationPhone, setConsultationPhone] = useState('');
  const [consultationEnquiry, setConsultationEnquiry] = useState('Scanner');
  const [consultationMessage, setConsultationMessage] = useState('');
  const [activeProductTab, setActiveProductTab] = useState<'scanner' | 'algo'>('scanner');
  useEffect(() => {
    const handleScroll = () => {
      const scannerEl = document.getElementById('scanner-details');
      const algoEl = document.getElementById('algo-details');
      if (!scannerEl || !algoEl) return;

      const scannerRect = scannerEl.getBoundingClientRect();
      const algoRect = algoEl.getBoundingClientRect();

      // Calculate how much of each element is visible in the viewport
      const scannerVisibleHeight = Math.max(0, Math.min(window.innerHeight, scannerRect.bottom) - Math.max(0, scannerRect.top));
      const algoVisibleHeight = Math.max(0, Math.min(window.innerHeight, algoRect.bottom) - Math.max(0, algoRect.top));

      if (algoVisibleHeight > scannerVisibleHeight) {
        setActiveProductTab('algo');
      } else {
        setActiveProductTab('scanner');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once to initialize
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string, tab: 'scanner' | 'algo') => {
    setActiveProductTab(tab);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [supportPhone, setSupportPhone] = useState('+91 902666305');
  const [supportWhatsapp, setSupportWhatsapp] = useState('+91 902666305');

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: consultationName,
          email: consultationEmail,
          phone: consultationPhone,
          enquiry: consultationEnquiry,
          message: consultationMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(true);
        setConsultationName('');
        setConsultationEmail('');
        setConsultationPhone('');
        setConsultationMessage('');
      } else {
        setSubmitError(data.error || 'Failed to submit request.');
      }
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
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
        if (data.success) {
          const appName = data.appName || 'Growffiy';
          const appLogo = data.appLogo || '';
          setBrandName(appName);
          setBrandLogo(appLogo);
          localStorage.setItem('growffiy_brand_name', appName);
          localStorage.setItem('growffiy_brand_logo', appLogo);
          if (data.supportPhone) setSupportPhone(data.supportPhone);
          if (data.supportWhatsapp) setSupportWhatsapp(data.supportWhatsapp);
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

    const handleOpenModal = () => setShowConsultationModal(true);
    window.addEventListener('open-consultation-modal', handleOpenModal);

    return () => {
      window.removeEventListener('branding-updated', load);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-consultation-modal', handleOpenModal);
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
            <button onClick={() => setShowConsultationModal(true)} className="btn-nav" style={{ border: 'none', cursor: 'pointer' }}>Get Started →</button>
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
            <button className="mobile-nav-cta" onClick={() => { setShowConsultationModal(true); setMobileMenuOpen(false); }} style={{ border: 'none', textAlign: 'center', width: '100%', cursor: 'pointer' }}>
              Get Started →
            </button>
          </div>
        )}
      </nav>

      {/* ═══ HERO — Light Premium Split Layout ═══ */}
      <section className="products-hero-section" style={{
        background: 'radial-gradient(circle at 80% 20%, rgba(30, 136, 255, 0.06) 0%, rgba(255, 255, 255, 1) 100%)',
        padding: '80px 24px',
        overflow: 'hidden',
        position: 'relative',
        borderBottom: '1px solid rgba(30, 136, 255, 0.05)'
      }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '10%', right: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(30, 136, 255, 0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Faded Candlesticks Background decoration */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          {/* Group left */}
          <div style={{ position: 'absolute', left: '4%', top: '20%', width: '12px', height: '80px', opacity: 0.04 }}>
            <div style={{ position: 'absolute', left: '5px', top: 0, width: '2px', height: '80px', background: '#22c55e' }} />
            <div style={{ position: 'absolute', left: 0, top: '20px', width: '12px', height: '40px', background: '#22c55e', borderRadius: '2px' }} />
          </div>
          <div style={{ position: 'absolute', left: '6%', top: '45%', width: '12px', height: '90px', opacity: 0.04 }}>
            <div style={{ position: 'absolute', left: '5px', top: 0, width: '2px', height: '90px', background: '#ef4444' }} />
            <div style={{ position: 'absolute', left: 0, top: '25px', width: '12px', height: '45px', background: '#ef4444', borderRadius: '2px' }} />
          </div>
          <div style={{ position: 'absolute', left: '8%', top: '15%', width: '12px', height: '70px', opacity: 0.03 }}>
            <div style={{ position: 'absolute', left: '5px', top: 0, width: '2px', height: '70px', background: '#22c55e' }} />
            <div style={{ position: 'absolute', left: 0, top: '15px', width: '12px', height: '35px', background: '#22c55e', borderRadius: '2px' }} />
          </div>

          {/* Group middle */}
          <div style={{ position: 'absolute', left: '44%', top: '12%', width: '14px', height: '110px', opacity: 0.05 }}>
            <div style={{ position: 'absolute', left: '6px', top: 0, width: '2px', height: '110px', background: '#22c55e' }} />
            <div style={{ position: 'absolute', left: 0, top: '30px', width: '14px', height: '55px', background: '#22c55e', borderRadius: '2px' }} />
          </div>
          <div style={{ position: 'absolute', left: '46%', top: '32%', width: '14px', height: '90px', opacity: 0.05 }}>
            <div style={{ position: 'absolute', left: '6px', top: 0, width: '2px', height: '90px', background: '#ef4444' }} />
            <div style={{ position: 'absolute', left: 0, top: '20px', width: '14px', height: '40px', background: '#ef4444', borderRadius: '2px' }} />
          </div>
          <div style={{ position: 'absolute', left: '48%', top: '22%', width: '14px', height: '100px', opacity: 0.05 }}>
            <div style={{ position: 'absolute', left: '6px', top: 0, width: '2px', height: '100px', background: '#22c55e' }} />
            <div style={{ position: 'absolute', left: 0, top: '25px', width: '14px', height: '50px', background: '#22c55e', borderRadius: '2px' }} />
          </div>

          {/* Group right */}
          <div style={{ position: 'absolute', right: '6%', top: '50%', width: '12px', height: '90px', opacity: 0.04 }}>
            <div style={{ position: 'absolute', left: '5px', top: 0, width: '2px', height: '90px', background: '#22c55e' }} />
            <div style={{ position: 'absolute', left: 0, top: '20px', width: '12px', height: '50px', background: '#22c55e', borderRadius: '2px' }} />
          </div>
          <div style={{ position: 'absolute', right: '8%', top: '35%', width: '12px', height: '70px', opacity: 0.04 }}>
            <div style={{ position: 'absolute', left: '5px', top: 0, width: '2px', height: '70px', background: '#ef4444' }} />
            <div style={{ position: 'absolute', left: 0, top: '15px', width: '12px', height: '40px', background: '#ef4444', borderRadius: '2px' }} />
          </div>
        </div>

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
          <div className="hero-card-left" style={{ paddingBottom: '20px' }}>
            <h1 style={{
              fontSize: 'clamp(36px, 4.5vw, 54px)',
              fontWeight: 850,
              color: '#0f172a',
              lineHeight: 1.12,
              letterSpacing: '-1.5px',
              marginBottom: '22px',
            }}>
              Smarter Tools.<br />
              Stronger Trades.<br />
              <span style={{ color: '#0052e0' }}>Better Growth.</span>
            </h1>

            <p style={{
              fontSize: '16px', color: '#475569', lineHeight: 1.75,
              maxWidth: '460px', marginBottom: '36px',
            }}>
              Powerful trading tools built for traders who want an edge in every market.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a href="#scanner" style={{
                background: '#0052e0',
                color: '#ffffff',
                padding: '12px 26px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '15px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 82, 224, 0.25)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#0a42b0'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#0052e0'}
              >
                Explore Products <ArrowRight size={16} />
              </a>


            </div>
          </div>

          {/* ── Right: Product Cards ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '20px', alignSelf: 'start',
          }} className="product-cards-grid">

            {/* Card 1 — Scanner */}
            <Link
              href="/scanner"
              className="product-card-hover-group"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%)',
                border: '1px solid rgba(0, 82, 224, 0.08)',
                borderRadius: '24px',
                padding: '28px 24px 20px',
                minHeight: '430px',
                display: 'flex', flexDirection: 'column',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0, 82, 224, 0.04)',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 22px 45px rgba(0, 82, 224, 0.08)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 82, 224, 0.04)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = '';
              }}
            >
              <span style={{
                fontSize: '9px', fontWeight: 800, color: '#0052e0',
                background: 'rgba(0,82,224,0.06)', border: '1px solid rgba(0,82,224,0.15)',
                padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.8px',
                display: 'inline-block', marginBottom: '14px', width: 'fit-content',
              }}>PRODUCT 1</span>
              
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', lineHeight: 1.35, marginBottom: '10px' }}>
                INTRADAY LIVE<br />NIFTY 500 SCANNER
              </h3>
              
              <div style={{ width: '28px', height: '2px', background: '#0052e0', borderRadius: '2px', marginBottom: '12px' }} />
              
              <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.6, marginBottom: '14px' }}>
                Real-time scanner that helps traders find the best stocks for intraday trades from Nifty 500.
              </p>

              <div style={{
                color: '#0052e0',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '10px'
              }}>
                View Scanner <ArrowRight size={14} />
              </div>
              
              <div style={{
                marginTop: 'auto',
                width: '100%',
                height: '170px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1px solid rgba(0, 82, 224, 0.04)',
                boxShadow: '0 8px 20px rgba(0, 82, 224, 0.02)'
              }}>
                <img
                  src="/scanner_illustration.png"
                  alt="Scanner"
                  style={{
                    width: '90%',
                    height: '90%',
                    objectFit: 'contain',
                    transition: 'transform 0.4s ease'
                  }}
                />
              </div>
            </Link>

            {/* Card 2 — Algo */}
            <Link
              href="/algo-trading"
              className="product-card-hover-group"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #f5f9ff 100%)',
                border: '1px solid rgba(0, 82, 224, 0.08)',
                borderRadius: '24px',
                padding: '28px 24px 20px',
                minHeight: '430px',
                display: 'flex', flexDirection: 'column',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0, 82, 224, 0.04)',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 22px 45px rgba(0, 82, 224, 0.08)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 82, 224, 0.04)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = '';
              }}
            >
              <span style={{
                fontSize: '9px', fontWeight: 800, color: '#0052e0',
                background: 'rgba(0,82,224,0.06)', border: '1px solid rgba(0,82,224,0.15)',
                padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.8px',
                display: 'inline-block', marginBottom: '14px', width: 'fit-content',
              }}>PRODUCT 2</span>
              
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', lineHeight: 1.35, marginBottom: '10px' }}>
                ALGO TRADING &amp;<br />INTRADAY LIVE<br />NIFTY 500 SCANNER
              </h3>
              
              <div style={{ width: '28px', height: '2px', background: '#0052e0', borderRadius: '2px', marginBottom: '12px' }} />
              
              <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.6, marginBottom: '14px' }}>
                Automated algo trading with real-time scanner insights to execute smarter and faster.
              </p>

              <div style={{
                color: '#0052e0',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '10px'
              }}>
                View Algo <ArrowRight size={14} />
              </div>
              
              <div style={{
                marginTop: 'auto',
                width: '100%',
                height: '170px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1px solid rgba(0, 82, 224, 0.04)',
                boxShadow: '0 8px 20px rgba(0, 82, 224, 0.02)'
              }}>
                <img
                  src="/algo_illustration.png"
                  alt="Algo"
                  style={{
                    width: '90%',
                    height: '90%',
                    objectFit: 'contain',
                    transition: 'transform 0.4s ease'
                  }}
                />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ DETAIL SECTIONS WITH TOGGLE SWITCH ═══ */}
      <section id="details" className="products-section" style={{
        padding: '80px 24px',
        background: '#ffffff',
        borderTop: '1px solid #f1f5f9',
        borderBottom: '1px solid #f1f5f9',
        position: 'relative'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '48px',
          alignItems: 'start'
        }} className="product-details-layout">
          
          {/* Left Column: Vertical tabs switch */}
          <div style={{
            background: 'transparent',
            padding: '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'sticky',
            top: '100px'
          }} className="vertical-switch-container">
            <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '0 12px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>Products</h4>
            
            <button
              onClick={() => scrollToSection('scanner-details', 'scanner')}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                background: activeProductTab === 'scanner' ? 'rgba(0, 82, 224, 0.06)' : 'transparent',
                borderLeft: activeProductTab === 'scanner' ? '4px solid #0052e0' : '4px solid transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '12px',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: activeProductTab === 'scanner' ? '#0052e0' : 'rgba(0, 82, 224, 0.04)',
                color: activeProductTab === 'scanner' ? '#ffffff' : '#0052e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Activity size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: activeProductTab === 'scanner' ? '#0052e0' : '#0f172a' }}>Nifty 500 Scanner</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Real-time momentum scanning</div>
              </div>
            </button>
            
            <button
              onClick={() => scrollToSection('algo-details', 'algo')}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                background: activeProductTab === 'algo' ? 'rgba(0, 82, 224, 0.06)' : 'transparent',
                borderLeft: activeProductTab === 'algo' ? '4px solid #0052e0' : '4px solid transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '12px',
                textAlign: 'left',
                width: '100%'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: activeProductTab === 'algo' ? '#0052e0' : 'rgba(0, 82, 224, 0.04)',
                color: activeProductTab === 'algo' ? '#ffffff' : '#0052e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Cpu size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: activeProductTab === 'algo' ? '#0052e0' : '#0f172a' }}>Algo Trading Tools</div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Automate trading strategies</div>
              </div>
            </button>
          </div>

          {/* Right Column: Tab Content Area */}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '100px' }}>
            
            {/* Section 1: Scanner Details */}
            <div id="scanner-details" style={{ scrollMarginTop: '120px' }}>
              <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E88FF', letterSpacing: '1px' }}>FIND THE BEST INTRADAY TRADES</span>
                <h2 className="products-section-heading" style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginTop: '6px', letterSpacing: '-0.5px' }}>Growffi Scanner</h2>
                <p style={{ fontSize: '15px', color: '#475569', marginTop: '12px', lineHeight: 1.6, maxWidth: '800px' }}>
                  The Intraday Live Nifty 500 Scanner continuously scans all Nifty 500 stocks throughout the trading session and identifies stocks that match powerful intraday trading conditions. Instead of manually analyzing hundreds of charts, our scanner instantly highlights the strongest opportunities based on predefined technical filters.
                </p>



                <h4 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a', marginTop: '36px', marginBottom: '16px' }}>Key Scan Features</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px 24px', maxWidth: '900px' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px', marginTop: '40px', borderTop: '1px solid #f1f5f9', paddingTop: '30px', maxWidth: '900px' }}>
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

                <div style={{ marginTop: '32px' }}>
                  <Link
                    href="/scanner"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#0052e0',
                      color: '#ffffff',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(0, 82, 224, 0.15)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#0041b3';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#0052e0';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    View Live Scanner <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Visual separating line */}
            <div style={{ height: '1px', background: '#f1f5f9', width: '100%' }} />

            {/* Section 2: Algo Details */}
            <div id="algo-details" style={{ scrollMarginTop: '120px' }}>
              <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E88FF', letterSpacing: '1px' }}>COMPLETE STRATEGY AUTOMATION</span>
                <h2 className="products-section-heading" style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', marginTop: '6px', letterSpacing: '-0.5px' }}>Growffi Algo Trading Tools</h2>
                <p style={{ fontSize: '15px', color: '#475569', marginTop: '12px', lineHeight: 1.6, maxWidth: '800px' }}>
                  Our Algo Trading Tools help traders automate their trading strategies with speed, precision, and discipline. Once configured, the system continuously monitors live market hours and executes trades automatically based on your predefined rules.
                </p>



                <h4 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0f172a', marginTop: '36px', marginBottom: '16px' }}>Key Algo Features</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px 24px', maxWidth: '900px' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px', marginTop: '40px', borderTop: '1px solid #f1f5f9', paddingTop: '30px', maxWidth: '900px' }}>
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

                <div style={{ marginTop: '32px' }}>
                  <Link
                    href="/algo-trading"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: '#0052e0',
                      color: '#ffffff',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px rgba(0, 82, 224, 0.15)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#0041b3';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#0052e0';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    View Algo Trading <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
            
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
      {/* Footer component */}
      <Footer />

      {/* Consultation Modal */}
      {showConsultationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setShowConsultationModal(false)}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            padding: '32px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            animation: 'faqFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Close Button */}
            <button 
              onClick={() => setShowConsultationModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#f1f5f9',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Get Free Consultation!</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', marginBottom: 0 }}>Transform your trading experience with our automated strategies.</p>
            </div>

            {/* Features (Checks) */}
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#10b981', flexShrink: 0, justifyContent: 'center' }}>
                  <Check size={11} strokeWidth={3} />
                </div>
                Free Project Analysis
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#10b981', flexShrink: 0, justifyContent: 'center' }}>
                  <Check size={11} strokeWidth={3} />
                </div>
                24/7 Expert Support
              </div>
            </div>

            {submitSuccess ? (
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.08)', 
                border: '1px solid rgba(16, 185, 129, 0.2)', 
                borderRadius: '12px', 
                padding: '24px', 
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                alignItems: 'center'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                  <Check size={24} strokeWidth={3} />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#065f46', margin: 0 }}>Request Submitted!</h4>
                <p style={{ fontSize: '13px', color: '#047857', margin: 0 }}>Our team will reach out to you shortly.</p>
                <button 
                  onClick={() => setSubmitSuccess(false)}
                  style={{
                    marginTop: '16px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleConsultationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {submitError && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#b91c1c', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' }}>
                    {submitError}
                  </div>
                )}

                {/* Name */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={consultationName}
                    onChange={(e) => setConsultationName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 44px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      color: '#0f172a',
                      background: '#f8fafc',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.border = '1px solid #1E88FF'; e.currentTarget.style.background = '#ffffff'; }}
                    onBlur={(e) => { e.currentTarget.style.border = '1px solid #e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  />
                </div>

                {/* Email */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Your Email"
                    value={consultationEmail}
                    onChange={(e) => setConsultationEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 44px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      color: '#0f172a',
                      background: '#f8fafc',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.border = '1px solid #1E88FF'; e.currentTarget.style.background = '#ffffff'; }}
                    onBlur={(e) => { e.currentTarget.style.border = '1px solid #e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  />
                </div>

                {/* Mobile */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Your Mobile"
                    value={consultationPhone}
                    onChange={(e) => setConsultationPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 44px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      color: '#0f172a',
                      background: '#f8fafc',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => { e.currentTarget.style.border = '1px solid #1E88FF'; e.currentTarget.style.background = '#ffffff'; }}
                    onBlur={(e) => { e.currentTarget.style.border = '1px solid #e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  />
                </div>



                {/* Enquiry Type Dropdown */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <HelpCircle size={16} />
                  </div>
                  <select
                    value={consultationEnquiry}
                    onChange={(e) => setConsultationEnquiry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 44px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      color: '#0f172a',
                      background: '#f8fafc',
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => { e.currentTarget.style.border = '1px solid #1E88FF'; e.currentTarget.style.background = '#ffffff'; }}
                    onBlur={(e) => { e.currentTarget.style.border = '1px solid #e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <option value="Scanner">Scanner</option>
                    <option value="Algo Trading">Algo Trading</option>
                  </select>
                  {/* Custom dropdown arrow */}
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>

                {/* Message */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '16px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                    <MessageSquare size={16} />
                  </div>
                  <textarea
                    placeholder="Your Message"
                    value={consultationMessage}
                    onChange={(e) => setConsultationMessage(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 44px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      color: '#0f172a',
                      background: '#f8fafc',
                      outline: 'none',
                      resize: 'none',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => { e.currentTarget.style.border = '1px solid #1E88FF'; e.currentTarget.style.background = '#ffffff'; }}
                    onBlur={(e) => { e.currentTarget.style.border = '1px solid #e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: '#1E88FF',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(30, 136, 255, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.background = '#0A53BE'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(10, 83, 190, 0.4)'; } }}
                  onMouseLeave={(e) => { if (!isSubmitting) { e.currentTarget.style.background = '#1E88FF'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(30, 136, 255, 0.3)'; } }}
                >
                  {isSubmitting ? 'Submitting...' : 'Get Free Consultation'} <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e2e8f0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Or connect directly</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            {/* Quick Contact Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <a 
                href={`tel:${supportPhone.replace(/[\s\(\)\-+]/g, '')}`} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0f172a'; e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#ffffff'; }}
              >
                <Phone size={14} /> Call Now
              </a>
              <a 
                href={`https://wa.me/${supportWhatsapp.replace(/[\s\(\)\-+]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '13px',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#10b981'; e.currentTarget.style.background = '#f0fdf4'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#ffffff'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 2.016 14.12 1.01 11.516 1.01c-5.44 0-9.866 4.372-9.87 9.802 0 1.689.451 3.337 1.309 4.793L1.99 21.019l5.656-1.865zm10.985-7.79c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg> WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>
        <button onClick={() => setShowConsultationModal(true)}>Open Modal</button>
      </div>
    </div>
  );
}
