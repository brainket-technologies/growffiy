'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Mail, Phone, MapPin, Percent, CalendarDays, DollarSign, ThumbsUp } from 'lucide-react';

export default function Footer() {
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');
  const [footerText, setFooterText] = useState('');
  const [footerTagline, setFooterTagline] = useState('');
  const [footerDisclaimer, setFooterDisclaimer] = useState('');
  const [footerBottomTagline, setFooterBottomTagline] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [supportAddress, setSupportAddress] = useState('');

  // Social Links
  const [socialTelegram, setSocialTelegram] = useState('https://t.me/growffiy');
  const [socialYoutube, setSocialYoutube] = useState('https://youtube.com/@growffiy');
  const [socialTwitter, setSocialTwitter] = useState('https://x.com/growffiy');
  const [socialInstagram, setSocialInstagram] = useState('https://instagram.com/growffiy');
  const [socialFacebook, setSocialFacebook] = useState('https://facebook.com/growffiy');

  useEffect(() => {
    const load = () => {
      setBrandLogo(localStorage.getItem('growffiy_brand_logo') || '');
      setBrandName(localStorage.getItem('growffiy_brand_name') || 'Growffiy');
      setFooterText(localStorage.getItem('growffiy_footer_text') || '');
      setFooterTagline(localStorage.getItem('growffiy_footer_tagline') || '');
      setFooterDisclaimer(localStorage.getItem('growffiy_footer_disclaimer') || '');
      setFooterBottomTagline(localStorage.getItem('growffiy_footer_bottom_tagline') || '');
      setSupportEmail(localStorage.getItem('growffiy_support_email') || 'support@growffiy.com');
      setSupportPhone(localStorage.getItem('growffiy_support_phone') || '+91 902666305');
      setSupportWhatsapp(localStorage.getItem('growffiy_support_whatsapp') || '+91 902666305');
      setSupportAddress(localStorage.getItem('growffiy_support_address') || 'Mumbai, India');
      setSocialTelegram(localStorage.getItem('growffiy_social_telegram') !== null ? localStorage.getItem('growffiy_social_telegram')! : 'https://t.me/growffiy');
      setSocialYoutube(localStorage.getItem('growffiy_social_youtube') !== null ? localStorage.getItem('growffiy_social_youtube')! : 'https://youtube.com/@growffiy');
      setSocialTwitter(localStorage.getItem('growffiy_social_twitter') !== null ? localStorage.getItem('growffiy_social_twitter')! : 'https://x.com/growffiy');
      setSocialInstagram(localStorage.getItem('growffiy_social_instagram') !== null ? localStorage.getItem('growffiy_social_instagram')! : 'https://instagram.com/growffiy');
      setSocialFacebook(localStorage.getItem('growffiy_social_facebook') !== null ? localStorage.getItem('growffiy_social_facebook')! : 'https://facebook.com/growffiy');
    };
    load();

    // Also fetch dynamically to ensure public route syncs settings
    const fetchPublicSettings = async () => {
      try {
        const res = await fetch('/api/settings/public');
        const data = await res.json();
        if (data.success) {
          setSocialTelegram(data.socialTelegram || '');
          localStorage.setItem('growffiy_social_telegram', data.socialTelegram || '');
          
          setSocialYoutube(data.socialYoutube || '');
          localStorage.setItem('growffiy_social_youtube', data.socialYoutube || '');
          
          setSocialTwitter(data.socialTwitter || '');
          localStorage.setItem('growffiy_social_twitter', data.socialTwitter || '');
          
          setSocialInstagram(data.socialInstagram || '');
          localStorage.setItem('growffiy_social_instagram', data.socialInstagram || '');
          
          setSocialFacebook(data.socialFacebook || '');
          localStorage.setItem('growffiy_social_facebook', data.socialFacebook || '');

          if (data.supportPhone) {
            setSupportPhone(data.supportPhone);
            localStorage.setItem('growffiy_support_phone', data.supportPhone);
          }
          if (data.supportWhatsapp) {
            setSupportWhatsapp(data.supportWhatsapp);
            localStorage.setItem('growffiy_support_whatsapp', data.supportWhatsapp);
          }
        }
      } catch (e) {
        console.error('Failed to sync public social settings:', e);
      }
    };
    fetchPublicSettings();

    window.addEventListener('branding-updated', load);
    return () => window.removeEventListener('branding-updated', load);
  }, []);

  return (
    <>
      {/* Trust Banner Section (placed above the footer) */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 48px', padding: '0 24px' }}>
        <div className="footer-trust-banner" style={{ marginBottom: 0 }}>
          <div className="footer-trust-item">
            <div className="footer-trust-icon-wrapper">
              <Percent size={18} />
            </div>
            <div className="footer-trust-text">
              <span className="footer-trust-title">No Hidden Charges</span>
              <span className="footer-trust-subtitle">Transparent Pricing</span>
            </div>
          </div>

          <div className="footer-trust-item">
            <div className="footer-trust-icon-wrapper">
              <CalendarDays size={18} />
            </div>
            <div className="footer-trust-text">
              <span className="footer-trust-title">Cancel Anytime</span>
              <span className="footer-trust-subtitle">No Questions Asked</span>
            </div>
          </div>

          <div className="footer-trust-item">
            <div className="footer-trust-icon-wrapper">
              <DollarSign size={18} />
            </div>
            <div className="footer-trust-text">
              <span className="footer-trust-title">7-Day Money Back</span>
              <span className="footer-trust-subtitle">Risk Free Guarantee</span>
            </div>
          </div>

          <div className="footer-trust-item">
            <div className="footer-trust-icon-wrapper">
              <ThumbsUp size={18} />
            </div>
            <div className="footer-trust-text">
              <span className="footer-trust-title">Trusted by Thousands</span>
              <span className="footer-trust-subtitle">Real Traders, Real Results</span>
            </div>
          </div>
        </div>
      </div>

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

              {/* Social media icons grid with premium styles */}
              {(socialTelegram || socialYoutube || socialTwitter || socialInstagram || socialFacebook) && (
                <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                  {socialTelegram && (
                    <a href={socialTelegram} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Telegram">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-15deg)' }}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </a>
                  )}
                  {socialYoutube && (
                    <a href={socialYoutube} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="YouTube">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17Z"/><polygon points="10 15 15 12 10 9"/></svg>
                    </a>
                  )}
                  {socialTwitter && (
                    <a href={socialTwitter} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Twitter / X">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>
                    </a>
                  )}
                  {socialInstagram && (
                    <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Instagram">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    </a>
                  )}
                  {socialFacebook && (
                    <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="footer-social-btn" title="Facebook">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Services */}
            <div>
              <div className="footer-col-title">Services</div>
              <Link href="/products" className="footer-link">Products</Link>
              <Link href="/scanner" className="footer-link">Scanner</Link>
              <Link href="/algo-trading" className="footer-link">Algo Trading</Link>
            </div>

            {/* Company */}
            <div>
              <div className="footer-col-title">Company</div>
              <Link href="/pricing" className="footer-link">Pricing</Link>
              <Link href="/about" className="footer-link">About Us</Link>
              <Link href="/login" className="footer-link">Client Portal</Link>
              <Link href="/staff/login" className="footer-link">Staff Login</Link>
            </div>

            {/* Legal */}
            <div>
              <div className="footer-col-title">Legal</div>
              <Link href="/privacy" className="footer-link">Privacy Policy</Link>
              <Link href="/terms" className="footer-link">Terms &amp; Conditions</Link>
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
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-consultation-modal'))}
                style={{
                  marginTop: '16px',
                  background: '#1E88FF',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'center',
                  boxShadow: '0 4px 12px rgba(30, 136, 255, 0.25)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1565C0'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(21, 101, 192, 0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1E88FF'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 136, 255, 0.25)'; }}
              >
                Book Appointment
              </button>
            </div>
          </div>

          <div className="footer-disclaimer">
            <strong style={{ color: 'var(--text-subtle)' }}>REGULATORY RISK DISCLAIMER:</strong>{' '}
            {footerDisclaimer || 'Algorithmic trading involves substantial financial risk. Growffiy is a software utility and is NOT a SEBI-registered investment advisor, broker, or portfolio manager. All simulated performance data shown does not represent guaranteed future results. Past performance is not indicative of future returns. Trade responsibly.'}
          </div>

          <div className="footer-bottom">
            <span>{footerText || '© 2026 Growffiy Inc. All rights reserved.'}</span>
            
            {/* Centered Clean Integration Badge - In the middle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Partner With</span>
              <img src="/zerodha_logo.svg" alt="Zerodha" style={{ height: '16px', width: 'auto', opacity: 0.85 }} />
            </div>

            <span>{footerBottomTagline || 'Designed for NSE/BSE Intraday Algo Traders'}</span>
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons (Left Side) */}
      <style>{`
        @keyframes floatPulse {
          0% { transform: scale(1); box-shadow: 0 8px 24px rgba(30, 136, 255, 0.4); }
          50% { transform: scale(1.08); box-shadow: 0 12px 30px rgba(30, 136, 255, 0.6); }
          100% { transform: scale(1); box-shadow: 0 8px 24px rgba(30, 136, 255, 0.4); }
        }
        @keyframes floatPulseGreen {
          0% { transform: scale(1); box-shadow: 0 8px 24px rgba(37, 211, 102, 0.4); }
          50% { transform: scale(1.08); box-shadow: 0 12px 30px rgba(37, 211, 102, 0.6); }
          100% { transform: scale(1); box-shadow: 0 8px 24px rgba(37, 211, 102, 0.4); }
        }
        .float-call-btn {
          animation: floatPulse 3s infinite ease-in-out;
        }
        .float-wa-btn {
          animation: floatPulseGreen 3s infinite ease-in-out;
          animation-delay: 1.5s;
        }
        @media (max-width: 768px) {
          .float-right-tab {
            display: none !important;
          }
          .floating-contact-container {
            left: 16px !important;
            bottom: 16px !important;
            gap: 8px !important;
          }
          .float-call-btn, .float-wa-btn {
            width: 44px !important;
            height: 44px !important;
          }
          .float-call-btn svg, .float-wa-btn svg {
            width: 20px !important;
            height: 20px !important;
          }
        }
      `}</style>
      <div className="floating-contact-container" style={{
        position: 'fixed',
        left: '24px',
        bottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 9999
      }}>
        {/* Call Float */}
        <a
          href={`tel:${supportPhone.replace(/[\s\(\)\-+]/g, '')}`}
          className="float-call-btn"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#1E88FF',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15) translateY(-3px)'; e.currentTarget.style.animation = 'none'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.animation = 'floatPulse 3s infinite ease-in-out'; }}
          title={`Call support: ${supportPhone}`}
        >
          <Phone size={24} />
        </a>

        {/* WhatsApp Float */}
        <a
          href={`https://wa.me/${supportWhatsapp.replace(/[\s\(\)\-+]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="float-wa-btn"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#25D366',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15) translateY(-3px)'; e.currentTarget.style.animation = 'none'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.animation = 'floatPulseGreen 3s infinite ease-in-out 1.5s'; }}
          title={`Chat on WhatsApp: ${supportWhatsapp}`}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 2.016 14.12 1.01 11.516 1.01c-5.44 0-9.866 4.372-9.87 9.802 0 1.689.451 3.337 1.309 4.793L1.99 21.019l5.656-1.865zm10.985-7.79c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
        </a>
      </div>

      {/* Right Side Vertical Floating Banners */}
      <style>{`
        .float-right-tab {
          position: fixed;
          right: 0;
          color: white;
          padding: 20px 8px;
          border: none;
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.3s ease, box-shadow 0.3s ease;
          z-index: 9999;
          text-decoration: none;
        }
        .float-right-tab-algo {
          top: 36%;
          transform: translate(0, -50%);
          background-color: #1E88FF;
          box-shadow: -4px 0 16px rgba(30, 136, 255, 0.25);
          min-height: 160px;
          padding: 26px 8px;
        }
        .float-right-tab-scanner {
          top: 56%;
          transform: translate(0, -50%);
          background-color: #10b981;
          box-shadow: -4px 0 16px rgba(16, 185, 129, 0.25);
          min-height: 100px;
        }
        .float-right-tab-algo:hover {
          transform: translate(-8px, -50%);
          background-color: #1565C0;
          box-shadow: -6px 0 20px rgba(21, 101, 192, 0.4);
        }
        .float-right-tab-scanner:hover {
          transform: translate(-8px, -50%);
          background-color: #059669;
          box-shadow: -6px 0 20px rgba(5, 150, 105, 0.4);
        }
        @media (min-width: 992px) {
          .footer-grid {
            grid-template-columns: 1.8fr 1fr 1fr 1fr 1.2fr !important;
          }
        }
      `}</style>

      {/* Algo Trading Tab */}
      <Link
        href="/algo-trading"
        className="float-right-tab float-right-tab-algo"
      >
        <span style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '1px',
          wordSpacing: '8px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap'
        }}>
          Algo Trading
        </span>
      </Link>

      {/* Scanner Tab */}
      <Link
        href="/scanner"
        className="float-right-tab float-right-tab-scanner"
      >
        <span style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap'
        }}>
          Scanner
        </span>
      </Link>
    </>
  );
}
