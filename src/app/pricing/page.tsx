'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '../../shared/components/views/Footer';
import { Menu, X, Check, ArrowRight, ShieldCheck, Zap, Cpu, Award, Users, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';
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
  const [stocks, setStocks] = useState<Stock[]>([
    { symbol: 'RELIANCE', ltp: 2420.50, change: 1.25, high: 2435.00, low: 2410.00, volume: '4.8M' },
    { symbol: 'TCS', ltp: 3250.10, change: -0.45, high: 3280.00, low: 3240.00, volume: '1.2M' },
    { symbol: 'INFY', ltp: 1510.80, change: 0.85, high: 1525.00, low: 1502.00, volume: '2.5M' },
    { symbol: 'HDFCBANK', ltp: 1620.30, change: -1.10, high: 1640.00, low: 1615.00, volume: '3.1M' },
    { symbol: 'ICICIBANK', ltp: 940.75, change: 0.35, high: 950.00, low: 935.00, volume: '1.8M' },
  ]);

  const [dbPlans, setDbPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

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

    const fetchPlans = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.PLANS, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.plans) {
          setDbPlans(data.plans.filter((p: any) => p.status === 'active'));
        }
      } catch (err) {
        console.error('Failed to fetch subscription plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();

    return () => {
      window.removeEventListener('branding-updated', load);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const isUp = (change: number) => change >= 0;

  // Filter plans based on Billing Period toggle
  const getFilteredPlans = () => {
    // If we have explicit monthly/yearly plans, filter them.
    // If not, we just show whatever active plans exist.
    const hasYearly = dbPlans.some(p => p.name.toLowerCase().includes('yearly') || p.name.toLowerCase().includes('annual') || p.durationDays >= 300);
    if (!hasYearly) return dbPlans; // Fallback to all plans if no yearly plans defined in admin yet

    if (billingPeriod === 'monthly') {
      return dbPlans.filter(p => !p.name.toLowerCase().includes('yearly') && !p.name.toLowerCase().includes('annual') && p.durationDays < 300);
    } else {
      return dbPlans.filter(p => p.name.toLowerCase().includes('yearly') || p.name.toLowerCase().includes('annual') || p.durationDays >= 300);
    }
  };

  // Get static features to make it look premium like the mock image
  const getPremiumFeatures = (planName: string, fallbackFeatures: string[]) => {
    const name = planName.toLowerCase();
    if (name.includes('basic')) {
      return [
        "Live Market Scanners",
        "Daily Watchlist Access",
        "Basic Filters Configuration",
        "Email Notifications",
        "Community Chat Room",
        "1 Active Login Session"
      ];
    } else if (name.includes('pro')) {
      return [
        "All Basic Features Included",
        "Advanced Live Scanners",
        "Strategy Builder & Testing",
        "Real-Time Alerts Dispatch",
        "Backtesting Suite (Limited)",
        "2 Active Login Sessions",
        "Priority Support Channel"
      ];
    } else if (name.includes('premium')) {
      return [
        "All Pro Features Included",
        "Advanced Algo Automation Tools",
        "Backtesting Suite (Unlimited)",
        "Auto Trade (1 Strategy)",
        "AI Bots Live Access",
        "Risk Management Controls",
        "Performance Live Analytics",
        "3 Active Login Sessions",
        "24/7 Premium Support"
      ];
    } else if (name.includes('enterprise')) {
      return [
        "All Premium Features Included",
        "Auto Trade Execution (Unlimited)",
        "AI Bots Access (Unlimited) [NEW]",
        "Custom Automated Strategies",
        "Dedicated Account Manager",
        "API Programmatic Access [NEW]",
        "5 Active Login Sessions",
        "24/7 Instant Support Dispatch"
      ];
    }
    return fallbackFeatures;
  };

  const getSubtext = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic')) return "Perfect for Beginners";
    if (name.includes('pro')) return "For Active Traders";
    if (name.includes('premium')) return "For Serious Traders";
    if (name.includes('enterprise')) return "For Professionals & Teams";
    return "Complete Strategy Access";
  };

  const getCardIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('basic')) return <Zap size={22} color="#1E88FF" />;
    if (name.includes('pro')) return <Cpu size={22} color="#16a34a" />;
    if (name.includes('premium')) return <Award size={22} color="#0D47A1" />;
    return <Sparkles size={22} color="#8b5cf6" />;
  };

  const filtered = getFilteredPlans();

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

      {/* Main Header / Badges */}
      <section style={{
        padding: '70px 24px 30px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Trust Badges flanking the Hero */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            border: '1px solid #e2e8f0',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
          }}>
            <ShieldCheck size={16} color="#1E88FF" />
            <span><strong>Risk Free</strong>: 7-Day Refund Guarantee</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            border: '1px solid #e2e8f0',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
          }}>
            <Zap size={16} color="#22c55e" />
            <span><strong>Save More</strong>: With Yearly Subscriptions</span>
          </div>
        </div>

        <h1 style={{
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
          Select the perfect plan that fits your trading goals and take your strategies to the next level. Toggle billing cycles below.
        </p>

        {/* Toggle Switch */}
        <div style={{
          display: 'inline-flex',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '30px',
          padding: '4px',
          gap: '4px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
        }}>
          <button
            onClick={() => setBillingPeriod('monthly')}
            style={{
              border: 'none',
              borderRadius: '24px',
              padding: '8px 24px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: billingPeriod === 'monthly' ? '#1E88FF' : 'transparent',
              color: billingPeriod === 'monthly' ? 'white' : '#475569',
              transition: 'all 0.25s'
            }}
          >Monthly Plans</button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            style={{
              border: 'none',
              borderRadius: '24px',
              padding: '8px 24px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: billingPeriod === 'yearly' ? '#1E88FF' : 'transparent',
              color: billingPeriod === 'yearly' ? 'white' : '#475569',
              transition: 'all 0.25s'
            }}
          >Yearly (Save 20%)</button>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section style={{
        padding: '0 24px 80px',
        maxWidth: '1280px',
        margin: '0 auto'
      }}>
        {loadingPlans ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gap: '10px', color: '#64748b' }}>
            <RefreshCw className="animate-spin" size={20} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Loading subscription tiers...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <HelpCircle size={32} color="#64748b" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>No Plans Available</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Please configure subscription plans in the Admin panel settings tab.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
            gap: '30px',
            alignItems: 'stretch'
          }}>
            {filtered.map((plan) => {
              const isPopular = plan.name.toLowerCase().includes('premium') || plan.name.toLowerCase().includes('popular');
              const premiumFeatures = getPremiumFeatures(plan.name, plan.features);
              return (
                <div key={plan.id} style={{
                  background: 'white',
                  borderRadius: '20px',
                  border: isPopular ? '2px solid #1E88FF' : '1px solid #e2e8f0',
                  boxShadow: isPopular ? '0 10px 30px rgba(30,136,255,0.12)' : '0 4px 12px rgba(0,0,0,0.02)',
                  padding: '36px 30px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transform: isPopular ? 'scale(1.02)' : 'none',
                  transition: 'all 0.25s',
                  zIndex: isPopular ? 2 : 1
                }} className="pricing-card">
                  {isPopular && (
                    <span style={{
                      position: 'absolute',
                      top: '-14px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #1E88FF 0%, #0D47A1 100%)',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 16px',
                      borderRadius: '20px',
                      boxShadow: '0 4px 10px rgba(30,136,255,0.2)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}>★ Most Popular</span>
                  )}

                  {/* Header info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: isPopular ? 'rgba(30,136,255,0.08)' : 'rgba(0,0,0,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getCardIcon(plan.name)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{plan.name.split(' ')[0]}</h3>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>{getSubtext(plan.name)}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ margin: '24px 0 28px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>₹{Number(plan.price).toLocaleString('en-IN')}</span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}> / {plan.durationDays} Days</span>
                  </div>

                  {/* Features checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginBottom: '32px' }}>
                    {premiumFeatures.map((feat, index) => {
                      const isBoldBlue = feat.includes("Auto Trade (1 Strategy)");
                      return (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          fontSize: '13px',
                          color: isBoldBlue ? '#1E88FF' : '#334155',
                          fontWeight: isBoldBlue ? 700 : 500
                        }}>
                          <Check size={16} color={isPopular ? "#1E88FF" : "#16a34a"} style={{ marginTop: 2, flexShrink: 0 }} />
                          <span>
                            {feat}
                            {feat.includes("[NEW]") && (
                              <span style={{ marginLeft: '6px', fontSize: '9px', fontWeight: 800, background: '#8b5cf6', color: 'white', padding: '1px 5px', borderRadius: '4px' }}>NEW</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Button */}
                  <Link href={`/login?redirect=purchase&planId=${plan.id}`} style={{
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '14px',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    border: isPopular ? 'none' : '1.5px solid #cbd5e1',
                    background: isPopular ? 'linear-gradient(135deg, #1E88FF 0%, #0D47A1 100%)' : 'white',
                    color: isPopular ? 'white' : '#475569',
                    boxShadow: isPopular ? '0 6px 15px rgba(30,136,255,0.2)' : 'none',
                    transition: 'all 0.2s',
                  }}>Get Started</Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust Grid Panel */}
      <section style={{
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        padding: '60px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '30px'
        }} className="trust-grid">
          {[
            { icon: <ShieldCheck size={26} color="#1E88FF" />, title: "7-Day Money Back", desc: "Not satisfied? Get a full refund within 7 days." },
            { icon: <Award size={26} color="#22c55e" />, title: "No Hidden Charges", desc: "Transparent pricing. No extra hidden cost." },
            { icon: <Cpu size={26} color="#8b5cf6" />, title: "Upgrade Anytime", desc: "Change or upgrade your plan anytime dynamically." },
            { icon: <RefreshCw size={26} color="#f59e0b" />, title: "Pause or Cancel", desc: "Pause or cancel your plan whenever you want." },
            { icon: <Users size={26} color="#0f172a" />, title: "Priority Support", desc: "Dedicated support for all registered members." }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ marginBottom: '4px' }}>{item.icon}</div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{item.title}</h4>
              <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA: View Yearly Plans Promo */}
      <section style={{
        padding: '50px 24px',
        background: '#f8fafc',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '750px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px 32px',
          flexWrap: 'wrap',
          gap: '20px'
        }} className="promo-bar">
          <div style={{ textAlign: 'left' }} className="text-center">
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Save More with Yearly Plans</h4>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Get up to 20% OFF on all yearly subscription structures.</p>
          </div>
          <button
            onClick={() => setBillingPeriod('yearly')}
            style={{
              border: 'none',
              background: '#1E88FF',
              color: 'white',
              fontWeight: 700,
              fontSize: '13px',
              padding: '10px 22px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            View Yearly Plans <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Styled Grid Adaptations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .pricing-card {
            transform: none !important;
          }
          .promo-bar {
            flex-direction: column !important;
            text-align: center !important;
          }
          .promo-bar div {
            text-align: center !important;
          }
        }
      ` }} />

      {/* Footer component */}
      <Footer />
    </div>
  );
}
