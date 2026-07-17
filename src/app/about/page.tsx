'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Footer from '../../shared/components/views/Footer';
import { Menu, X, Check, ArrowRight, User, Mail, Phone, Activity, ChevronDown, MessageSquare, ShieldCheck, Lock, Upload, PauseCircle, Headphones, HelpCircle } from 'lucide-react';

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

  // Consultation Modal States
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationName, setConsultationName] = useState('');
  const [consultationEmail, setConsultationEmail] = useState('');
  const [consultationPhone, setConsultationPhone] = useState('');
  const [consultationEnquiry, setConsultationEnquiry] = useState('Scanner');
  const [consultationMessage, setConsultationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    const handleOpenModal = () => setShowConsultationModal(true);
    window.addEventListener('open-consultation-modal', handleOpenModal);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-consultation-modal', handleOpenModal);
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
            <button onClick={() => setShowConsultationModal(true)} className="btn-nav" style={{ border: 'none', cursor: 'pointer' }}>Get Started →</button>
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
            <button className="mobile-nav-cta" onClick={() => { setShowConsultationModal(true); setMobileMenuOpen(false); }} style={{ border: 'none', textAlign: 'center', width: '100%', cursor: 'pointer' }}>Get Started →</button>
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





        {/* Trust Badges Bar */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          marginBottom: '48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }} className="about-trust-badges">
          
          {/* Badge 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRight: '1px solid #f1f5f9', paddingRight: '16px' }} className="trust-badge-item">
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(30, 136, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E88FF', flexShrink: 0 }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>7-Day Money Back</h4>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>Not satisfied? Get a full refund within 7 days.</p>
            </div>
          </div>

          {/* Badge 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRight: '1px solid #f1f5f9', paddingRight: '16px' }} className="trust-badge-item">
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(30, 136, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E88FF', flexShrink: 0 }}>
              <Lock size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>No Hidden Charges</h4>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>Transparent pricing. No extra cost.</p>
            </div>
          </div>

          {/* Badge 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRight: '1px solid #f1f5f9', paddingRight: '16px' }} className="trust-badge-item">
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(30, 136, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E88FF', flexShrink: 0 }}>
              <Upload size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Upgrade Anytime</h4>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>Change or upgrade your plan anytime.</p>
            </div>
          </div>

          {/* Badge 4 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRight: '1px solid #f1f5f9', paddingRight: '16px' }} className="trust-badge-item">
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', flexShrink: 0 }}>
              <PauseCircle size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Pause or Cancel</h4>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>Pause or cancel your plan whenever you want.</p>
            </div>
          </div>

          {/* Badge 5 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="trust-badge-item no-border">
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(30, 136, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E88FF', flexShrink: 0 }}>
              <Headphones size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Priority Support</h4>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>Dedicated support for all our members.</p>
            </div>
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
          .trust-badge-item { border-right: none !important; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
          .trust-badge-item:last-child { border-bottom: none !important; padding-bottom: 0; }
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
    </div>
  );
}
