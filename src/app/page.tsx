'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '../views/components/Card';
import { Button } from '../views/components/Button';
import { PerformanceChart } from '../views/components/PerformanceChart';
import { Check, ShieldCheck, Zap, Activity, ArrowRight, Award, Sparkles } from 'lucide-react';

export default function InformationalSinglePage() {
  // Live simulator stats on the landing page to keep it engaging
  const [simLtp, setSimLtp] = useState(2450.00);
  const [simPnl, setSimPnl] = useState(48250);

  useEffect(() => {
    const interval = setInterval(() => {
      setSimLtp(prev => parseFloat((prev + (Math.random() - 0.5) * 4).toFixed(2)));
      setSimPnl(prev => prev + Math.floor((Math.random() - 0.4) * 150));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const plans = [
    { name: 'Monthly Plan', price: 4999, duration: '30 Days', tag: 'Basic Access', popular: false, features: ['Pre-Open Momentum Strategy', '1% Capital Risk Allocation', 'Zerodha Kite Integration', 'Real-time Performance Reports', 'Email Support'] },
    { name: 'Quarterly Plan', price: 12999, duration: '90 Days', tag: 'Most Popular', popular: true, features: ['All Monthly features', 'Priority API setup help', '1:3 Risk Reward management', 'Telegram Trade alerts', 'Priority Ticket Support'] },
    { name: 'Yearly Plan', price: 39999, duration: '365 Days', tag: 'Best Value', popular: false, features: ['All Quarterly features', 'Dedicated Account Manager', 'Custom Strategy parameters config', 'Emergency kill switch access', '24/7 Telephone Support'] },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafbfd', color: '#1e293b', fontFamily: 'var(--font-family)', scrollBehavior: 'smooth' }}>
      
      {/* Header (Glassmorphism effect) */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}>
            <Activity size={20} color="#ffffff" />
          </div>
          <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(to right, #2563eb, #1d4ed8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'var(--font-title)' }}>
            GROWFFIY
          </span>
        </div>

        <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#features" style={{ fontWeight: 500, color: '#475569', fontSize: '14px', transition: 'color 0.2s' }}>Features</a>
          <a href="#demo" style={{ fontWeight: 500, color: '#475569', fontSize: '14px', transition: 'color 0.2s' }}>Live Feed</a>
          <a href="#pricing" style={{ fontWeight: 500, color: '#475569', fontSize: '14px', transition: 'color 0.2s' }}>Pricing</a>
          <a href="http://admin.localhost:3000/" target="_blank" rel="noreferrer" style={{ fontWeight: 500, color: '#2563eb', fontSize: '14px' }}>Admin Login</a>
          <Link href="/login">
            <Button variant="secondary" style={{ borderRadius: '20px', padding: '6px 18px' }}>Client Portal</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '100px 24px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', textSelf: 'center', background: 'radial-gradient(circle at 50% -100px, #eff6ff 0%, #fafbfd 70%)' }}>
        <div style={{ maxWidth: '900px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'inline-flex', alignSelf: 'center', gap: '8px', alignItems: 'center', padding: '6px 16px', borderRadius: '99px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe', color: '#2563eb', fontWeight: 600, fontSize: '12px' }}>
            <Sparkles size={14} /> Zero Manual Intervention, Fully Algorithmic
          </div>
          
          <h1 style={{ fontSize: '56px', fontWeight: 800, letterSpacing: '-1.5px', color: '#0f172a', lineHeight: '1.15', fontFamily: 'var(--font-title)' }}>
            Automate Your Trading Allocation <br />
            <span style={{ background: 'linear-gradient(to right, #2563eb, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              With Strict Risk Rules
            </span>
          </h1>

          <p style={{ fontSize: '18px', color: '#64748b', lineHeight: '1.6', maxWidth: '750px', margin: '0 auto' }}>
            Growffiy links securely with your Zerodha Kite API to scan and execute intraday breakouts. Strictly manages risk at 1% capital per trade with Zero manual adjustments.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
            <Link href="/login">
              <Button style={{ padding: '12px 28px', borderRadius: '30px' }}>
                Access Trading Portal <ArrowRight size={16} />
              </Button>
            </Link>
            <a href="#demo">
              <Button variant="secondary" style={{ padding: '12px 28px', borderRadius: '30px' }}>
                Watch Live Strategy
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-title)', letterSpacing: '-0.5px' }}>
            Institutional Execution Architecture
          </h2>
          <p style={{ color: '#64748b', marginTop: '8px' }}>Designed for speed, safety, and regulatory compliance.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          <Card hoverable={true}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', marginBottom: '20px' }}>
              <Zap size={24} fill="#2563eb" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: '#0f172a' }}>Pre-Open Momentum Scanner</h3>
            <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '14px' }}>
              Systematic scanning of Nifty 200 list before market opens to catch gap up/down breakout triggers automatically.
            </p>
          </Card>

          <Card hoverable={true}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', marginBottom: '20px' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: '#0f172a' }}>Automated Capital Guard</h3>
            <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '14px' }}>
              Protects equity from spikes. Sets strict risk profiles allocating exactly 1.00% daily capital size per symbol trade.
            </p>
          </Card>

          <Card hoverable={true}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', marginBottom: '20px' }}>
              <Award size={24} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px', color: '#0f172a' }}>Instant Settlement API</h3>
            <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '14px' }}>
              Integrates directly with Zerodha Kite broker token connections and Razorpay gateways for immediate active billing.
            </p>
          </Card>
        </div>
      </section>

      {/* Live Trading Preview Panel */}
      <section id="demo" style={{ padding: '80px 40px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#2563eb' }}>Engine Simulator Preview</span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-title)', marginTop: '8px' }}>
              Observe Live Executions
            </h2>
          </div>

          <Card style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '18px' }}>RELIANCE</h4>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Reliance Industries Ltd. (Nifty 200)</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '18px', color: '#2563eb' }}>₹{simLtp.toFixed(2)}</h4>
                  <span className="badge badge-success" style={{ fontSize: '10px' }}>Live tick feed</span>
                </div>
              </div>
              <PerformanceChart
                data={[2440, 2445, 2442, 2449, 2452, 2448, simLtp]}
                labels={['09:15', '09:30', '10:00', '11:00', '12:00', '13:00', 'Now']}
                strokeColor="#2563eb"
                fillColorStart="rgba(37, 99, 235, 0.15)"
                fillColorEnd="rgba(37, 99, 235, 0)"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#f1f5f9', borderLeft: '4px solid #2563eb' }}>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Assigned Strategy</p>
                <p style={{ fontWeight: 700, fontSize: '15px', marginTop: '4px' }}>Pre-Open Momentum Breakout</p>
              </div>

              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#f1f5f9', borderLeft: '4px solid #10b981' }}>
                <p style={{ fontSize: '12px', color: '#64748b' }}>Simulated Realized P&L today</p>
                <p style={{ fontWeight: 700, fontSize: '20px', marginTop: '4px', color: '#10b981' }}>
                  +₹{simPnl.toLocaleString()}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', color: '#64748b' }}>Daily Risk</p>
                  <p style={{ fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>1.00%</p>
                </div>
                <div style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', color: '#64748b' }}>Orders Executed</p>
                  <p style={{ fontWeight: 600, fontSize: '13px', marginTop: '2px' }}>148</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-title)', letterSpacing: '-0.5px' }}>
            Choose Your Subscription Plan
          </h2>
          <p style={{ color: '#64748b', marginTop: '8px' }}>Log in to your credentials provided by the admin to subscribe and map API routing configurations.</p>
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
                border: `2px solid ${plan.popular ? '#2563eb' : '#e2e8f0'}`,
                boxShadow: plan.popular ? '0 10px 30px rgba(37, 99, 235, 0.08)' : '0 4px 6px rgba(0,0,0,0.02)',
                padding: '36px',
                transition: 'all 0.2s ease',
              }}
            >
              {plan.popular && (
                <span style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2563eb', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Recommended
                </span>
              )}

              <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{plan.tag}</p>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '8px' }}>{plan.name}</h3>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '24px 0' }}>
                <span style={{ fontSize: '42px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-title)' }}>₹{plan.price.toLocaleString()}</span>
                <span style={{ color: '#64748b' }}>/ {plan.duration}</span>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, marginBottom: '36px' }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                      <Check size={12} />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href="/login" style={{ width: '100%' }}>
                <Button
                  style={{ width: '100%', borderRadius: '25px', padding: '10px' }}
                  variant={plan.popular ? 'primary' : 'secondary'}
                >
                  Access Trading Portal
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', padding: '48px 40px', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-title)' }}>GROWFFIY</span>
            <p style={{ fontSize: '12px', marginTop: '8px', color: '#64748b' }}>© 2026 Growffiy Inc. All rights reserved.</p>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
            <a href="#features">Features</a>
            <a href="#demo">Live Ticks</a>
            <a href="#pricing">Pricing Plans</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
