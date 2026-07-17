'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '../../shared/components/views/Footer';
import { Menu, X, Check, ArrowRight, ShieldCheck, Zap, Cpu, Award, Users, RefreshCw, Sparkles, HelpCircle, User, Mail, Phone, Activity, ChevronDown, MessageSquare } from 'lucide-react';
import { API_ENDPOINTS } from '../../core/constants';

interface Stock {
  symbol: string;
  ltp: number;
  change: number;
  high: number;
  low: number;
  volume: string;
}

interface Plan {
  id: string;
  name: string;
  price: number | string;
  durationDays: number;
  features: string[];
  status: string;
}

export default function PricingPage() {
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

  const [dbPlans, setDbPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activePlanTab, setActivePlanTab] = useState<string>('');

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

    const fetchPlans = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.PLANS, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.plans) {
          const activePlans = data.plans.filter((p: any) => p.status === 'active');
          if (activePlans.length > 0) {
            activePlans.sort((a: any, b: any) => Number(a.price) - Number(b.price));
            const mapped = activePlans.map((p: any) => {
              const typeMatch = p.name.match(/^(.+?)\s*(monthly|quarterly|yearly|daily|annual|half|weekly)/i);
              const productType = typeMatch ? typeMatch[1].trim() : p.name.split(' ')[0];
              return {
                id: p.id,
                tag: p.name.toLowerCase().includes('monthly') ? 'Standard Access' : p.name.toLowerCase().includes('quarterly') ? 'Most Popular' : 'Best Value',
                name: p.name,
                price: p.price,
                per: `${p.durationDays} Days`,
                popular: p.name.toLowerCase().includes('quarterly') || p.name.toLowerCase().includes('popular'),
                features: p.features,
                productType,
                durationDays: p.durationDays
              };
            });
            setDbPlans(mapped);
            const firstType = mapped[0]?.productType || '';
            setActivePlanTab(firstType);
          } else {
            setDbPlans([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch subscription plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();

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
            <Link href="/products" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Products</Link>
            <Link href="/pricing" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`} style={{ color: '#1E88FF', fontWeight: 600 }}>Pricing</Link>
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

      {/* Main Header / Badges */}
      <section className="pricing-header-section" style={{
        padding: '70px 24px 30px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative'
      }}>

        <h1 className="pricing-plan-heading" style={{
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 900,
          color: '#0f172a',
          letterSpacing: '-1px',
          lineHeight: 1.15
        }}>
          Simple Plans. Powerful Tools. <br />
          <span style={{
            background: 'linear-gradient(135deg, #1E88FF 0%, #0D47A1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Choose Your Plan and Start Growing.</span>
        </h1>
        <p style={{
          fontSize: 'clamp(14px, 2vw, 16px)',
          color: '#475569',
          maxWidth: '650px',
          margin: '16px auto 36px',
          lineHeight: 1.5,
        }}>
          No hidden fees. Cancel anytime. All plans include full platform access.
        </p>

        {/* Tab Buttons from Home Page */}
        {!loadingPlans && dbPlans.length > 0 && (() => {
          const productTypes = [...new Set(dbPlans.map((p: any) => p.productType))];
          return (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 8,
              marginTop: 20, flexWrap: 'wrap',
            }}>
              {productTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setActivePlanTab(type)}
                  style={{
                    padding: '10px 28px',
                    borderRadius: 99,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                    border: activePlanTab === type ? 'none' : '1.5px solid #e2e8f0',
                    background: activePlanTab === type
                      ? 'linear-gradient(135deg, #1252AB, #1E88FF)'
                      : '#ffffff',
                    color: activePlanTab === type ? '#ffffff' : '#64748b',
                    boxShadow: activePlanTab === type
                      ? '0 6px 20px rgba(18,82,171,0.25)'
                      : '0 1px 4px rgba(0,0,0,0.06)',
                    transform: activePlanTab === type ? 'translateY(-1px)' : 'none',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          );
        })()}
      </section>

      {/* Pricing Cards Grid from Home Page */}
      <section className="pricing-cards-section" style={{
        padding: '0 24px 80px',
        maxWidth: '1280px',
        margin: '0 auto'
      }}>
        {loadingPlans ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gap: '10px', color: '#64748b' }}>
            <RefreshCw className="animate-spin" size={20} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Loading subscription tiers...</span>
          </div>
        ) : dbPlans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <HelpCircle size={32} color="#64748b" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>No Plans Available</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Please configure subscription plans in the Admin panel settings tab.</p>
          </div>
        ) : (() => {
          const filteredPlans = dbPlans.filter((p: any) => p.productType === activePlanTab);
          return (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '24px',
                marginTop: '12px',
                alignItems: 'stretch'
              }}>
                {filteredPlans.map(plan => (
                  <div
                    key={plan.name}
                    className={`pricing-card${plan.popular ? ' popular' : ''}`}
                    style={{ flex: '1 1 300px', maxWidth: '360px', minWidth: '260px' }}
                  >
                    {plan.popular && <div className="popular-badge">Most Popular</div>}
                    <div className="pricing-tag">{plan.tag}</div>
                    <div className="pricing-name">{plan.name}</div>
                    <div className="pricing-amount">
                      <span className="pricing-currency">₹</span>
                      <span className="pricing-price">{Number(plan.price).toLocaleString()}</span>
                      <span className="pricing-per">/ {plan.per}</span>
                    </div>
                    <ul className="pricing-features">
                      {plan.features.map((f: string) => (
                        <li key={f} className="pricing-feature-item">
                          <div className="check-icon"><Check size={11} /></div>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={`/login?redirect=purchase&planId=${plan.id}`} style={{ display: 'block' }}>
                      <button style={{
                        width: '100%', padding: '13px', borderRadius: 99, fontWeight: 700,
                        fontSize: 14, cursor: 'pointer', transition: 'all 0.3s',
                        background: plan.popular ? 'linear-gradient(135deg, #1252AB, #1E88FF)' : 'white',
                        color: plan.popular ? 'white' : '#334155',
                        boxShadow: plan.popular ? '0 6px 20px rgba(18,82,171,0.25)' : 'none',
                        border: plan.popular ? 'none' : '1.5px solid #e2e8f0',
                      }}>
                        Get Started →
                      </button>
                    </Link>
                  </div>
                ))}
              </div>

            </>
          );
        })()}
      </section>





      {/* Styled Grid Adaptations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .pricing-header-section { padding: 40px 16px 24px !important; }
          .pricing-cards-section { padding: 0 16px 48px !important; }
          .pricing-trust-section { padding: 40px 16px !important; }
          .pricing-cta-section { padding: 32px 16px !important; }
          .pricing-card {
            transform: none !important;
            padding: 28px 20px !important;
          }
          .pricing-plan-heading { font-size: 24px !important; letter-spacing: -0.5px !important; }
          .promo-bar {
            flex-direction: column !important;
            text-align: center !important;
          }
          .promo-bar div {
            text-align: center !important;
          }
        }
        @media (max-width: 480px) {
          .pricing-header-section { padding: 28px 12px 20px !important; }
          .pricing-cards-section { padding: 0 12px 36px !important; }
          .pricing-trust-section { padding: 28px 12px !important; }
          .pricing-cta-section { padding: 24px 12px !important; }
          .pricing-card { padding: 22px 16px !important; }
          .pricing-plan-heading { font-size: 20px !important; }
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
    </div>
  );
}
