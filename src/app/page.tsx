'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PerformanceChart } from '../shared/components/views/PerformanceChart';
import Footer from '../shared/components/views/Footer';
import {
  Activity, ShieldCheck, Zap, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Menu, X,
  BarChart2, Lock, Bell, Target, Cpu,
  Check, Phone, Mail, MapPin, User, MessageSquare, HelpCircle
} from 'lucide-react';
import { API_ENDPOINTS } from '../core/constants';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Stock {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  chgAmt?: number;
  high: number;
  low: number;
  volume: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GrowffiyLanding() {
  // Live stock state
  const [stocks, setStocks] = useState<Stock[]>([
    { symbol: 'RELIANCE',   name: 'Reliance Industries', ltp: 2432.85, change: 2.35, chgAmt: 55.80, high: 2450.00, low: 2410.00, volume: '2.5M' },
    { symbol: 'TCS',        name: 'Tata Consultancy',    ltp: 3850.00, change: 1.20, chgAmt: 45.60, high: 3890.00, low: 3820.00, volume: '800K' },
    { symbol: 'INFY',       name: 'Infosys Ltd.',        ltp: 1580.00, change: 0.85, chgAmt: 13.30, high: 1595.00, low: 1565.00, volume: '1.2M' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors',         ltp: 945.20, change: -1.85, chgAmt: -17.80, high: 965.00, low: 938.00, volume: '3.1M' },
    { symbol: 'HDFCBANK',   name: 'HDFC Bank',           ltp: 1678.60, change: 1.98, chgAmt: 32.60, high: 1690.00, low: 1660.00, volume: '2.8M' },
    { symbol: 'ICICIBANK',  name: 'ICICI Bank',          ltp: 1152.30, change: 1.72, chgAmt: 19.50, high: 1165.00, low: 1140.00, volume: '2.1M' },
    { symbol: 'NIFTY50',    name: 'Nifty 50',            ltp: 24334.30, change: 1.09, chgAmt: 261.55, high: 24367.30, low: 24099.05, volume: '-' },
    { symbol: 'BANKNIFTY',  name: 'Bank Nifty',          ltp: 58521.40, change: 1.63, chgAmt: 939.15, high: 58596.85, low: 57542.15, volume: '-' },
    { symbol: 'INDIAVIX',   name: 'India VIX',           ltp: 12.45, change: -2.20, chgAmt: -0.28, high: 13.10, low: 12.05, volume: '-' },
    { symbol: 'WIPRO',      name: 'Wipro Ltd.',          ltp: 486.75, change: -1.32, chgAmt: -6.50, high: 495.00, low: 482.00, volume: '1.5M' },
    { symbol: 'SBIN',       name: 'State Bank of India', ltp: 1044.30, change: 1.27, chgAmt: 13.10, high: 1048.00, low: 1028.30, volume: '8.5M' },
  ]);

  const [heroData, setHeroData] = useState<number[]>([
    2410, 2418, 2415, 2425, 2432, 2428, 2436, 2441, 2439, 2447, 2443, 2450, 2450
  ]);
  const [heroLabels, setHeroLabels] = useState<string[]>([
    '9:15', '9:20', '9:25', '9:30', '9:35', '9:40', '9:45', '9:50', '9:55', '10:00', '10:05', '10:10', '10:15'
  ]);

  const [pnl, setPnl] = useState(645230);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');
  const [heroTitle, setHeroTitle] = useState('Automate Your<br /><span class="text-gradient">Stock Market</span><br />Trades Smarter');
  const [heroSubtitle, setHeroSubtitle] = useState('Growffiy connects to your Zerodha Kite API and executes pre-open momentum breakout strategies with strict 1% risk management — fully automated.');

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
        // Clear fields
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

  // Scroll detection for transparent navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Branding
  useEffect(() => {
    const fetchPublicSettings = () => {
      // First load from localStorage for instant display
      setBrandLogo(localStorage.getItem('growffiy_brand_logo') || '');
      setBrandName(localStorage.getItem('growffiy_brand_name') || 'Growffiy');
      setHeroTitle(localStorage.getItem('growffiy_hero_title') || 'Automate Your<br /><span class="text-gradient">Stock Market</span><br />Trades Smarter');
      setHeroSubtitle(localStorage.getItem('growffiy_hero_subtitle') || 'Growffiy connects to your Zerodha Kite API and executes pre-open momentum breakout strategies with strict 1% risk management — fully automated.');

      // Then fetch from server to get latest changes
      fetch('/api/settings/public', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            if (data.appName) {
              setBrandName(data.appName);
              localStorage.setItem('growffiy_brand_name', data.appName);
            }
            if (data.appLogo !== undefined) {
              setBrandLogo(data.appLogo);
              localStorage.setItem('growffiy_brand_logo', data.appLogo);
            }
            if (data.heroTitle) {
              setHeroTitle(data.heroTitle);
              localStorage.setItem('growffiy_hero_title', data.heroTitle);
            }
            if (data.heroSubtitle) {
              setHeroSubtitle(data.heroSubtitle);
              localStorage.setItem('growffiy_hero_subtitle', data.heroSubtitle);
            }
            if (data.supportPhone) {
              setSupportPhone(data.supportPhone);
            }
            if (data.supportWhatsapp) {
              setSupportWhatsapp(data.supportWhatsapp);
            }
          }
        })
        .catch(err => console.error('Failed to fetch public settings on landing page:', err));
    };

    fetchPublicSettings();
    const handleOpenModal = () => setShowConsultationModal(true);
    window.addEventListener('branding-updated', fetchPublicSettings);
    window.addEventListener('open-consultation-modal', handleOpenModal);
    return () => {
      window.removeEventListener('branding-updated', fetchPublicSettings);
      window.removeEventListener('open-consultation-modal', handleOpenModal);
    };
  }, []);

  // ─── Real stock data from Yahoo Finance (via /api/public/stocks) ─────────────
  const fetchRealStocks = async () => {
    try {
      const res = await fetch('/api/public/stocks', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.stocks?.length > 0) {
        setStocks(prev => {
          return prev.map(oldStock => {
            const match = data.stocks.find((s: any) => s.symbol === oldStock.symbol);
            if (match) {
              return {
                ...oldStock,
                ltp: match.ltp,
                change: match.change,
                chgAmt: match.chgAmt ?? oldStock.chgAmt,
                high: match.high || oldStock.high,
                low: match.low || oldStock.low,
                volume: match.volume || oldStock.volume
              };
            }
            return oldStock;
          });
        });
        // Update hero chart with RELIANCE real price
        const reliance = data.stocks.find((s: Stock) => s.symbol === 'RELIANCE');
        if (reliance && reliance.ltp > 0) {
          setHeroData(p => [...p.slice(1), reliance.ltp]);
          setHeroLabels(p => {
            const t = new Date();
            const label = `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
            return [...p.slice(1), label];
          });
        }
      }
    } catch (e) {
      // Silent fail — keep showing last known prices
    }
  };

  useEffect(() => {
    fetchRealStocks(); // Initial load
    const apiIv = setInterval(fetchRealStocks, 10000); // Poll API every 10s

    // Simulating sub-second micro-ticks every 2 seconds to make it look active/live
    const liveIv = setInterval(() => {
      setStocks(prevStocks => {
        return prevStocks.map(s => {
          const isVix = s.symbol === 'INDIAVIX';
          const changePercent = (Math.random() - 0.5) * (isVix ? 0.004 : 0.0008);
          const priceDiff = s.ltp * changePercent;
          const newLtp = parseFloat((s.ltp + priceDiff).toFixed(2));
          const newChgAmt = s.chgAmt !== undefined ? parseFloat((s.chgAmt + priceDiff).toFixed(2)) : priceDiff;
          const prevClose = s.ltp - (s.chgAmt || 0);
          const newChange = prevClose !== 0 ? parseFloat(((newLtp - prevClose) / prevClose * 100).toFixed(2)) : s.change;
          return {
            ...s,
            ltp: newLtp,
            chgAmt: newChgAmt,
            change: newChange
          };
        });
      });
    }, 2000);

    // P&L still animates for visual effect
    const pnlIv = setInterval(() => setPnl(p => p + Math.floor((Math.random() - 0.4) * 300)), 3000);
    return () => { clearInterval(apiIv); clearInterval(liveIv); clearInterval(pnlIv); };
  }, []);

  // ─── Data ─────────────────────────────────────────────────────────────────
  const features = [
    { icon: <Cpu size={22} />, cls: 'feature-icon-blue', title: 'Pre-Open Scan Engine', desc: 'Scans entire Nifty 200 at 09:08 AM. Identifies maximum gap-down candidates with momentum potential.' },
    { icon: <ShieldCheck size={22} />, cls: 'feature-icon-green', title: '1% Capital Risk Guard', desc: 'Auto-calculates position sizing so every trade risks exactly 1% of your allocated capital.' },
    { icon: <Zap size={22} />, cls: 'feature-icon-purple', title: 'MIS Bracket Execution', desc: 'Intraday MIS orders with automatic bracket target + stop-loss submitted instantly to Zerodha.' },
    { icon: <Bell size={22} />, cls: 'feature-icon-orange', title: 'Telegram Trade Alerts', desc: 'Real-time buy/sell entry and exit alerts delivered to your Telegram channel the moment orders fire.' },
    { icon: <BarChart2 size={22} />, cls: 'feature-icon-cyan', title: 'Live Performance Board', desc: 'Track live P&L, win rate, trades executed, and portfolio exposure in your client dashboard.' },
    { icon: <Lock size={22} />, cls: 'feature-icon-rose', title: 'Emergency Kill Switch', desc: 'One-click kill switch immediately cancels all pending orders and halts the trading engine.' },
  ];

  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [activePlanTab, setActivePlanTab] = useState<string>('');

  useEffect(() => {
    fetch(API_ENDPOINTS.PLANS, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.plans) {
          const activePlans = data.plans.filter((p: any) => p.status === 'active');
          if (activePlans.length > 0) {
            // Sort by price ascending
            activePlans.sort((a: any, b: any) => Number(a.price) - Number(b.price));
            const mapped = activePlans.map((p: any) => {
              // Extract product type: everything before Monthly/Quarterly/Yearly/Daily
              const typeMatch = p.name.match(/^(.+?)\s*(monthly|quarterly|yearly|daily|annual|half|weekly)/i);
              const productType = typeMatch ? typeMatch[1].trim() : p.name.split(' ')[0];
              return {
                tag: p.name.toLowerCase().includes('monthly') ? 'Standard Access' : p.name.toLowerCase().includes('quarterly') ? 'Most Popular' : 'Best Value',
                name: p.name,
                price: p.price,
                per: `${p.durationDays} Days`,
                popular: p.name.toLowerCase().includes('quarterly') || p.name.toLowerCase().includes('popular'),
                features: p.features,
                productType,
              };
            });
            setPlans(mapped);
            // Set first product type as default tab
            const firstType = mapped[0]?.productType || '';
            setActivePlanTab(firstType);
          } else {
            setPlans([]);
          }
        }
      })
      .catch(err => console.error('Failed to fetch subscription plans on landing page:', err))
      .finally(() => setPlansLoading(false));
  }, []);

  const [faqs, setFaqs] = useState<{ q: string, a: string }[]>([]);

  useEffect(() => {
    fetch('/api/settings/legal', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.legal_faq_content) {
          try {
            const parsed = JSON.parse(data.settings.legal_faq_content);
            if (Array.isArray(parsed)) {
              setFaqs(parsed);
            }
          } catch {}
        }
      })
      .catch((err) => console.error('Failed to fetch legal settings on landing page:', err));
  }, []);

  const isUp = (change: number) => change >= 0;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div data-theme="light" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-body)' }}>

      {/* ════════════════════════════════════════
          LIVE STOCK TICKER STRIP
      ════════════════════════════════════════ */}
      <div style={{
        background: '#0f172a',
        color: '#fff',
        padding: '7px 0',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        position: 'relative',
        zIndex: 1001,
        borderBottom: '1px solid #1e293b',
      }}>
        <style>{`
          @keyframes ticker-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .ticker-track {
            display: inline-flex;
            animation: ticker-scroll 30s linear infinite;
          }
          .ticker-track:hover { animation-play-state: paused; }
        `}</style>
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


      {/* ════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled || mobileMenuOpen
          ? 'rgba(255,255,255,0.97)'
          : 'rgba(255,255,255,0)',
        backdropFilter: scrolled || mobileMenuOpen ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled || mobileMenuOpen ? 'blur(20px)' : 'none',
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
            <Link href="/" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`} style={{ color: '#1E88FF', fontWeight: 600 }}>Home</Link>
            <Link href="/products" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Products</Link>
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

      {/* ════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero-bg-grid" />
        <div className="hero-blob-1" />
        <div className="hero-blob-2" />

        <div className="hero-inner">
          {/* LEFT */}
          <div className="hero-left">

            <h1 className="hero-h1" style={{
              fontFamily: 'var(--font-title)',
              fontSize: 'clamp(34px, 5vw, 48px)',
              fontWeight: '900',
              lineHeight: '1.15',
              letterSpacing: '-1.5px',
              color: '#0f172a',
              textTransform: 'uppercase',
              marginBottom: '12px'
            }} dangerouslySetInnerHTML={{ __html: heroTitle }} />

            <p className="hero-sub" style={{
              fontSize: 'clamp(15px, 2vw, 17px)',
              lineHeight: '1.45',
              color: '#334155',
              marginBottom: '20px',
              maxWidth: '540px'
            }} dangerouslySetInnerHTML={{ __html: heroSubtitle }} />

            <div className="hero-btns" style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setShowConsultationModal(true)} className="btn-primary" style={{
                background: '#0052e0',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                Start Trading Now <ArrowRight size={14} />
              </button>
              <a href="#strategy" className="btn-secondary" style={{
                background: '#ffffff',
                color: '#0052e0',
                border: '1px solid #93c5fd',
                padding: '10px 20px',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}>
                View Strategy
              </a>
            </div>

            {/* Trust badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', position: 'relative' }}>
                {[
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80',
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80',
                  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&h=100&q=80'
                ].map((src, i) => (
                  <div
                    key={i}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      border: '2px solid #ffffff',
                      overflow: 'hidden',
                      marginLeft: i > 0 ? '-10px' : '0px',
                      zIndex: 5 - i,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <img src={src} alt="User avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', lineHeight: '1.2' }}>
                  <span style={{ color: '#22c55e' }}>100+</span> Traders Trust Our Tools
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginTop: '1px' }}>
                  Built by Traders, For Traders
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="hero-right" style={{ position: 'relative' }}>
            {/* Badge top-right */}
            <div style={{
              position: 'absolute', top: 80, right: -50, zIndex: 10,
              background: 'var(--bg-card)', borderRadius: 16, padding: '14px 18px',
              boxShadow: 'var(--shadow-lg)',
              animation: 'floatCard2 6s ease-in-out infinite',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Today&apos;s P&amp;L</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>+₹{pnl.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>▲ 3.24% today</div>
            </div>

            {/* Badge bottom-left */}
            <div style={{
              position: 'absolute', bottom: 150, left: -50, zIndex: 10,
              background: 'var(--bg-card)', borderRadius: 16, padding: '14px 18px',
              boxShadow: 'var(--shadow-lg)',
              animation: 'floatCard1 5s ease-in-out infinite',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Risk Per Trade</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 20, fontWeight: 800, color: 'var(--text-heading)' }}>1.00%</div>
              <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600, marginTop: 2 }}>Capital Protected</div>
            </div>

            {/* Main Chart Card */}
            <div style={{
              background: 'var(--bg-card)', borderRadius: 24,
              padding: '24px 24px 20px',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: isUp(stocks[0].change)
                  ? 'linear-gradient(90deg,var(--accent),var(--primary))'
                  : 'linear-gradient(90deg,var(--danger),var(--warning))',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-heading)' }}>NSE: RELIANCE</div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 700, color: '#059669',
                      background: 'rgba(34,197,94,0.12)', borderRadius: 99, padding: '2px 8px',
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulseDot 1.5s ease-in-out infinite' }} />
                      LIVE
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>Reliance Industries Ltd.</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1 }}>
                    ₹{stocks[0].ltp.toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, marginTop: 4,
                    color: isUp(stocks[0].change) ? 'var(--accent)' : 'var(--danger)',
                    display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end',
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: isUp(stocks[0].change) ? 'var(--accent)' : 'var(--danger)',
                      display: 'inline-block', animation: 'pulseDot 1.5s ease-in-out infinite',
                    }} />
                    {isUp(stocks[0].change) ? '+' : ''}{stocks[0].change.toFixed(2)}%
                  </div>
                </div>
              </div>

              <PerformanceChart
                data={heroData}
                labels={heroLabels}
                height={200}
                strokeColor={isUp(stocks[0].change) ? '#10b981' : '#ef4444'}
                fillColorStart={isUp(stocks[0].change) ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)'}
                fillColorEnd="rgba(255,255,255,0)"
              />

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid var(--border-light)', paddingTop: 10, marginTop: 6, fontSize: 11,
              }}>
                <span style={{ color: 'var(--text-subtle)' }}>
                  H: <strong style={{ color: 'var(--text-heading)' }}>₹{stocks[0].high}</strong>
                  {'  '}L: <strong style={{ color: 'var(--text-heading)' }}>₹{stocks[0].low}</strong>
                  {'  '}Vol: <strong style={{ color: 'var(--text-heading)' }}>{stocks[0].volume}</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulseDot 1.5s ease-in-out infinite' }} />
                  Live · 2s ticks
                </span>
              </div>
            </div>

            {/* 3 mini quote chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 12 }}>
              {stocks.slice(1, 4).map(s => (
                <div key={s.symbol} style={{
                  background: 'var(--bg-card)', borderRadius: 12, padding: '10px 12px',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-subtle)', marginBottom: 3 }}>{s.symbol}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-heading)' }}>₹{s.ltp.toFixed(0)}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: isUp(s.change) ? 'var(--accent)' : 'var(--danger)', marginTop: 2 }}>
                    {isUp(s.change) ? '▲' : '▼'} {Math.abs(s.change).toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP BELOW HERO CONTENT */}
      <div style={{
        background: '#ffffff',
        padding: '50px 0',
        width: '100%',
        position: 'relative',
        zIndex: 3
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px'
        }}>
          {/* Card 1 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.6)',
            borderRadius: '20px',
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 82, 224, 0.05), 0 8px 10px -6px rgba(0, 82, 224, 0.05)'
          }}>
            <div style={{ color: '#0052e0', background: 'rgba(0, 82, 224, 0.06)', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '800', color: '#0f172a', lineHeight: '1.1' }}>10K+</div>
              <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600', marginTop: '4px' }}>Active Traders</div>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.6)',
            borderRadius: '20px',
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 20px 25px -5px rgba(34, 197, 94, 0.05), 0 8px 10px -6px rgba(34, 197, 94, 0.05)'
          }}>
            <div style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.06)', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '800', color: '#0f172a', lineHeight: '1.1' }}>95%+</div>
              <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600', marginTop: '4px' }}>Strategy Accuracy</div>
            </div>
          </div>

          {/* Card 3 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.6)',
            borderRadius: '20px',
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.05), 0 8px 10px -6px rgba(239, 68, 68, 0.05)'
          }}>
            <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.06)', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="m19 5-5 5"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '800', color: '#0f172a', lineHeight: '1.1' }}>500+</div>
              <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600', marginTop: '4px' }}>Pre-Market Scans</div>
            </div>
          </div>

          {/* Card 4 */}
          <div style={{
            background: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.6)',
            borderRadius: '20px',
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.05), 0 8px 10px -6px rgba(99, 102, 241, 0.05)'
          }}>
            <div style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.06)', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: '18px', fontWeight: '800', color: '#0f172a', lineHeight: '1.1' }}>AI Bots</div>
              <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600', marginTop: '4px' }}>Intelligent Automation</div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          FEATURES SECTION (OUR CORE FEATURES)
      ════════════════════════════════════════ */}
      <section id="features" className="section" style={{ background: '#ffffff', padding: '60px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '28px', fontWeight: '800', color: '#0f172a', position: 'relative', display: 'inline-block' }}>
              Our Core Features
              <div style={{ width: '40px', height: '3px', background: '#0052e0', margin: '8px auto 0', borderRadius: '2px' }} />
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            {/* Feature 1 */}
            <div className="feature-card" style={{
              background: '#ffffff',
              border: '1px solid rgba(226, 232, 240, 0.7)',
              borderRadius: '16px',
              padding: '32px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{ color: '#0052e0', background: 'rgba(0, 82, 224, 0.05)', borderRadius: '50%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/><path d="M3 3v18h18"/><path d="m18 10-6-6-6 6"/></svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '20px 0 8px' }}>Proven Strategies</h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.45', marginBottom: '0px', minHeight: '60px' }}>Step-by-step intraday strategies with high probability setups.</p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card" style={{
              background: '#ffffff',
              border: '1px solid rgba(226, 232, 240, 0.7)',
              borderRadius: '16px',
              padding: '32px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '50%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '20px 0 8px' }}>Live Market Scanners</h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.45', marginBottom: '0px', minHeight: '60px' }}>Real-time scanners to identify breakout, reversal & momentum stocks.</p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card" style={{
              background: '#ffffff',
              border: '1px solid rgba(226, 232, 240, 0.7)',
              borderRadius: '16px',
              padding: '32px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{ color: '#0052e0', background: 'rgba(0, 82, 224, 0.05)', borderRadius: '50%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6v7z"/><path d="M12 7.5 9.5 12h5L12 16.5v-4.5z"/></svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '20px 0 8px' }}>Trade Management</h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.45', marginBottom: '0px', minHeight: '60px' }}>Risk management rules, SL/TP calculators & position sizing tools.</p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card" style={{
              background: '#ffffff',
              border: '1px solid rgba(226, 232, 240, 0.7)',
              borderRadius: '16px',
              padding: '32px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '50%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '20px 0 8px' }}>Community Edge</h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.45', marginBottom: '0px', minHeight: '60px' }}>Exclusive community of serious traders sharing ideas & insights.</p>
            </div>

            {/* Feature 5 */}
            <div className="feature-card" style={{
              background: '#ffffff',
              border: '1px solid rgba(226, 232, 240, 0.7)',
              borderRadius: '16px',
              padding: '32px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: 'none',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}>
              <div style={{ color: '#f97316', background: 'rgba(249, 115, 22, 0.05)', borderRadius: '50%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M6 18.8v-4L2 13v6a1 1 0 0 0 1 1h3Z"/><path d="M21.5 12v6"/></svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '20px 0 8px' }}>Learning Hub</h3>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.45', marginBottom: '0px', minHeight: '60px' }}>Courses, webinars & resources to level up your trading.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          LIVE MARKET OVERVIEW & COMMUNITY
      ════════════════════════════════════════ */}
      <section style={{ background: '#f8fafc', padding: '40px 0 60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px'
          }}>
            {/* Left Column: Live Market Overview */}
            <div style={{
              background: '#ffffff',
              borderRadius: '24px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              padding: '28px',
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                  Live Market Overview
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#22c55e' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  Market Open
                </div>
              </div>

              {/* Index Cards Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {/* Nifty 50 */}
                {(() => {
                  const nifty = stocks.find(s => s.symbol === 'NIFTY50') || { ltp: 22957.15, change: 0.54, chgAmt: 123.45 };
                  const isGreen = nifty.change >= 0;
                  return (
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '16px 12px 0',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>Nifty 50</span>
                      <span style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px' }}>
                        {nifty.ltp > 0 ? nifty.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '22,957.15'}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: isGreen ? '#22c55e' : '#ef4444' }}>
                        {isGreen ? '+' : ''}{nifty.chgAmt ? nifty.chgAmt.toFixed(2) : '123.45'} ({isGreen ? '+' : ''}{nifty.change.toFixed(2)}%)
                      </span>
                      {/* Area sparkline with green/red gradient */}
                      <div style={{ marginTop: '8px', height: '32px', width: '108%', marginLeft: '-4%' }}>
                        <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="nifty-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={isGreen ? '#22c55e' : '#ef4444'} stopOpacity="0.15"/>
                              <stop offset="100%" stopColor={isGreen ? '#22c55e' : '#ef4444'} stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          <path d="M 0 24 C 20 12, 40 22, 60 8 T 100 5 L 100 30 L 0 30 Z" fill="url(#nifty-grad)" />
                          <path d="M 0 24 C 20 12, 40 22, 60 8 T 100 5" fill="none" stroke={isGreen ? '#22c55e' : '#ef4444'} strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  );
                })()}

                {/* Bank Nifty */}
                {(() => {
                  const banknifty = stocks.find(s => s.symbol === 'BANKNIFTY') || { ltp: 48530.25, change: 0.63, chgAmt: 305.75 };
                  const isGreen = banknifty.change >= 0;
                  return (
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '16px 12px 0',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>Bank Nifty</span>
                      <span style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px' }}>
                        {banknifty.ltp > 0 ? banknifty.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '48,530.25'}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: isGreen ? '#22c55e' : '#ef4444' }}>
                        {isGreen ? '+' : ''}{banknifty.chgAmt ? banknifty.chgAmt.toFixed(2) : '305.75'} ({isGreen ? '+' : ''}{banknifty.change.toFixed(2)}%)
                      </span>
                      {/* Area sparkline with green/red gradient */}
                      <div style={{ marginTop: '8px', height: '32px', width: '108%', marginLeft: '-4%' }}>
                        <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="bank-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={isGreen ? '#22c55e' : '#ef4444'} stopOpacity="0.15"/>
                              <stop offset="100%" stopColor={isGreen ? '#22c55e' : '#ef4444'} stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          <path d="M 0 22 C 25 10, 50 25, 75 8 T 100 4 L 100 30 L 0 30 Z" fill="url(#bank-grad)" />
                          <path d="M 0 22 C 25 10, 50 25, 75 8 T 100 4" fill="none" stroke={isGreen ? '#22c55e' : '#ef4444'} strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  );
                })()}

                {/* India Vix */}
                {(() => {
                  const vix = stocks.find(s => s.symbol === 'INDIAVIX') || { ltp: 12.45, change: -2.20, chgAmt: -0.28 };
                  const isGreen = vix.change >= 0;
                  return (
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '16px 12px 0',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>India VIX</span>
                      <span style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '4px 0 2px' }}>
                        {vix.ltp > 0 ? vix.ltp.toFixed(2) : '12.45'}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: isGreen ? '#22c55e' : '#ef4444' }}>
                        {isGreen ? '+' : ''}{vix.chgAmt ? vix.chgAmt.toFixed(2) : '-0.28'} ({isGreen ? '+' : ''}{vix.change.toFixed(2)}%)
                      </span>
                      {/* Area sparkline with green/red gradient */}
                      <div style={{ marginTop: '8px', height: '32px', width: '108%', marginLeft: '-4%' }}>
                        <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="vix-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={isGreen ? '#22c55e' : '#ef4444'} stopOpacity="0.15"/>
                              <stop offset="100%" stopColor={isGreen ? '#22c55e' : '#ef4444'} stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          <path d="M 0 6 C 25 18, 50 8, 75 18 T 100 24 L 100 30 L 0 30 Z" fill="url(#vix-grad)" />
                          <path d="M 0 6 C 25 18, 50 8, 75 18 T 100 24" fill="none" stroke={isGreen ? '#22c55e' : '#ef4444'} strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Gainers & Losers Unified Containers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {/* Top Gainers */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Top Gainers</h4>
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '16px',
                    overflow: 'hidden'
                  }}>
                    {[
                      { symbol: 'RELIANCE', defaultLtp: 2432.85, defaultChange: 2.35, bg: '#0052e0', letter: 'R' },
                      { symbol: 'HDFCBANK', defaultLtp: 1678.60, defaultChange: 1.98, bg: '#1e3a8a', letter: 'H' },
                      { symbol: 'ICICIBANK', defaultLtp: 1152.30, defaultChange: 1.72, bg: '#ea580c', letter: 'I' }
                    ].map((item, idx) => {
                      const st = stocks.find(s => s.symbol === item.symbol) || { ltp: item.defaultLtp, change: item.defaultChange };
                      return (
                        <div key={item.symbol} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 14px',
                          borderBottom: idx < 2 ? '1px solid rgba(226, 232, 240, 0.6)' : 'none',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flexShrink: 1 }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: item.bg, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', marginRight: '10px', flexShrink: 0 }}>
                              {item.letter}
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.symbol}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                              {st.ltp > 0 ? st.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.defaultLtp.toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#22c55e', width: '56px', textAlign: 'right' }}>
                              +{st.change > 0 ? st.change.toFixed(2) : item.defaultChange.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Losers */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>Top Losers</h4>
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '16px',
                    overflow: 'hidden'
                  }}>
                    {[
                      { symbol: 'TATAMOTORS', defaultLtp: 945.20, defaultChange: -1.85, bg: '#ec4899', letter: 'T' },
                      { symbol: 'WIPRO', defaultLtp: 486.75, defaultChange: -1.32, bg: '#06b6d4', letter: 'W' },
                      { symbol: 'SBIN', defaultLtp: 812.40, defaultChange: -1.15, bg: '#1d4ed8', letter: 'S' }
                    ].map((item, idx) => {
                      const st = stocks.find(s => s.symbol === item.symbol) || { ltp: item.defaultLtp, change: item.defaultChange };
                      return (
                        <div key={item.symbol} style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 14px',
                          borderBottom: idx < 2 ? '1px solid rgba(226, 232, 240, 0.6)' : 'none',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flexShrink: 1 }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: item.bg, color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800', marginRight: '10px', flexShrink: 0 }}>
                              {item.letter}
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.symbol}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                              {st.ltp > 0 ? st.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.defaultLtp.toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444', width: '56px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                              {st.change < 0 ? st.change.toFixed(2) : item.defaultChange.toFixed(2)}% <span style={{ fontSize: '12px', fontWeight: '800' }}>↓</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Strategy Performance & Execution Analytics */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: '24px',
              border: '1px solid rgba(51, 65, 85, 0.8)',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              color: '#ffffff',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div>
                <div style={{ display: 'inline-block', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontSize: '11px', fontWeight: '800', padding: '5px 10px', borderRadius: '6px', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '14px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                  ⚡ LIVE EXECUTION ACTIVE
                </div>
                <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '22px', fontWeight: '900', color: '#ffffff', lineHeight: '1.2', marginBottom: '8px' }}>
                  Real-Time Strategy Performance
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px', fontWeight: '500' }}>
                  Automatic execution logs and metrics calculated from active client brokers.
                </p>

                {/* Performance Stats Panel */}
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Today's Net P&L</span>
                      <div style={{ fontSize: '24px', fontWeight: '900', color: '#22c55e', marginTop: '2px', textShadow: '0 0 10px rgba(34, 197, 94, 0.2)' }}>
                        +₹18,450.00
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Win Rate</span>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: '#38bdf8', marginTop: '2px' }}>
                        78.4%
                      </div>
                    </div>
                  </div>

                  {/* Mini Performance Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '12px', borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}>
                    <div>
                      <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Trades</span>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff' }}>12</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Max DD</span>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#ef4444' }}>-1.2%</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Profit Factor</span>
                      <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8' }}>2.45</div>
                    </div>
                  </div>
                </div>

                {/* Capital Growth Curve */}
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(51, 65, 85, 0.3)', borderRadius: '12px', padding: '10px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Capital Growth Curve</span>
                  <div style={{ height: '50px', width: '100%' }}>
                    <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="pnl-curve-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25"/>
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path d="M 0 25 C 20 22, 40 10, 60 14 T 100 2 L 100 30 L 0 30 Z" fill="url(#pnl-curve-grad)" />
                      <path d="M 0 25 C 20 22, 40 10, 60 14 T 100 2" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      </section>




      {/* ════════════════════════════════════════
          PRICING SECTION
      ════════════════════════════════════════ */}
      <section id="pricing" className="section" style={{ background: '#ffffff' }}>
        <div className="section-inner">
          <div className="text-center">
            <div className="section-tag"><Sparkles size={14} /> Subscription Plans</div>
            <h2 className="section-title">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h2>
            <p className="section-sub">
              No hidden fees. Cancel anytime. All plans include full platform access.
            </p>
          </div>

          {/* Product Type Tabs */}
          {!plansLoading && plans.length > 0 && (() => {
            const productTypes = [...new Set(plans.map((p: any) => p.productType))];
            const filteredPlans = plans.filter((p: any) => p.productType === activePlanTab);
            return (
              <>
                {/* Tab Buttons */}
                <div style={{
                  display: 'flex', justifyContent: 'center', gap: 8,
                  marginTop: 40, flexWrap: 'wrap',
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

                {/* Plans for Selected Tab */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '24px',
                  marginTop: '36px',
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
                      <Link href="/vendor/login" target="_blank" style={{ display: 'block' }}>
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

          {plansLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: '#64748b', fontSize: '15px' }}>
              <Activity size={20} style={{ marginRight: '10px', animation: 'spin 1s linear infinite' }} /> Loading plans...
            </div>
          )}
          {!plansLoading && plans.length === 0 && (
            <div style={{ color: '#64748b', fontSize: '15px', padding: '40px', textAlign: 'center' }}>
              No active subscription plans are currently configured.
            </div>
          )}

        </div>
      </section>

      {/* ════════════════════════════════════════
          FAQ SECTION
      ════════════════════════════════════════ */}
      <section id="faq" className="section faq-section">
        <div className="section-inner">
          <div className="text-center">
            <div className="section-tag">Got Questions?</div>
            <h2 className="section-title">Frequently Asked <span className="text-gradient">Questions</span></h2>
            <p className="section-sub">Everything you need to know about Growffiy's trading automation.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'start',
            marginTop: '48px'
          }} className="faq-container-grid">
            {/* Left Side: Premium Image with backdrop glow */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }} className="faq-image-wrapper">
              <div style={{
                position: 'absolute',
                top: '5%',
                left: '5%',
                width: '90%',
                height: '90%',
                background: 'radial-gradient(circle, rgba(30,136,255,0.18) 0%, rgba(255,255,255,0) 70%)',
                filter: 'blur(40px)',
                zIndex: 0,
                pointerEvents: 'none'
              }} />
              <img
                src="/faq_illustration.png"
                alt="Frequently Asked Questions"
                style={{
                  width: '100%',
                  maxWidth: '480px',
                  height: 'auto',
                  borderRadius: '20px',
                  boxShadow: '0 25px 60px rgba(30,136,255,0.08)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                className="faq-hero-img"
              />
            </div>

            {/* Right Side: Accordion */}
            <div className="faq-list" style={{ width: '100%' }}>
              {faqs.slice(0, 4).map((faq, i) => (
                <div key={i} className={`faq-item${activeFaq === i ? ' open' : ''}`}>
                  <button className="faq-q" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                    <span>{faq.q}</span>
                    {activeFaq === i ? <ChevronUp size={18} color="#1E88FF" /> : <ChevronDown size={18} color="#64748b" />}
                  </button>
                  {activeFaq === i && (
                    <div className="faq-a" dangerouslySetInnerHTML={{ __html: faq.a }} />
                  )}
                </div>
              ))}

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
                <Link href="/faq">
                  <button style={{
                    background: 'transparent',
                    border: '1.5px solid #1E88FF',
                    color: '#1E88FF',
                    fontWeight: 600,
                    fontSize: '14px',
                    padding: '10px 26px',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(30, 136, 255, 0.05)'
                  }} className="view-more-faq-btn">
                    View All Questions <ArrowRight size={15} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
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
