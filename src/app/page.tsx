'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '../views/components/Card';
import { Button } from '../views/components/Button';
import { Modal } from '../views/components/Modal';
import { Check, ShieldCheck, Zap, Activity, Users, Lock } from 'lucide-react';

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number } | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const plans = [
    { name: 'Monthly Plan', price: 4999, duration: '30 Days', features: ['Pre-Open Momentum Strategy', '1% Capital Risk Allocation', 'Zerodha Kite Integration', 'Real-time Performance Reports', 'Email Support'] },
    { name: 'Quarterly Plan', price: 12999, duration: '90 Days', features: ['All Monthly features', 'Priority API setup help', '1:3 Risk Reward management', 'Telegram Trade alerts', 'Priority Ticket Support'] },
    { name: 'Yearly Plan', price: 39999, duration: '365 Days', features: ['All Quarterly features', 'Dedicated Account Manager', 'Custom Strategy parameters config', 'Emergency kill switch access', '24/7 Telephone Support'] },
  ];

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSuccess(true);
    setTimeout(() => {
      // Simulate success mapping & redirect to client dashboard
      window.location.href = '/dashboard';
    }, 2000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={24} color="#2563eb" />
          <span style={{ fontSize: '20px', fontWeight: 800, background: 'linear-gradient(to right, #2563eb, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'var(--font-title)' }}>
            GROWFFIY
          </span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link href="#features" style={{ fontWeight: 500, color: '#475569' }}>Features</Link>
          <Link href="#pricing" style={{ fontWeight: 500, color: '#475569' }}>Pricing</Link>
          <Link href="/admin" style={{ fontWeight: 500, color: '#475569' }}>Admin Terminal</Link>
          <Link href="/login">
            <Button variant="secondary">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 32px', textAlign: 'center', background: 'radial-gradient(circle at top, #eff6ff 0%, #f8fafc 100%)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <span style={{ display: 'inline-flex', alignSelf: 'center', padding: '6px 16px', borderRadius: '9999px', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: 600, fontSize: '12px', gap: '6px', alignItems: 'center' }}>
            <Zap size={14} fill="#1e40af" /> Advanced Automated Algorithmic Systems
          </span>
          <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#0f172a', lineHeight: '1.2', fontFamily: 'var(--font-title)' }}>
            Trade Intraday Breakouts with Institutional Discipline
          </h1>
          <p style={{ fontSize: '18px', color: '#475569', lineHeight: '1.6' }}>
            Growffiy links directly with your Zerodha accounts to execute pre-open momentum breakout strategies. Powered by automatic risk allocations and instant payment gateways.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px' }}>
            <Link href="#pricing">
              <Button>Get Started Now</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">View Dashboard Demo</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '80px 32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', color: '#0f172a', marginBottom: '48px', fontFamily: 'var(--font-title)' }}>
          Enterprise Algo Engine Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          <Card>
            <Zap size={32} color="#2563eb" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Pre-Open Scan Breakouts</h3>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              Identifies candidate breakouts inside Nifty 200 list automatically prior to market open at 09:15 AM.
            </p>
          </Card>
          <Card>
            <ShieldCheck size={32} color="#10b981" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Strict 1% Risk Controls</h3>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              Protects capital balance. Allocates strictly 1.00% daily account size risk with automatic quantity scaling.
            </p>
          </Card>
          <Card>
            <Lock size={32} color="#f59e0b" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Secure API Connections</h3>
            <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
              Connect credentials dynamically. Encryption rules secure API keys, redirect callback tokens, and signatures.
            </p>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '80px 32px', backgroundColor: '#f1f5f9', width: '100%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', color: '#0f172a', marginBottom: '16px', fontFamily: 'var(--font-title)' }}>
            Transparent Subscription Plans
          </h2>
          <p style={{ textAlign: 'center', color: '#475569', marginBottom: '48px' }}>No hidden charges. Instant access activation upon payment.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {plans.map((plan) => (
              <Card key={plan.name} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', margin: '20px 0' }}>
                  <span style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a' }}>₹{plan.price.toLocaleString()}</span>
                  <span style={{ color: '#64748b' }}>/ {plan.duration}</span>
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, marginBottom: '32px' }}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#334155' }}>
                      <Check size={16} color="#10b981" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button onClick={() => { setSelectedPlan(plan); setIsCheckoutOpen(true); }} style={{ width: '100%' }}>
                  Subscribe Plan
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Unified Login / Registration popup */}
      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Razorpay Subscription Secure checkout">
        {paymentSuccess ? (
          <div style={{ textAlign: 'center', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justify: 'center', color: '#10b981' }}>
              <Check size={28} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Payment Complete!</h3>
            <p style={{ color: '#475569' }}>Your subscription is active. Setting up credentials and transferring you to dashboard terminal...</p>
          </div>
        ) : (
          <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '8px' }}>
              <p style={{ fontSize: '13px', color: '#64748b' }}>Order summary</p>
              <h4 style={{ fontSize: '16px', fontWeight: 700 }}>{selectedPlan?.name}</h4>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>₹{selectedPlan?.price.toLocaleString()}</h3>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Mobile Number</label>
              <input type="text" required placeholder="+91 99999 99999" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Card / UPI / Netbanking Details</label>
              <div style={{ padding: '12px', borderRadius: '6px', border: '1px solid #dbeafe', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '12px', fontWeight: 500 }}>
                Razorpay Sandbox payment simulation active. Click checkout below to complete order.
              </div>
            </div>

            <Button type="submit" style={{ width: '100%', marginTop: '8px' }}>
              Pay Securely via Razorpay
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
