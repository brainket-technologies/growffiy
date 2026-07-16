'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');
  const [footerText, setFooterText] = useState('');
  const [footerTagline, setFooterTagline] = useState('');
  const [footerDisclaimer, setFooterDisclaimer] = useState('');
  const [footerBottomTagline, setFooterBottomTagline] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportAddress, setSupportAddress] = useState('');

  useEffect(() => {
    const load = () => {
      setBrandLogo(localStorage.getItem('growffiy_brand_logo') || '');
      setBrandName(localStorage.getItem('growffiy_brand_name') || 'Growffiy');
      setFooterText(localStorage.getItem('growffiy_footer_text') || '');
      setFooterTagline(localStorage.getItem('growffiy_footer_tagline') || '');
      setFooterDisclaimer(localStorage.getItem('growffiy_footer_disclaimer') || '');
      setFooterBottomTagline(localStorage.getItem('growffiy_footer_bottom_tagline') || '');
      setSupportEmail(localStorage.getItem('growffiy_support_email') || '');
      setSupportPhone(localStorage.getItem('growffiy_support_phone') || '');
      setSupportAddress(localStorage.getItem('growffiy_support_address') || '');
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
              {footerTagline || 'Advanced algorithmic trading middleware connecting directly with Zerodha Kite API. Built for mathematical discipline and speed.'}
            </p>

          </div>

          {/* Platform */}
          <div>
            <div className="footer-col-title">Platform</div>
            <Link href="/products" className="footer-link">Products</Link>
            <Link href="/pricing" className="footer-link">Pricing</Link>
            <Link href="/about" className="footer-link">About Us</Link>
            <Link href="/login" className="footer-link" style={{ color: '#1E88FF' }}>Client Portal</Link>
          </div>

          {/* Legal */}
          <div>
            <div className="footer-col-title">Legal</div>
            <Link href="/privacy" className="footer-link">Privacy Policy</Link>
            <Link href="/terms" className="footer-link">Terms &amp; Conditions</Link>
            <Link href="/refund" className="footer-link">Refund Policy</Link>
            <Link href="/disclaimer" className="footer-link">Risk Disclaimer</Link>
          </div>

          {/* Contact */}
          <div>
            <div className="footer-col-title">Contact</div>
            <div className="footer-link" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Mail size={13} style={{ marginTop: 2, flexShrink: 0 }} /> {supportEmail || 'support@growffiy.in'}
            </div>
            <div className="footer-link" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Phone size={13} style={{ marginTop: 2, flexShrink: 0 }} /> {supportPhone || '+91-XXXX-XXXXXX'}
            </div>
            <div className="footer-link" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <MapPin size={13} style={{ marginTop: 2, flexShrink: 0 }} /> {supportAddress || 'Mumbai, India'}
            </div>
          </div>
        </div>

        <div className="footer-disclaimer">
          <strong style={{ color: 'var(--text-subtle)' }}>REGULATORY RISK DISCLAIMER:</strong>{' '}
          {footerDisclaimer || 'Algorithmic trading involves substantial financial risk. Growffiy is a software utility and is NOT a SEBI-registered investment advisor, broker, or portfolio manager. All simulated performance data shown does not represent guaranteed future results. Past performance is not indicative of future returns. Trade responsibly.'}
        </div>

        <div className="footer-bottom">
          <span>{footerText || '© 2026 Growffiy Inc. All rights reserved.'}</span>
          <span>{footerBottomTagline || 'Designed for NSE/BSE Intraday Algo Traders'}</span>
        </div>
      </div>
    </footer>
  );
}
