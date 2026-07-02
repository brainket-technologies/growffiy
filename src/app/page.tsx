'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PerformanceChart } from '../shared/components/views/PerformanceChart';
import Footer from '../shared/components/views/Footer';
import {
  Activity, ShieldCheck, Zap, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Menu, X,
  BarChart2, Lock, Bell, Target, Cpu,
  Check, Phone, Mail, MapPin
} from 'lucide-react';
import { API_ENDPOINTS } from '../core/constants';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Stock {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  high: number;
  low: number;
  volume: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GrowffiyLanding() {
  // Live stock state
  const [stocks, setStocks] = useState<Stock[]>([
    { symbol: 'RELIANCE',   name: 'Reliance Industries', ltp: 0, change: 0, high: 0, low: 0, volume: '...' },
    { symbol: 'TCS',        name: 'Tata Consultancy',    ltp: 0, change: 0, high: 0, low: 0, volume: '...' },
    { symbol: 'INFY',       name: 'Infosys Ltd.',        ltp: 0, change: 0, high: 0, low: 0, volume: '...' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors',         ltp: 0, change: 0, high: 0, low: 0, volume: '...' },
    { symbol: 'HDFCBANK',   name: 'HDFC Bank',           ltp: 0, change: 0, high: 0, low: 0, volume: '...' },
    { symbol: 'ICICIBANK',  name: 'ICICI Bank',          ltp: 0, change: 0, high: 0, low: 0, volume: '...' },
    { symbol: 'NIFTY50',    name: 'Nifty 50',            ltp: 0, change: 0, high: 0, low: 0, volume: '-'   },
    { symbol: 'SENSEX',     name: 'Sensex',              ltp: 0, change: 0, high: 0, low: 0, volume: '-'   },
  ]);

  const [heroData, setHeroData] = useState<number[]>([
    2410, 2418, 2415, 2425, 2432, 2428, 2436, 2441, 2439, 2447, 2443, 2450, 2450
  ]);
  const [heroLabels, setHeroLabels] = useState<string[]>([
    '9:15', '9:20', '9:25', '9:30', '9:35', '9:40', '9:45', '9:50', '9:55', '10:00', '10:05', '10:10', '10:15'
  ]);

  const [pnl, setPnl] = useState(645230);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');

  // Scroll detection for transparent navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Branding
  useEffect(() => {
    const load = () => {
      setBrandLogo(localStorage.getItem('growffiy_brand_logo') || '');
      setBrandName(localStorage.getItem('growffiy_brand_name') || 'Growffiy');
    };
    load();
    window.addEventListener('branding-updated', load);
    return () => window.removeEventListener('branding-updated', load);
  }, []);

  // ─── Real stock data from Yahoo Finance (via /api/public/stocks) ─────────────
  const fetchRealStocks = async () => {
    try {
      const res = await fetch('/api/public/stocks', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.stocks?.length > 0) {
        setStocks(data.stocks);
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
    const iv = setInterval(fetchRealStocks, 30000); // Refresh every 30s
    // P&L still animates for visual effect
    const pnlIv = setInterval(() => setPnl(p => p + Math.floor((Math.random() - 0.4) * 300)), 3000);
    return () => { clearInterval(iv); clearInterval(pnlIv); };
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

  const faqs = [
    { q: 'How does the Pre-Open Momentum Breakout strategy work?', a: 'At 09:08 AM, the engine scans the Nifty 200 for stocks showing the largest gap-down opening. Once the first 5-minute candle closes (09:15–09:20 AM), it marks the candle high and places a Buy SLM order at High + 0.1% buffer, stop-loss at Entry − 0.5%, and target at Entry + 1.5%.' },
    { q: 'How is position sizing calculated?', a: 'The system uses the 1% Risk Rule: Quantity = (Capital × 1%) ÷ (Entry − Stop Loss). This caps maximum loss per trade at exactly 1% of your allocated capital regardless of stock price.' },
    { q: 'Do I need a Zerodha Kite Connect subscription?', a: 'Yes. You need an active Zerodha account with Kite Connect API access. You enter your API key and secret in your secure portal dashboard. Kite Connect charges (₹2,000/month) are billed separately by Zerodha.' },
    { q: 'Can I pause the bot at any time?', a: 'Absolutely. The Kill Switch in your dashboard immediately stops the trading loop, cancels all pending orders, and places no new trades until you re-enable it.' },
    { q: 'What happens if my internet goes down during a trade?', a: 'All orders (including target and stop-loss) are placed as GTT bracket orders at Zerodha\'s servers. Your trade is protected even if your connection drops.' },
  ];

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
              <img src={brandLogo || '/logo.png'} alt={brandName} style={{ width: 20, height: 20, objectFit: 'contain' }} />
            </div>
            {brandName.toUpperCase()}
          </Link>

          {/* Desktop Nav links */}
          <div className="navbar-nav">
            <a href="#features" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Features</a>
            <a href="#strategy" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Strategy</a>
            <a href="#pricing" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Pricing</a>
            <a href="#faq" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>FAQ</a>
            <Link href="/vendor/login" target="_blank" className="btn-nav">Get Started →</Link>
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
            <a href="#features" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#strategy" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Strategy</a>
            <a href="#pricing" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faq" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <Link href="/vendor/login" target="_blank" className="mobile-nav-cta" onClick={() => setMobileMenuOpen(false)}>
              Get Started →
            </Link>
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

            <h1 className="hero-h1">
              Automate Your<br />
              <span className="text-gradient">Stock Market</span><br />
              Trades Smarter
            </h1>

            <p className="hero-sub">
              Growffiy connects to your Zerodha Kite API and executes pre-open momentum breakout strategies with strict 1% risk management — fully automated.
            </p>

            <div className="hero-btns">
              <Link href="/vendor/login" target="_blank" className="btn-primary">
                Start Trading Now <ArrowRight size={15} />
              </Link>
              <a href="#strategy" className="btn-secondary">
                View Strategy
              </a>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
              {[
                { val: '₹12.4Cr+', lbl: 'Capital Managed', color: 'var(--accent)' },
                { val: '1,200+', lbl: 'Trades Executed', color: 'var(--text-heading)' },
                { val: '68%', lbl: 'Win Rate', color: 'var(--primary)' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--font-title)', fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.lbl}</span>
                </div>
              ))}
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

      {/* ════════════════════════════════════════
          FEATURES SECTION
      ════════════════════════════════════════ */}
      <section id="features" className="section" style={{ background: '#ffffff' }}>
        <div className="section-inner">
          <div className="text-center">
            <div className="section-tag">
              <Sparkles size={14} /> Platform Features
            </div>
            <h2 className="section-title">
              Everything You Need to{' '}
              <span className="text-gradient">Trade Algorithmically</span>
            </h2>
            <p className="section-sub">
              Institutional-grade automation features built for Indian retail traders — no coding required.
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className={`feature-icon ${f.cls}`}>{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          STRATEGY SECTION
      ════════════════════════════════════════ */}
      <section id="strategy" className="section" style={{ background: '#f8fafc' }}>
        <div className="section-inner">
          <div className="strategy-grid">
            {/* Left: Steps */}
            <div>
              <div className="section-tag"><Target size={14} /> Strategy Logic</div>
              <h2 className="section-title">
                Pre-Open Momentum <span className="text-gradient-green">Breakout Model</span>
              </h2>
              <p className="section-sub" style={{ marginBottom: 32 }}>
                A time-tested intraday strategy that captures momentum from gap-down stocks in the first 5 minutes of the trading session.
              </p>

              <div className="strategy-steps">
                {[
                  { n: 1, title: 'Stock Scanner (09:08 AM)', desc: 'Engine scans all Nifty 200 stocks and identifies top gap-down candidates based on pre-market price vs previous close.' },
                  { n: 2, title: 'First Candle Close (09:15–09:20 AM)', desc: 'System waits for the first 5-minute candle to form and marks its High as the trigger level.' },
                  { n: 3, title: 'SLM Order Placement', desc: 'Buy SLM order placed at 5-Min High + 0.1% buffer. Stop-loss at Entry − 0.5%. Target at Entry + 1.5% (1:3 R:R).' },
                  { n: 4, title: 'Auto Position Sizing', desc: 'Quantity = (Capital × 1%) ÷ (Entry − SL). Maximum trade risk is strictly capped at 1% of allocated capital.' },
                ].map(s => (
                  <div key={s.n} className="step-item">
                    <div className="step-num">{s.n}</div>
                    <div>
                      <div className="step-title">{s.title}</div>
                      <div className="step-desc">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Params Card */}
            <div>
              <div className="params-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div style={{ padding: '8px', borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <BarChart2 size={18} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)' }}>Live Strategy Parameters</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(34,197,94,0.12)', color: '#059669', padding: '3px 10px', borderRadius: 99, fontWeight: 700 }}>● Active</span>
                </div>

                {[
                  { k: 'Capital Allocation', v: '₹5,00,000', cls: '' },
                  { k: 'Max Risk Per Trade (1%)', v: '₹5,000', cls: 'params-val-blue' },
                  { k: '5-Min Candle High (Example)', v: '₹1,000.00', cls: '' },
                  { k: 'Entry Trigger (+0.1%)', v: '₹1,001.00', cls: 'params-val-blue' },
                  { k: 'Stop-Loss (Entry − 0.5%)', v: '₹996.00', cls: 'params-val-red' },
                  { k: 'Profit Target (Entry + 1.5%)', v: '₹1,016.00', cls: 'params-val-green' },
                  { k: 'Risk : Reward Ratio', v: '1 : 3', cls: 'params-val-green' },
                  { k: 'Position Size (Qty)', v: '1,000 Shares', cls: 'params-val-blue' },
                ].map((r, i) => (
                  <div key={i} className="params-row">
                    <span className="params-key">{r.k}</span>
                    <span className={r.cls || 'params-val'}>{r.v}</span>
                  </div>
                ))}

                {/* Mini chart */}
                <div style={{ marginTop: 20, padding: '16px', background: 'var(--surface)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Simulated Trade P&L Curve
                  </div>
                  <PerformanceChart
                    data={[640000, 641500, 639000, 643000, 645000, 643800, 647000, 649000, pnl]}
                    labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Mon', 'Tue', 'Now']}
                    height={120}
                    strokeColor="#10b981"
                    fillColorStart="rgba(16,185,129,0.15)"
                    fillColorEnd="rgba(255,255,255,0)"
                  />
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

          {/* Trust badges */}
          <div style={{
            marginTop: 48, display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap'
          }}>
            {['🔒 SSL Secured Portal', '✅ Zerodha Certified', '📱 Telegram Alerts', '⚡ 99.9% Uptime'].map(b => (
              <span key={b} style={{
                fontSize: 13, color: '#64748b', fontWeight: 600,
                background: 'white', padding: '8px 20px', borderRadius: 99,
                border: '1px solid #e2e8f0'
              }}>{b}</span>
            ))}
          </div>
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
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className={`faq-item${activeFaq === i ? ' open' : ''}`}>
                <button className="faq-q" onClick={() => setActiveFaq(activeFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  {activeFaq === i ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
                </button>
                {activeFaq === i && (
                  <div className="faq-a">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <Footer />
    </div>
  );
}
