'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');
  const [footerText, setFooterText] = useState('');

  useEffect(() => {
    const load = () => {
      setBrandLogo(localStorage.getItem('growffiy_brand_logo') || '');
      setBrandName(localStorage.getItem('growffiy_brand_name') || 'Growffiy');
      setFooterText(localStorage.getItem('growffiy_footer_text') || '');
    };
    load();
    window.addEventListener('branding-updated', load);
    return () => window.removeEventListener('branding-updated', load);
  }, []);

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand */}
          <div>
            <div className="footer-brand-logo">
              <div className="footer-brand-logo-icon">
                {brandLogo ? <img src={brandLogo} alt={brandName} style={{ width: 18, height: 18, objectFit: 'contain' }} /> : <img src="/logo.png" alt={brandName} style={{ width: 18, height: 18, objectFit: 'contain' }} />}
              </div>
              <span className="footer-brand-name">{brandName.toUpperCase()}</span>
            </div>
            <p className="footer-brand-desc">
              Advanced algorithmic trading middleware connecting directly with Zerodha Kite API.
              Built for mathematical discipline and speed.
            </p>
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
              {['TW', 'TG', 'IN', 'YT'].map(s => (
                <div key={s} style={{
                  width: 32, height: 32, borderRadius: 8, background: '#1e293b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>{s}</div>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <div className="footer-col-title">Platform</div>
            <Link href="/#features" className="footer-link">Features</Link>
            <Link href="/#strategy" className="footer-link">Strategy</Link>
            <Link href="/#pricing" className="footer-link">Pricing</Link>
            <Link href="/vendor/login" className="footer-link" style={{ color: '#1E88FF' }}>Client Portal</Link>
          </div>

          {/* Legal */}
          <div>
            <div className="footer-col-title">Legal</div>
            <Link href="/vendor/privacy" className="footer-link">Privacy Policy</Link>
            <Link href="/vendor/terms" className="footer-link">Terms &amp; Conditions</Link>
            <Link href="/vendor/refund" className="footer-link">Refund Policy</Link>
            <Link href="/vendor/disclaimer" className="footer-link">Risk Disclaimer</Link>
          </div>

          {/* Contact */}
          <div>
            <div className="footer-col-title">Contact</div>
            <div className="footer-link" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Mail size={13} style={{ marginTop: 2, flexShrink: 0 }} /> support@growffiy.in
            </div>
            <div className="footer-link" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Phone size={13} style={{ marginTop: 2, flexShrink: 0 }} /> +91-XXXX-XXXXXX
            </div>
            <div className="footer-link" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <MapPin size={13} style={{ marginTop: 2, flexShrink: 0 }} /> Mumbai, India
            </div>
          </div>
        </div>

        <div className="footer-disclaimer">
          <strong style={{ color: 'var(--text-subtle)' }}>REGULATORY RISK DISCLAIMER:</strong>{' '}
          Algorithmic trading involves substantial financial risk. Growffiy is a software utility and is NOT a
          SEBI-registered investment advisor, broker, or portfolio manager. All simulated performance data shown
          does not represent guaranteed future results. Past performance is not indicative of future returns.
          Trade responsibly.
        </div>

        <div className="footer-bottom">
          <span>{footerText || '© 2026 Growffiy Inc. All rights reserved.'}</span>
          <span>Designed for NSE/BSE Intraday Algo Traders</span>
        </div>
      </div>
    </footer>
  );
}
