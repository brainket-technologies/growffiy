'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { PerformanceChart } from '../views/components/PerformanceChart';
import Footer from '../views/components/Footer';
import {
  Activity, ShieldCheck, Zap, ArrowRight, Sparkles,
  ChevronDown, ChevronUp, Menu, X,
  BarChart2, Lock, Bell, Target, Cpu,
  Check, Phone, Mail, MapPin
} from 'lucide-react';
import { API_ENDPOINTS } from '../lib/constants';

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
    { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 2450.40, change: -1.24, high: 2481.00, low: 2432.00, volume: '4.2M' },
    { symbol: 'TCS', name: 'Tata Consultancy', ltp: 3215.10, change: -0.95, high: 3240.00, low: 3192.00, volume: '1.8M' },
    { symbol: 'INFY', name: 'Infosys Ltd.', ltp: 1420.50, change: -2.15, high: 1448.00, low: 1415.00, volume: '3.1M' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors', ltp: 620.30, change: -3.12, high: 644.00, low: 618.00, volume: '9.4M' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', ltp: 1610.15, change: +0.48, high: 1624.00, low: 1601.00, volume: '5.7M' },
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

  // Scroll detection for transparent navbar
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Tick simulation
  useEffect(() => {
    const iv = setInterval(() => {
      let newReliance = 0;
      setStocks(prev => {
        const updated = prev.map(s => {
          const d = (Math.random() - 0.50) * 0.002;
          const ltp = parseFloat((s.ltp * (1 + d)).toFixed(2));
          const change = parseFloat((s.change + d * 100 * 0.3).toFixed(2));
          if (s.symbol === 'RELIANCE') newReliance = ltp;
          return { ...s, ltp, change };
        });
        // slide hero chart
        if (newReliance) {
          setHeroData(p => [...p.slice(1), newReliance]);
          setHeroLabels(p => {
            const t = new Date();
            const label = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
            return [...p.slice(1), label];
          });
        }
        return updated;
      });
      setPnl(p => p + Math.floor((Math.random() - 0.4) * 300));
    }, 2000);
    return () => clearInterval(iv);
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

  useEffect(() => {
    fetch(API_ENDPOINTS.PLANS, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.plans) {
          const activePlans = data.plans.filter((p: any) => p.status === 'active');
          if (activePlans.length > 0) {
            // Sort by price ascending
            activePlans.sort((a: any, b: any) => Number(a.price) - Number(b.price));
            const mapped = activePlans.map((p: any) => ({
              tag: p.name.toLowerCase().includes('monthly') ? 'Standard Access' : p.name.toLowerCase().includes('quarterly') ? 'Most Popular' : 'Best Value',
              name: p.name,
              price: p.price,
              per: `${p.durationDays} Days`,
              popular: p.name.toLowerCase().includes('quarterly') || p.name.toLowerCase().includes('popular'),
              features: p.features
            }));
            setPlans(mapped);
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'var(--font-body)' }}>


      {/* ════════════════════════════════════════
          NAVBAR
      ════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled || mobileMenuOpen ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled || mobileMenuOpen ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled || mobileMenuOpen ? 'blur(20px)' : 'none',
        borderBottom: scrolled || mobileMenuOpen ? '1px solid rgba(226,232,240,0.8)' : 'none',
        boxShadow: scrolled || mobileMenuOpen ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div className="navbar-inner">
          {/* Logo */}
          <Link href="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="navbar-logo-icon">
              <Activity size={18} color="white" />
            </div>
            GROWFFIY
          </Link>

          {/* Desktop Nav links */}
          <div className="navbar-nav">
            <a href="#features" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Features</a>
            <a href="#strategy" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Strategy</a>
            <a href="#pricing" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>Pricing</a>
            <a href="#faq" className={`nav-link${!scrolled ? ' nav-link-dark' : ''}`}>FAQ</a>
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
            <a href="#features" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#strategy" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Strategy</a>
            <a href="#pricing" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faq" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <Link href="/login" target="_blank" className="mobile-nav-cta" onClick={() => setMobileMenuOpen(false)}>
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
              <Link href="/login" target="_blank" className="btn-primary">
                Start Trading Now <ArrowRight size={15} />
              </Link>
              <a href="#strategy" className="btn-secondary">
                View Strategy
              </a>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
              {[
                { val: '₹12.4Cr+', lbl: 'Capital Managed', color: '#10b981' },
                { val: '1,200+', lbl: 'Trades Executed', color: '#0f172a' },
                { val: '68%', lbl: 'Win Rate', color: '#0ea5e9' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontFamily: 'var(--font-title)', fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="hero-right" style={{ position: 'relative' }}>
            {/* Badge top-right */}
            <div style={{
              position: 'absolute', top: 80, right: -50, zIndex: 10,
              background: 'white', borderRadius: 16, padding: '14px 18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.10)', border: '1px solid #e8edf5',
              animation: 'floatCard2 6s ease-in-out infinite',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Today&apos;s P&amp;L</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 20, fontWeight: 800, color: '#10b981' }}>+₹{pnl.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginTop: 2 }}>▲ 3.24% today</div>
            </div>

            {/* Badge bottom-left */}
            <div style={{
              position: 'absolute', bottom: 150, left: -50, zIndex: 10,
              background: 'white', borderRadius: 16, padding: '14px 18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.10)', border: '1px solid #e8edf5',
              animation: 'floatCard1 5s ease-in-out infinite',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Risk Per Trade</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>1.00%</div>
              <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginTop: 2 }}>Capital Protected</div>
            </div>

            {/* Main Chart Card */}
            <div style={{
              background: 'white', borderRadius: 24,
              padding: '24px 24px 20px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
              border: '1px solid #e8edf5', overflow: 'hidden', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: isUp(stocks[0].change)
                  ? 'linear-gradient(90deg,#10b981,#0ea5e9)'
                  : 'linear-gradient(90deg,#ef4444,#f59e0b)',
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>NSE: RELIANCE</div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 700, color: '#10b981',
                      background: '#f0fdf4', borderRadius: 99, padding: '2px 8px',
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulseDot 1.5s ease-in-out infinite' }} />
                      LIVE
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Reliance Industries Ltd.</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-title)', fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                    ₹{stocks[0].ltp.toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, marginTop: 4,
                    color: isUp(stocks[0].change) ? '#10b981' : '#ef4444',
                    display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end',
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: isUp(stocks[0].change) ? '#10b981' : '#ef4444',
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
                borderTop: '1px solid #f1f5f9', paddingTop: 10, marginTop: 6, fontSize: 11,
              }}>
                <span style={{ color: '#94a3b8' }}>
                  H: <strong style={{ color: '#16181fff' }}>₹{stocks[0].high}</strong>
                  {'  '}L: <strong style={{ color: '#0f172a' }}>₹{stocks[0].low}</strong>
                  {'  '}Vol: <strong style={{ color: '#0f172a' }}>{stocks[0].volume}</strong>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulseDot 1.5s ease-in-out infinite' }} />
                  Live · 2s ticks
                </span>
              </div>
            </div>

            {/* 3 mini quote chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 12 }}>
              {stocks.slice(1, 4).map(s => (
                <div key={s.symbol} style={{
                  background: 'white', borderRadius: 12, padding: '10px 12px',
                  border: '1px solid #e8edf5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 3 }}>{s.symbol}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>₹{s.ltp.toFixed(0)}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: isUp(s.change) ? '#10b981' : '#ef4444', marginTop: 2 }}>
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
      <section id="features" className="section" style={{ background: 'white' }}>
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
                  <div style={{ padding: '8px', borderRadius: 10, background: 'linear-gradient(135deg,rgba(14,165,233,0.12),rgba(99,102,241,0.12))', color: '#0ea5e9' }}>
                    <BarChart2 size={18} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Live Strategy Parameters</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, background: '#d1fae5', color: '#059669', padding: '3px 10px', borderRadius: 99, fontWeight: 700 }}>● Active</span>
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
                <div style={{ marginTop: 20, padding: '16px', background: '#f8fafc', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
      <section id="pricing" className="section" style={{ background: '#f8fafc' }}>
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

          <div className="pricing-grid" style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '24px',
            marginTop: '56px',
            alignItems: 'stretch'
          }}>
            {plansLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: '#64748b', fontSize: '15px' }}>
                <Activity size={20} className="spin" style={{ marginRight: '10px', animation: 'spin 1s linear infinite' }} /> Loading subscription plans...
              </div>
            ) : plans.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '15px', padding: '40px', textAlign: 'center' }}>
                No active subscription plans are currently configured.
              </div>
            ) : (
              plans.map(plan => (
                <div
                  key={plan.name}
                  className={`pricing-card${plan.popular ? ' popular' : ''}`}
                  style={{
                    flex: '1 1 360px',
                    maxWidth: '380px',
                    minWidth: '280px'
                  }}
                >
                  {plan.popular && <div className="popular-badge">Most Popular</div>}
                  <div className="pricing-tag">{plan.tag}</div>
                  <div className="pricing-name">{plan.name}</div>
                  <div className="pricing-amount">
                    <span className="pricing-currency">₹</span>
                    <span className="pricing-price">{plan.price.toLocaleString()}</span>
                    <span className="pricing-per">/ {plan.per}</span>
                  </div>
                  <ul className="pricing-features">
                    {plan.features.map(f => (
                      <li key={f} className="pricing-feature-item">
                        <div className="check-icon"><Check size={11} /></div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/login" target="_blank" style={{ display: 'block' }}>
                    <button style={{
                      width: '100%', padding: '13px', borderRadius: 99, fontWeight: 700,
                      fontSize: 14, cursor: 'pointer', transition: 'all 0.3s',
                      background: plan.popular ? 'var(--primary)' : 'white',
                      color: plan.popular ? 'white' : 'var(--text-body)',
                      boxShadow: plan.popular ? '0 6px 20px rgba(14, 165, 233, 0.2)' : 'none',
                      border: plan.popular ? 'none' : '1.5px solid var(--border)',
                    }}>
                      Access Portal →
                    </button>
                  </Link>
                </div>
              ))
            )}
          </div>

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
