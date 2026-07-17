'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Footer from '../../shared/components/views/Footer';
import { Menu, X, Check, ArrowRight, User, Mail, Phone, Activity, Settings, TrendingUp, Zap, Shield, BarChart2 } from 'lucide-react';

interface Stock {
  symbol: string;
  ltp: number;
  change: number;
  high: number;
  low: number;
  volume: string;
}

export default function AlgoTradingPage() {
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Consultation Modal States
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationName, setConsultationName] = useState('');
  const [consultationEmail, setConsultationEmail] = useState('');
  const [consultationPhone, setConsultationPhone] = useState('');
  const [consultationMessage, setConsultationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
          enquiry: 'Algo Trading Page',
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
      {/* Stock Ticker Bar */}
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
        <div className="navbar-inner" style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px'
        }}>
          <Link href="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '800', color: '#0052e0', textDecoration: 'none' }}>
            {brandLogo ? (
              <img src={brandLogo} alt={brandName} style={{ height: '32px', objectFit: 'contain' }} />
            ) : (
              <Activity size={24} color="#0052e0" />
            )}
            {brandName.toUpperCase()}
          </Link>

          <div className="navbar-nav" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href="/" style={{ color: '#475569', textDecoration: 'none', fontWeight: '500', fontSize: '15px' }}>Home</Link>
            <Link href="/products" style={{ color: '#475569', textDecoration: 'none', fontWeight: '500', fontSize: '15px' }}>Products</Link>
            <Link href="/pricing" style={{ color: '#475569', textDecoration: 'none', fontWeight: '500', fontSize: '15px' }}>Pricing</Link>
            <Link href="/about" style={{ color: '#475569', textDecoration: 'none', fontWeight: '500', fontSize: '15px' }}>About Us</Link>
            <button onClick={() => setShowConsultationModal(true)} style={{
              background: '#0052e0',
              color: '#ffffff',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>Get Started →</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
        padding: '80px 24px 60px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span style={{
            background: 'rgba(30, 136, 255, 0.1)',
            color: '#1E88FF',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Automated Execution Middleware
          </span>
          <h1 style={{
            fontSize: '44px',
            fontWeight: 850,
            lineHeight: 1.15,
            color: '#0f172a',
            marginTop: '20px',
            marginBottom: '20px',
            letterSpacing: '-1px'
          }}>
            Supercharge Your Intraday Trading With <span style={{ color: '#1E88FF' }}>Algo Automation</span>
          </h1>
          <p style={{
            fontSize: '18px',
            lineHeight: 1.6,
            color: '#475569',
            marginBottom: '32px'
          }}>
            Connect your custom trading strategies directly to India's top stock brokers. Realize split-second order execution, robust risk management, and emotionless trade placements.
          </p>
          <button onClick={() => setShowConsultationModal(true)} style={{
            background: '#1E88FF',
            color: '#ffffff',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(30, 136, 255, 0.3)',
            transition: 'all 0.2s'
          }}>
            Configure Algo Setup
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 800, marginBottom: '40px' }}>Features Built For Professional Traders</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {/* Feature 1 */}
          <div style={{ padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <Zap size={32} color="#1E88FF" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Ultra-Low Latency Execution</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>Direct API pipe connection ensures order triggers are sent to terminals in milliseconds, eliminating manual entry delays.</p>
          </div>
          {/* Feature 2 */}
          <div style={{ padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <Shield size={32} color="#1E88FF" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Risk Management (RMS)</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>Set strict daily limits, trailing stop losses, and target points. Protect your capital automatically with zero human bias.</p>
          </div>
          {/* Feature 3 */}
          <div style={{ padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <Settings size={32} color="#1E88FF" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>Multi-User Terminal Support</h3>
            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>Deploy a single master strategy and copy execution seamlessly across multiple sub-broker accounts instantly.</p>
          </div>
        </div>
      </section>

      {/* Interactive Walkthrough Section */}
      <section style={{ background: '#f8fafc', padding: '80px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>Simple Deployment Workflow</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ background: '#1E88FF', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</span>
                <div>
                  <h4 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Sign in to Client Portal</h4>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>Log in to access your secure execution panel dashboard.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ background: '#1E88FF', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</span>
                <div>
                  <h4 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Link Broker API Credentials</h4>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>Integrate Zerodha Kite or other active broker keys with AES-256 encryption security.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ background: '#1E88FF', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</span>
                <div>
                  <h4 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>Enable Automated Execution</h4>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>Turn on algo toggles to let systems route signals seamlessly.</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Request Demo Consultation</h3>
            {submitSuccess ? (
              <div style={{ background: '#f0fdf4', color: '#15803d', padding: '16px', borderRadius: '8px', fontWeight: 500, fontSize: '14px' }}>
                ✓ Enquiry submitted successfully! Our technical team will call you shortly.
              </div>
            ) : (
              <form onSubmit={handleConsultationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>FULL NAME</label>
                  <input type="text" required value={consultationName} onChange={e => setConsultationName(e.target.value)} placeholder="Enter your name" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>WHATSAPP NUMBER</label>
                  <input type="tel" required value={consultationPhone} onChange={e => setConsultationPhone(e.target.value)} placeholder="Enter 10-digit number" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>EMAIL ADDRESS</label>
                  <input type="email" required value={consultationEmail} onChange={e => setConsultationEmail(e.target.value)} placeholder="name@domain.com" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>MESSAGE (OPTIONAL)</label>
                  <textarea value={consultationMessage} onChange={e => setConsultationMessage(e.target.value)} placeholder="Tell us about your strategy requirements" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', height: '80px', resize: 'none' }}></textarea>
                </div>
                {submitError && <div style={{ color: '#ef4444', fontSize: '13px' }}>{submitError}</div>}
                <button type="submit" disabled={isSubmitting} style={{ background: '#1E88FF', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
                  {isSubmitting ? 'Submitting...' : 'Request Callback'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Global Consultation Modal */}
      {showConsultationModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', maxWidth: '480px', width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden'
          }}>
            <button onClick={() => { setShowConsultationModal(false); setSubmitSuccess(false); }} style={{
              position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer'
            }}>
              <X size={20} color="#64748b" />
            </button>
            <div style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px', color: '#0f172a' }}>Request Algo Setup</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Fill in details to sync configuration parameters.</p>
              {submitSuccess ? (
                <div style={{ background: '#f0fdf4', color: '#15803d', padding: '20px', borderRadius: '8px', fontWeight: 500 }}>
                  ✓ Request submitted successfully! Our expert support team will contact you.
                </div>
              ) : (
                <form onSubmit={handleConsultationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', letterSpacing: '0.5px' }}>YOUR NAME</label>
                    <input type="text" required value={consultationName} onChange={e => setConsultationName(e.target.value)} placeholder="Full Name" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', letterSpacing: '0.5px' }}>WHATSAPP NUMBER</label>
                    <input type="tel" required value={consultationPhone} onChange={e => setConsultationPhone(e.target.value)} placeholder="10-Digit Mobile" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', letterSpacing: '0.5px' }}>EMAIL ADDRESS</label>
                    <input type="email" required value={consultationEmail} onChange={e => setConsultationEmail(e.target.value)} placeholder="name@company.com" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px', letterSpacing: '0.5px' }}>MESSAGE</label>
                    <textarea value={consultationMessage} onChange={e => setConsultationMessage(e.target.value)} placeholder="Brief strategy details..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', height: '80px', resize: 'none' }}></textarea>
                  </div>
                  {submitError && <div style={{ color: '#ef4444', fontSize: '13px' }}>{submitError}</div>}
                  <button type="submit" disabled={isSubmitting} style={{ background: '#1E88FF', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(30,136,255,0.2)' }}>
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
