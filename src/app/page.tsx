'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '../views/components/Card';
import { Button } from '../views/components/Button';
import { PerformanceChart } from '../views/components/PerformanceChart';
import { Check, ShieldCheck, Zap, Activity, ArrowRight, Award, Sparkles, Info, RefreshCw } from 'lucide-react';

export default function AnimatedLightLanding() {
  // Live simulated Nifty 200 quotes
  const [simStocks, setSimStocks] = useState([
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', ltp: 2450.40, change: -1.24 },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', ltp: 3215.10, change: -0.95 },
    { symbol: 'INFY', name: 'Infosys Limited', ltp: 1420.50, change: -2.15 },
    { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', ltp: 620.30, change: -3.12 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', ltp: 1610.15, change: -0.48 },
  ]);

  const [simPnl, setSimPnl] = useState(645230);

  useEffect(() => {
    const interval = setInterval(() => {
      setSimStocks(prev => prev.map(stock => {
        const pct = (Math.random() - 0.52) * 0.002;
        const newLtp = parseFloat((stock.ltp * (1 + pct)).toFixed(2));
        const newChange = parseFloat((stock.change + pct * 100).toFixed(2));
        return { ...stock, ltp: newLtp, change: newChange };
      }));
      setSimPnl(prev => prev + Math.floor((Math.random() - 0.4) * 250));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const plans = [
    { name: 'Monthly Plan', price: 4999, duration: '30 Days', tag: 'Standard Access', popular: false, features: ['Pre-Open Momentum Strategy', '1% Capital Risk Allocation', 'Zerodha Kite Integration', 'Real-time Performance Reports', 'Email Support'] },
    { name: 'Quarterly Plan', price: 12999, duration: '90 Days', tag: 'Most Popular', popular: true, features: ['All Monthly features', 'Priority API setup help', '1:3 Risk Reward management', 'Telegram Trade alerts', 'Priority Ticket Support'] },
    { name: 'Yearly Plan', price: 39999, duration: '365 Days', tag: 'Best Value', popular: false, features: ['All Quarterly features', 'Dedicated Account Manager', 'Custom Strategy parameters config', 'Emergency kill switch access', '24/7 Telephone Support'] },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: 'var(--font-family)', scrollBehavior: 'smooth', overflowX: 'hidden' }}>
      
      {/* Floating Glass Pill Header */}
      <header style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)',
        maxWidth: '1100px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        borderRadius: '99px',
        padding: '12px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.01)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)' }}>
            <Activity size={18} color="#ffffff" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(to right, #2563eb, #1d4ed8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'var(--font-title)' }}>
            GROWFFIY
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '28px', alignItems: 'center' }}>
          <a href="#features" style={{ fontWeight: 500, color: '#475569', fontSize: '13px' }}>System Features</a>
          <a href="#strategy" style={{ fontWeight: 500, color: '#475569', fontSize: '13px' }}>Strategy Rules</a>
          <a href="#live-data" style={{ fontWeight: 500, color: '#475569', fontSize: '13px' }}>Live Board</a>
          <a href="#pricing" style={{ fontWeight: 500, color: '#475569', fontSize: '13px' }}>Pricing</a>
          <Link href="/login">
            <Button style={{ borderRadius: '99px', padding: '6px 18px', fontSize: '12px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>Portal Access</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section with Animations */}
      <section style={{
        padding: '180px 24px 100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'radial-gradient(circle at 50% -120px, rgba(37, 99, 235, 0.12) 0%, rgba(248, 250, 252, 0) 70%)',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '950px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '28px' }} className="animate-fade-in-up">
          <div style={{ display: 'inline-flex', alignSelf: 'center', gap: '8px', alignItems: 'center', padding: '6px 18px', borderRadius: '99px', backgroundColor: '#eff6ff', border: '1px solid #cbd5e1', color: '#2563eb', fontWeight: 600, fontSize: '12px', letterSpacing: '0.5px' }} className="animate-pulse-ring">
            <Sparkles size={14} /> INSTITUTIONAL QUANT WORKSPACE
          </div>
          
          <h1 style={{ fontSize: '60px', fontWeight: 800, letterSpacing: '-1.8px', color: '#0f172a', lineHeight: '1.1', fontFamily: 'var(--font-title)' }}>
            Fully Automated Intraday Breakouts <br />
            <span style={{ background: 'linear-gradient(to right, #2563eb, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Built Around Strict 1% Risk Rules
            </span>
          </h1>

          <p style={{ fontSize: '19px', color: '#475569', lineHeight: '1.6', maxWidth: '800px', margin: '0 auto' }}>
            Growffiy maps directly with your Zerodha Kite broker token to execute pre-open momentum breakout strategies. Protects capital using calculated quantity limits with zero manual adjustments.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '20px' }}>
            <Link href="/login">
              <Button style={{ padding: '14px 32px', borderRadius: '30px', fontSize: '15px' }}>
                Access Trading Portal <ArrowRight size={16} />
              </Button>
            </Link>
            <a href="#strategy">
              <Button variant="secondary" style={{ padding: '14px 32px', borderRadius: '30px', fontSize: '15px', backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#334155' }}>
                View Strategy Details
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Core Execution Features */}
      <section id="features" style={{ padding: '100px 40px', maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-title)', letterSpacing: '-0.5px' }}>
            Engine Features & Core Parameters
          </h2>
          <p style={{ color: '#475569', marginTop: '8px' }}>Institutional trading parameters configured for client accounts.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          <Card hoverable={true}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', marginBottom: '24px' }}>
              <Zap size={24} fill="#2563eb" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>Pre-Open Scan Algorithm</h3>
            <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '14px' }}>
              Scans all Nifty 200 stocks at 09:08 AM before the market opens to identify top gapping down candidates with potential momentum.
            </p>
          </Card>

          <Card hoverable={true}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '24px' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>1% Capital Risk Guard</h3>
            <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '14px' }}>
              Auto-calculates quantity sizes where the distance between entry and stop-loss represents strictly 1.00% of your account size.
            </p>
          </Card>

          <Card hoverable={true}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '24px' }}>
              <Award size={24} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>MIS Bracket execution</h3>
            <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '14px' }}>
              Orders are placed as Intraday MIS. Automated brackets immediately submit both Target and Stop-Loss orders to Zerodha.
            </p>
          </Card>
        </div>
      </section>

      {/* Detailed Strategy Parameters */}
      <section id="strategy" style={{ padding: '100px 40px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Breakout Strategy Specifications</span>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-title)', marginTop: '12px' }}>
              Pre-Open Momentum Breakout Model
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '48px', alignItems: 'center' }}>
            {/* Strategy Logic Flow Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>1</div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: '#0f172a' }}>Stock Scanner Selection</h4>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>System identifies top loser stocks from Nifty 200 list on gap down opening.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>2</div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: '#0f172a' }}>Calculate Entry Price Trigger</h4>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>Waits for the first 5-minute candle to close (09:15 - 09:20 AM). Entry price is set at: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#2563eb' }}>5-Min High + 0.1% buffer</code>.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>3</div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: '#0f172a' }}>Brackets limits & Targets</h4>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>Stop loss is set at <code style={{ color: '#ef4444' }}>Entry Price - 0.5%</code>. Profit Target is set at <code style={{ color: '#10b981' }}>Entry Price + 1.5%</code>, representing a 1:3 Risk Reward ratio.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>4</div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: '#0f172a' }}>Automatic Risk Quantity Formula</h4>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>Shares quantity size is calculated dynamically: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>Quantity = Risk Amount / Per Share Risk</code>.</p>
                </div>
              </div>
            </div>

            {/* Visual Formula Details Panel */}
            <Card style={{ padding: '32px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#2563eb', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <Info size={16} /> Strategy Parameters Example
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ color: '#475569' }}>Client Capital Allocation</span>
                  <strong>₹5,00,000.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ color: '#475569' }}>Max Trade Risk (1%)</span>
                  <strong>₹5,000.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ color: '#475569' }}>Selected Stock 5-Min High</span>
                  <strong>₹1,000.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ color: '#475569' }}>Entry Trigger (High + 0.1%)</span>
                  <strong style={{ color: '#2563eb' }}>₹1,001.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ color: '#475569' }}>Stop-Loss (Entry - 0.5%)</span>
                  <strong style={{ color: '#ef4444' }}>₹996.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ color: '#475569' }}>Profit Target (Entry + 1.5%)</span>
                  <strong style={{ color: '#10b981' }}>₹1,016.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span style={{ color: '#475569' }}>Per Share Risk</span>
                  <strong>₹5.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>Position Size (Quantity)</span>
                  <strong style={{ color: '#2563eb' }}>1,000 Shares</strong>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Live Ticking Ticker Simulator */}
      <section id="live-data" style={{ padding: '100px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '1px' }}>Simulated Real-Time Board</span>
          <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-title)', marginTop: '8px' }}>
            Nifty 200 Top Loser Scans
          </h2>
          <p style={{ color: '#475569', marginTop: '8px' }}>Simulates ticks streaming through WebSocket connection.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
          {/* Live quotes board */}
          <Card style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Quotes Feed Board</span>
              <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 500 }} className="badge bg-success-light">WebSocket Connected</span>
            </h3>
            <div className="table-responsive">
              <table style={{ borderCollapse: 'collapse', textAlign: 'left', width: '100%' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ background: 'none', border: 'none', color: '#475569', padding: '12px 8px' }}>Symbol</th>
                    <th style={{ background: 'none', border: 'none', color: '#475569', padding: '12px 8px' }}>LTP (₹)</th>
                    <th style={{ background: 'none', border: 'none', color: '#475569', padding: '12px 8px' }}>Chg (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {simStocks.map((stock) => (
                    <tr key={stock.symbol} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ fontWeight: 600, padding: '16px 8px', color: '#0f172a' }}>{stock.symbol}</td>
                      <td style={{ fontWeight: 600, padding: '16px 8px' }}>₹{stock.ltp.toFixed(2)}</td>
                      <td style={{ fontWeight: 600, padding: '16px 8px', color: stock.change >= 0 ? '#10b981' : '#ef4444' }}>
                        {stock.change >= 0 ? `+${stock.change}%` : `${stock.change}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Aggregate P&L curve */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card style={{ padding: '32px' }} className="animate-float">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>Cumulative Algo P&L Today</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>+₹{simPnl.toLocaleString()}</span>
              </div>
              <PerformanceChart
                data={[642000, 641000, 644000, 642500, 643800, 644200, simPnl]}
                labels={['09:30', '10:30', '11:30', '12:30', '13:30', '14:30', 'Now']}
                strokeColor="#10b981"
                fillColorStart="rgba(16, 185, 129, 0.15)"
                fillColorEnd="rgba(16, 185, 129, 0)"
              />
            </Card>
          </div>
        </div>
      </section>

      {/* Purely Informational Pricing Sections */}
      <section id="pricing" style={{ padding: '100px 24px', maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-title)', letterSpacing: '-0.5px' }}>
            Transparent Subscription Details
          </h2>
          <p style={{ color: '#475569', marginTop: '8px' }}>Pricing parameters for automated execution. Credentials mapped only by admin.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'stretch' }}>
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                border: `2.5px solid ${plan.popular ? '#2563eb' : '#cbd5e1'}`,
                boxShadow: plan.popular ? '0 10px 30px rgba(37, 99, 235, 0.05)' : '0 4px 6px rgba(0,0,0,0.01)',
                padding: '36px',
                transition: 'all 0.3s ease',
              }}
            >
              {plan.popular && (
                <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Recommended
                </span>
              )}

              <p style={{ color: '#475569', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{plan.tag}</p>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>{plan.name}</h3>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '24px 0' }}>
                <span style={{ fontSize: '42px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-title)' }}>₹{plan.price.toLocaleString()}</span>
                <span style={{ color: '#475569' }}>/ {plan.duration}</span>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, marginBottom: '36px' }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                      <Check size={12} />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login" style={{ width: '100%' }}>
                <Button
                  style={{ width: '100%', borderRadius: '25px', padding: '12px' }}
                  variant={plan.popular ? 'primary' : 'secondary'}
                >
                  Access Trading Portal
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Light slate footer */}
      <footer style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '80px 40px 40px', borderTop: '1px solid #e2e8f0', fontSize: '13px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {/* Footer Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '48px' }}>
            {/* Brand & Pitch */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="#2563eb" />
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-title)' }}>GROWFFIY</span>
              </div>
              <p style={{ lineHeight: '1.6', color: '#475569' }}>
                Advanced automated algorithmic trading middleware mapping directly with your Zerodha Kite broker token keys. Engineered for mathematical discipline and speed.
              </p>
            </div>

            {/* Platform Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Workspace</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a href="#features" style={{ color: '#475569' }}>Features</a>
                <a href="#strategy" style={{ color: '#475569' }}>Breakout Specs</a>
                <a href="#live-data" style={{ color: '#475569' }}>WebSocket Live</a>
                <Link href="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Client Portal Login</Link>
              </div>
            </div>

            {/* Legal & Compliance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ color: '#0f172a', fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Compliance</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link href="/privacy" style={{ color: '#475569' }}>Privacy & Keys Policy</Link>
                <Link href="/terms" style={{ color: '#475569' }}>Terms & Risk Disclosure</Link>
                <Link href="/contact" style={{ color: '#475569' }}>Contact Technical Desk</Link>
              </div>
            </div>
          </div>

          {/* Regulatory Risk Disclosure Note */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11px', color: '#64748b', lineHeight: '1.6' }}>
            <p>
              <strong>REGULATORY RISK WARNING:</strong> Algorithmic and automated trading involves high financial risks. Growffiy is a software utility designed to automate trade placements based on predefined math conditions; it is not a SEBI registered investment advisor, stock broker, or portfolio manager. All returns, charts, and performance metrics shown are simulated in sandbox environments and do not represent guaranteed future results.
            </p>
            <p style={{ textAlign: 'center', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              © 2026 Growffiy Inc. All rights reserved. Managed with institutional security standards.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
