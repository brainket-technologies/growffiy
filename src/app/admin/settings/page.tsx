'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { Button } from '../../../shared/components/views/Button';
import RichTextEditor from '../../../shared/components/views/RichTextEditor';
import { Shield, Server, RefreshCw, Key, Eye, EyeOff, CheckCircle2, AlertTriangle, ToggleLeft, ToggleRight, Mail, CreditCard, Globe, Info, LifeBuoy, Clock, Calendar, Plus, Trash2, Image, Search, FileText, Upload } from 'lucide-react';
import { api } from '../../../shared/services/api';
import { Modal } from '../../../shared/components/views/Modal';
import { API_ENDPOINTS } from '../../../core/constants';


type TabType = 'payments' | 'smtp' | 'support' | 'algo' | 'calendar' | 'branding' | 'website' | 'legal';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('payments');

  // Razorpay
  const [razorpayTestKeyId, setRazorpayTestKeyId] = useState('');
  const [razorpayTestKeySecret, setRazorpayTestKeySecret] = useState('');
  const [razorpayLiveKeyId, setRazorpayLiveKeyId] = useState('');
  const [razorpayLiveKeySecret, setRazorpayLiveKeySecret] = useState('');
  const [razorpayMode, setRazorpayMode] = useState('test');

  // SMTP
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSenderName, setSmtpSenderName] = useState('Growffiy');
  const [smtpEncryption, setSmtpEncryption] = useState('tls');
  const [smtpStatus, setSmtpStatus] = useState('false'); // 'true' or 'false'

  // Support contact info
  const [supportEmail, setSupportEmail] = useState('support@growffiy.com');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [supportTimings, setSupportTimings] = useState('Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)');
  const [supportAddress, setSupportAddress] = useState('Mumbai, India');

  // Algo Timings (global infrastructure only)
  const [algoPreopenFetchTime, setAlgoPreopenFetchTime] = useState('09:08');
  const [algoTokenRefreshTime, setAlgoTokenRefreshTime] = useState('08:00');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [googleCredentialsJson, setGoogleCredentialsJson] = useState('');

  // Auto Trade Calendar
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(true);
  const [tradingDays, setTradingDays] = useState<string[]>(['Mon','Tue','Wed','Thu','Fri']);
  const [specialDays, setSpecialDays] = useState<{ date: string; name: string }[]>([]);
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>([]);

  const [newSpecialDay, setNewSpecialDay] = useState('');
  const [newSpecialDayName, setNewSpecialDayName] = useState('');
  const [newHoliday, setNewHoliday] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const [showSpecialDayModal, setShowSpecialDayModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
const today = new Date();
const [viewDate, setViewDate] = useState(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);

const [deleteTarget, setDeleteTarget] = useState<{ type: 'special' | 'holiday'; date: string; name: string } | null>(null);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Branding
  const [appName, setAppName] = useState('Growffiy');
  const [appTitle, setAppTitle] = useState('Growffiy — Algo Trading Terminal');
  const [appFavicon, setAppFavicon] = useState('');
  const [appLogo, setAppLogo] = useState('');

  // Website / SEO
  const [heroTitle, setHeroTitle] = useState('Automate Your<br /><span class="text-gradient">Stock Market</span><br />Trades Smarter');
  const [heroSubtitle, setHeroSubtitle] = useState('Growffiy connects to your Zerodha Kite API and executes pre-open momentum breakout strategies with strict 1% risk management — fully automated.');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [footerText, setFooterText] = useState('');
  const [footerTagline, setFooterTagline] = useState('Advanced algorithmic trading middleware connecting directly with Zerodha Kite API. Built for mathematical discipline and speed.');
  const [footerDisclaimer, setFooterDisclaimer] = useState('Algorithmic trading involves substantial financial risk. Growffiy is a software utility and is NOT a SEBI-registered investment advisor, broker, or portfolio manager. All simulated performance data shown does not represent guaranteed future results. Past performance is not indicative of future returns. Trade responsibly.');
  const [footerBottomTagline, setFooterBottomTagline] = useState('Designed for NSE/BSE Intraday Algo Traders');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');

  // Legal Pages
  const [legalActivePage, setLegalActivePage] = useState<'privacy' | 'terms' | 'refund' | 'disclaimer' | 'faq'>('privacy');
  const [legalPrivacyContent, setLegalPrivacyContent] = useState('');
  const [legalTermsContent, setLegalTermsContent] = useState('');
  const [legalRefundContent, setLegalRefundContent] = useState('');
  const [legalDisclaimerContent, setLegalDisclaimerContent] = useState('');
  const [legalFaqContent, setLegalFaqContent] = useState('');
  const defaultFaqItems: {q: string; a: string}[] = [
    {q: "How does the Pre-Open Momentum Breakout strategy work?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">The Pre-Open Momentum Breakout strategy scans NSE/BSE stocks during the pre-open session (9:00-9:08 AM) to identify high-momentum candidates based on volume and price thresholds. Once identified, it places automated MIS (Margin Intraday Squared-off) orders at market open. All orders are squared off by 3:15 PM automatically.</p>"},
    {q: "How is position sizing calculated?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">Position sizing is calculated based on your configured risk per trade (default 5-8% of available capital) and the stock's current market price. The system automatically calculates the number of lots or shares to allocate to each trade, ensuring no single position exceeds your predefined risk tolerance.</p>"},
    {q: "Do I need a Zerodha Kite Connect subscription?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">Yes, Growffiy requires an active Zerodha Kite Connect subscription (API access). Your Zerodha account must have Kite Connect enabled, and you will need to generate API Key, API Secret, and Access Token from the Zerodha Kite Console. The free tier of Kite Connect (3 tokens) is sufficient for getting started.</p>"},
    {q: "Can I pause the bot at any time?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">Absolutely. You can pause or stop the automated trading bot at any time from your client dashboard. When paused, no new trades will be placed. Any open positions held at the time of pausing will continue until their configured square-off time (3:15 PM) unless manually closed from your broker terminal.</p>"},
    {q: "What happens if my internet goes down during a trade?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">Growffiy runs on cloud servers, not your local machine. Once a strategy is deployed and active, trade execution continues server-side regardless of your internet connectivity. However, you may lose visibility of real-time updates on your dashboard until your connection is restored. All trades follow their pre-configured square-off schedule.</p>"},
  ];
  const [faqItems, setFaqItems] = useState<{q: string; a: string}[]>(defaultFaqItems);
  const [legalPreview, setLegalPreview] = useState(false);

  // UI Status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTestSecret, setShowTestSecret] = useState(false);
  const [showLiveSecret, setShowLiveSecret] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [infoModal, setInfoModal] = useState<{ title: string; content: React.ReactNode } | null>(null);


  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.SETTINGS);
        if (res.success && res.settings) {
          setRazorpayTestKeyId(res.settings.razorpay_test_key_id || '');
          setRazorpayTestKeySecret(res.settings.razorpay_test_key_secret || '');
          setRazorpayLiveKeyId(res.settings.razorpay_live_key_id || '');
          setRazorpayLiveKeySecret(res.settings.razorpay_live_key_secret || '');
          setRazorpayMode(res.settings.razorpay_mode || 'test');
          
          setSmtpHost(res.settings.smtp_host || '');
          setSmtpPort(res.settings.smtp_port || '587');
          setSmtpUser(res.settings.smtp_user || '');
          setSmtpPassword(res.settings.smtp_password || '');
          setSmtpSenderName(res.settings.smtp_sender_name || 'Growffiy');
          setSmtpEncryption(res.settings.smtp_encryption || 'tls');
          setSmtpStatus(res.settings.smtp_status || 'false');

          setSupportEmail(res.settings.support_email || 'support@growffiy.com');
          setSupportPhone(res.settings.support_phone || '+91 98765 43210');
          setSupportTimings(res.settings.support_timings || 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)');
          setSupportAddress(res.settings.support_address || 'Mumbai, India');
          localStorage.setItem('growffiy_support_email', res.settings.support_email || 'support@growffiy.com');
          localStorage.setItem('growffiy_support_phone', res.settings.support_phone || '+91 98765 43210');
          localStorage.setItem('growffiy_support_address', res.settings.support_address || 'Mumbai, India');

          setAlgoPreopenFetchTime(res.settings.algo_preopen_fetch_time || '09:08');
          setAlgoTokenRefreshTime(res.settings.algo_token_refresh_time || '08:00');
          setGoogleSheetUrl(res.settings.google_sheet_url || '');
          setGoogleCredentialsJson(res.settings.google_credentials_json || '');

          setAutoTradeEnabled(res.settings.auto_trade_enabled !== 'false');
          try { setTradingDays(JSON.parse(res.settings.trading_days || '["Mon","Tue","Wed","Thu","Fri"]')); } catch {}
          try { setSpecialDays(JSON.parse(res.settings.special_market_days || '[]')); } catch {}
          try { setHolidays(JSON.parse(res.settings.market_holidays || '[]')); } catch {}

          setAppName(res.settings.app_name || 'Growffiy');
          setAppTitle(res.settings.app_title || 'Growffiy — Algo Trading Terminal');
          setAppFavicon(res.settings.app_favicon || '');
          setAppLogo(res.settings.app_logo || '');
          setHeroTitle(res.settings.hero_title || 'Automate Your<br /><span class="text-gradient">Stock Market</span><br />Trades Smarter');
          setHeroSubtitle(res.settings.hero_subtitle || 'Growffiy connects to your Zerodha Kite API and executes pre-open momentum breakout strategies with strict 1% risk management — fully automated.');
          setMetaDescription(res.settings.meta_description || '');
          setMetaKeywords(res.settings.meta_keywords || '');
          setFooterText(res.settings.footer_text || '');
          setFooterTagline(res.settings.footer_tagline || 'Advanced algorithmic trading middleware connecting directly with Zerodha Kite API. Built for mathematical discipline and speed.');
          setFooterDisclaimer(res.settings.footer_disclaimer || 'Algorithmic trading involves substantial financial risk. Growffiy is a software utility and is NOT a SEBI-registered investment advisor, broker, or portfolio manager. All simulated performance data shown does not represent guaranteed future results. Past performance is not indicative of future returns. Trade responsibly.');
          setFooterBottomTagline(res.settings.footer_bottom_tagline || 'Designed for NSE/BSE Intraday Algo Traders');
          localStorage.setItem('growffiy_footer_tagline', res.settings.footer_tagline || 'Advanced algorithmic trading middleware connecting directly with Zerodha Kite API. Built for mathematical discipline and speed.');
          localStorage.setItem('growffiy_footer_disclaimer', res.settings.footer_disclaimer || 'Algorithmic trading involves substantial financial risk. Growffiy is a software utility and is NOT a SEBI-registered investment advisor, broker, or portfolio manager. All simulated performance data shown does not represent guaranteed future results. Past performance is not indicative of future returns. Trade responsibly.');
          localStorage.setItem('growffiy_footer_bottom_tagline', res.settings.footer_bottom_tagline || 'Designed for NSE/BSE Intraday Algo Traders');
          setGoogleAnalyticsId(res.settings.google_analytics_id || '');
          setLegalPrivacyContent(res.settings.legal_privacy_content || '');
          setLegalTermsContent(res.settings.legal_terms_content || '');
          setLegalRefundContent(res.settings.legal_refund_content || '');
          setLegalDisclaimerContent(res.settings.legal_disclaimer_content || '');
          setLegalFaqContent(res.settings.legal_faq_content || '');
          try {
            const parsed = JSON.parse(res.settings.legal_faq_content || '[]');
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFaqItems(parsed);
            }
          } catch {}
        }
      } catch (err: any) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      const res = await api.put(API_ENDPOINTS.SETTINGS, {
        razorpay_test_key_id: razorpayTestKeyId,
        razorpay_test_key_secret: razorpayTestKeySecret,
        razorpay_live_key_id: razorpayLiveKeyId,
        razorpay_live_key_secret: razorpayLiveKeySecret,
        razorpay_mode: razorpayMode,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_user: smtpUser,
        smtp_password: smtpPassword,
        smtp_sender_name: smtpSenderName,
        smtp_encryption: smtpEncryption,
        smtp_status: smtpStatus,
        support_email: supportEmail,
        support_phone: supportPhone,
        support_timings: supportTimings,
        support_address: supportAddress,
        algo_preopen_fetch_time: algoPreopenFetchTime,
        algo_token_refresh_time: algoTokenRefreshTime,
        google_sheet_url: googleSheetUrl,
        google_credentials_json: googleCredentialsJson,
        auto_trade_enabled: autoTradeEnabled ? 'true' : 'false',
        trading_days: JSON.stringify(tradingDays),
        special_market_days: JSON.stringify(specialDays),
        market_holidays: JSON.stringify(holidays),
        app_name: appName,
        app_title: appTitle,
        app_favicon: appFavicon,
        app_logo: appLogo,
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        footer_text: footerText,
        footer_tagline: footerTagline,
        footer_disclaimer: footerDisclaimer,
        footer_bottom_tagline: footerBottomTagline,
        google_analytics_id: googleAnalyticsId,
        legal_privacy_content: legalPrivacyContent,
        legal_terms_content: legalTermsContent,
        legal_refund_content: legalRefundContent,
        legal_disclaimer_content: legalDisclaimerContent,
        legal_faq_content: JSON.stringify(faqItems),
      });


      if (res.success) {
        localStorage.setItem('growffiy_brand_logo', appLogo);
        localStorage.setItem('growffiy_brand_name', appName);
        localStorage.setItem('growffiy_brand_title', appTitle);
        localStorage.setItem('growffiy_hero_title', heroTitle);
        localStorage.setItem('growffiy_hero_subtitle', heroSubtitle);
        localStorage.setItem('growffiy_meta_description', metaDescription);
        localStorage.setItem('growffiy_meta_keywords', metaKeywords);
        localStorage.setItem('growffiy_footer_text', footerText);
        localStorage.setItem('growffiy_footer_tagline', footerTagline);
        localStorage.setItem('growffiy_footer_disclaimer', footerDisclaimer);
        localStorage.setItem('growffiy_footer_bottom_tagline', footerBottomTagline);
        localStorage.setItem('growffiy_support_email', supportEmail);
        localStorage.setItem('growffiy_support_phone', supportPhone);
        localStorage.setItem('growffiy_support_address', supportAddress);
        window.dispatchEvent(new Event('branding-updated'));
        setNotification({
          type: 'success',
          message: 'System settings successfully synchronized and saved to Postgres DB.',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification({
          type: 'error',
          message: res.error || 'Failed to update system settings.',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error updating settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
        <div className="live-dot" style={{ width: '16px', height: '16px', backgroundColor: 'var(--primary)' }}></div>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '15px' }}>Loading settings...</div>
      </div>
    );
  }

  const StatusRow = ({ label, value, status }: { label: string; value?: string; status?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
        {value ? value : status !== undefined ? (status ? <span style={{ color: 'var(--accent)' }}>✓ {label === 'Holiday' ? 'Not a holiday' : label === 'Special Day' ? 'Special session' : 'Yes'}</span> : <span style={{ color: 'var(--danger)' }}>✕ No</span>) : ''}
      </span>
    </div>
  );

  const ImagePicker = ({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) => {
    const [dragOver, setDragOver] = useState(false);
    const [mode, setMode] = useState<'url' | 'upload'>('url');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => { if (reader.result) onChange(reader.result as string); };
      reader.readAsDataURL(file);
    };

    return (
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button type="button" onClick={() => setMode('url')} style={{
            flex: 1, border: 'none', padding: '6px 0', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            background: mode === 'url' ? 'var(--primary)' : 'var(--surface)',
            color: mode === 'url' ? 'white' : 'var(--text-muted)',
          }}>URL</button>
          <button type="button" onClick={() => setMode('upload')} style={{
            flex: 1, border: 'none', padding: '6px 0', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            background: mode === 'upload' ? 'var(--primary)' : 'var(--surface)',
            color: mode === 'upload' ? 'white' : 'var(--text-muted)',
          }}>Upload</button>
        </div>
        {mode === 'url' ? (
          <input type="text" placeholder="https://example.com/image.png" value={value} onChange={(e) => onChange(e.target.value)}
            style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%', minHeight: '80px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
              border: dragOver ? '2px solid var(--primary)' : '2px dashed var(--border-color)',
              background: dragOver ? 'rgba(59,130,246,0.05)' : 'var(--bg-primary)',
              color: 'var(--text-muted)', fontSize: '12px', transition: 'all 0.2s',
            }}
          >
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            <Upload size={20} />
            <span>Drag & drop or click to upload</span>
          </div>
        )}
        {value && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={value} alt="preview" style={{ maxHeight: '50px', maxWidth: '100px', borderRadius: '6px', border: '1px solid var(--border-color)', objectFit: 'contain' }} />
            <button type="button" onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '12px', fontWeight: 600, padding: '4px 8px' }}>Remove</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', letterSpacing: '-0.5px' }}>
          Terminal Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Configure global execution modes, mail credentials, payment tokens, and auto-risk sizes.
        </p>
      </div>

      {notification && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: notification.type === 'success' ? 'var(--accent-light)' : 'rgba(239, 68, 68, 0.08)',
          color: notification.type === 'success' ? 'var(--accent-dark)' : 'var(--danger)',
          border: `1px solid ${notification.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          fontSize: '14px',
          fontWeight: 600,
          boxShadow: 'var(--shadow-sm)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Tabs Switcher Navigation Bar */}
      <div style={{ display: 'flex', background: 'var(--surface)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border)', width: 'fit-content' }}>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: activeTab === 'payments' ? 'var(--bg-white)' : 'transparent',
            color: activeTab === 'payments' ? 'var(--text-heading)' : 'var(--text-muted)',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: activeTab === 'payments' ? 700 : 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'payments' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <CreditCard size={15} />
          Payment Gateway
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('smtp')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: activeTab === 'smtp' ? 'var(--bg-white)' : 'transparent',
            color: activeTab === 'smtp' ? 'var(--text-heading)' : 'var(--text-muted)',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: activeTab === 'smtp' ? 700 : 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'smtp' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <Mail size={15} />
          SMTP Mail
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('support')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: activeTab === 'support' ? 'var(--bg-white)' : 'transparent',
            color: activeTab === 'support' ? 'var(--text-heading)' : 'var(--text-muted)',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: activeTab === 'support' ? 700 : 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'support' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <LifeBuoy size={15} />
          Support Info
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('algo')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: activeTab === 'algo' ? 'var(--bg-white)' : 'transparent',
            color: activeTab === 'algo' ? 'var(--text-heading)' : 'var(--text-muted)',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: activeTab === 'algo' ? 700 : 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'algo' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <Clock size={15} />
          Algo Timings
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: activeTab === 'calendar' ? 'var(--bg-white)' : 'transparent',
            color: activeTab === 'calendar' ? 'var(--text-heading)' : 'var(--text-muted)',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: activeTab === 'calendar' ? 700 : 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'calendar' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <Calendar size={15} />
          Market Calendar
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: activeTab === 'branding' ? 'var(--bg-white)' : 'transparent',
            color: activeTab === 'branding' ? 'var(--text-heading)' : 'var(--text-muted)',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: activeTab === 'branding' ? 700 : 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'branding' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <Image size={15} />
          Branding
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('website')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: activeTab === 'website' ? 'var(--bg-white)' : 'transparent',
            color: activeTab === 'website' ? 'var(--text-heading)' : 'var(--text-muted)',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: activeTab === 'website' ? 700 : 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'website' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <Globe size={15} />
          Website
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('legal')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: activeTab === 'legal' ? 'var(--bg-white)' : 'transparent',
            color: activeTab === 'legal' ? 'var(--text-heading)' : 'var(--text-muted)',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: activeTab === 'legal' ? 700 : 600,
            cursor: 'pointer',
            boxShadow: activeTab === 'legal' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          <FileText size={15} />
          Legal Pages
        </button>
      </div>


      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Payments View Tab */}
        {activeTab === 'payments' && (
          <Card style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Razorpay API Credentials
                  <button
                    type="button"
                    title="How to get Razorpay API Keys"
                    onClick={() => setInfoModal({
                      title: 'How to Get Razorpay API Keys',
                      content: (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', lineHeight: 1.6, fontSize: '14px', color: 'var(--text-body)' }}>
                          <p>To acquire your Razorpay API Credentials, please follow these steps:</p>
                          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li>Open the direct link to the <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Razorpay API Keys Page</a>.</li>
                            <li>If prompted, log in to your official <a href="https://dashboard.razorpay.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Razorpay Account</a>.</li>
                            <li>Once on the Keys page, choose the environment you want to configure by switching the dashboard header mode (e.g. <strong>Test Mode</strong> or <strong>Live Mode</strong>).</li>
                            <li>Click on the <strong>Generate Key</strong> (or <strong>Regenerate Key</strong>) button.</li>
                            <li>Copy both the <strong>Key ID</strong> and <strong>Key Secret</strong> shown on the popup.</li>
                            <li>Paste the copied credentials into the respective card fields in this panel.</li>
                          </ol>
                        </div>
                      )
                    })}
                    style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <Info size={16} />
                  </button>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Manage payment credentials for client registration and plans.
                </p>
              </div>

              {/* Toggle Switch */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                backgroundColor: 'var(--surface)', 
                padding: '4px 14px', 
                borderRadius: '20px', 
                border: '1px solid var(--border)' 
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: razorpayMode === 'test' ? 'var(--primary)' : 'var(--text-muted)' }}>TEST MODE</span>
                <button
                  type="button"
                  onClick={async () => {
                    const nextMode = razorpayMode === 'test' ? 'live' : 'test';
                    setRazorpayMode(nextMode);
                    try {
                      await api.put(API_ENDPOINTS.SETTINGS, { razorpay_mode: nextMode });
                    } catch (err) {
                      console.error('Instant Razorpay toggle error:', err);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: razorpayMode === 'live' ? 'var(--accent)' : 'var(--text-subtle)'
                  }}
                >
                  {razorpayMode === 'live' ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
                <span style={{ fontSize: '11px', fontWeight: 700, color: razorpayMode === 'live' ? 'var(--accent-dark)' : 'var(--text-muted)' }}>LIVE MODE</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              
              {/* Test Column */}
              <div style={{ 
                padding: '24px', 
                borderRadius: '12px', 
                border: '1px solid ' + (razorpayMode === 'test' ? 'rgba(14, 165, 233, 0.25)' : 'var(--border-light)'), 
                backgroundColor: razorpayMode === 'test' ? 'rgba(14, 165, 233, 0.01)' : 'transparent',
                opacity: razorpayMode === 'test' ? 1 : 0.6,
                transition: 'all 0.2s'
              }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: razorpayMode === 'test' ? 'var(--primary)' : 'var(--text-secondary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: razorpayMode === 'test' ? 'var(--primary)' : 'transparent', display: 'inline-block' }}></span>
                  🧪 Test Gateway {razorpayMode === 'test' && '(Active)'}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Test Key ID
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Key size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                      <input
                        type="text"
                        required={razorpayMode === 'test'}
                        value={razorpayTestKeyId}
                        onChange={(e) => setRazorpayTestKeyId(e.target.value)}
                        placeholder="rzp_test_xxxxxxxx"
                        style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Test Key Secret
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Key size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                      <input
                        type={showTestSecret ? 'text' : 'password'}
                        required={razorpayMode === 'test'}
                        value={razorpayTestKeySecret}
                        onChange={(e) => setRazorpayTestKeySecret(e.target.value)}
                        placeholder="Enter Test Key Secret"
                        style={{ paddingLeft: '36px', paddingRight: '36px', height: '38px', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowTestSecret(!showTestSecret)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {showTestSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Column */}
              <div style={{ 
                padding: '24px', 
                borderRadius: '12px', 
                border: '1px solid ' + (razorpayMode === 'live' ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-light)'), 
                backgroundColor: razorpayMode === 'live' ? 'rgba(16, 185, 129, 0.01)' : 'transparent',
                opacity: razorpayMode === 'live' ? 1 : 0.6,
                transition: 'all 0.2s'
              }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: razorpayMode === 'live' ? 'var(--accent-dark)' : 'var(--text-secondary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: razorpayMode === 'live' ? 'var(--accent)' : 'transparent', display: 'inline-block' }}></span>
                  🟢 Live Gateway {razorpayMode === 'live' && '(Active)'}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Live Key ID
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Key size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                      <input
                        type="text"
                        required={razorpayMode === 'live'}
                        value={razorpayLiveKeyId}
                        onChange={(e) => setRazorpayLiveKeyId(e.target.value)}
                        placeholder="rzp_live_xxxxxxxx"
                        style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Live Key Secret
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Key size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                      <input
                        type={showLiveSecret ? 'text' : 'password'}
                        required={razorpayMode === 'live'}
                        value={razorpayLiveKeySecret}
                        onChange={(e) => setRazorpayLiveKeySecret(e.target.value)}
                        placeholder="Enter Live Key Secret"
                        style={{ paddingLeft: '36px', paddingRight: '36px', height: '38px', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLiveSecret(!showLiveSecret)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {showLiveSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action inside Box */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '24px' }}>
              <Button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 28px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                  color: 'white',
                  boxShadow: 'var(--shadow-blue)'
                }}
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save & Apply Settings'}
              </Button>
            </div>
          </Card>
        )}

        {/* SMTP Configuration View Tab */}
        {activeTab === 'smtp' && (
          <Card style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  SMTP Mail Settings
                  <button
                    type="button"
                    title="How to get SMTP Credentials"
                    onClick={() => setInfoModal({
                      title: 'How to Configure SMTP Mail Server',
                      content: (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', lineHeight: 1.6, fontSize: '14px', color: 'var(--text-body)' }}>
                          <p>Configure your outgoing SMTP email server using the instructions below:</p>
                          
                          <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                            <strong style={{ color: 'var(--text-heading)', display: 'block', marginBottom: '4px' }}>Option A: Gmail / Google Workspace (Recommended)</strong>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <li>Set <strong>SMTP Host</strong> to: <code style={{ backgroundColor: 'var(--surface)', padding: '2px 6px', borderRadius: '4px' }}>smtp.gmail.com</code></li>
                              <li>Set <strong>Port</strong> to: <code style={{ backgroundColor: 'var(--surface)', padding: '2px 6px', borderRadius: '4px' }}>587</code> and <strong>Encryption</strong> to: <strong>STARTTLS (587)</strong>.</li>
                              <li><strong>Step 1 (2-Step Verification):</strong> Open <a href="https://myaccount.google.com/signinoptions/two-step-verification" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Google 2-Step Verification Settings</a> and make sure it is turned <strong>ON</strong>.</li>
                              <li><strong>Step 2 (App Password Page):</strong> Go directly to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Google App Passwords Settings Page</a>.</li>
                              <li><strong>Step 3 (Generate Key):</strong> In the input box, enter a name (e.g., <code>Growffiy SMTP</code>) and click <strong>Create</strong>. Copy the generated 16-character password (e.g., <code>abcd efgh ijkl mnop</code>).</li>
                              <li><strong>Step 4 (Setup):</strong> Enter your full Gmail address as <strong>SMTP Username / Email</strong> and paste the 16-character App Password (without spaces) as <strong>SMTP Password</strong>.</li>
                            </ul>
                          </div>

                          <div>
                            <strong style={{ color: 'var(--text-heading)', display: 'block', marginBottom: '4px' }}>Option B: Custom Domain Hosting (cPanel / Zoho)</strong>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <li>Refer to your hosting account's Email Client settings to get your outgoing server address (e.g. `mail.yourdomain.com`).</li>
                              <li>Secure SSL port is typically <code style={{ backgroundColor: 'var(--surface)', padding: '2px 6px', borderRadius: '4px' }}>465</code> (SSL/TLS) and TLS/non-SSL port is <code style={{ backgroundColor: 'var(--surface)', padding: '2px 6px', borderRadius: '4px' }}>587</code>.</li>
                              <li>Use your complete email address and its mailbox password as authentication.</li>
                            </ul>
                          </div>
                        </div>
                      )
                    })}
                    style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <Info size={16} />
                  </button>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Configure SMTP parameters to handle transactional notification emails.
                </p>
              </div>

              {/* SMTP Mailer Status Switch Toggle */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                backgroundColor: 'var(--surface)', 
                padding: '4px 14px', 
                borderRadius: '20px', 
                border: '1px solid var(--border)' 
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: smtpStatus === 'false' ? 'var(--danger)' : 'var(--text-muted)' }}>MAIL OFF</span>
                <button
                  type="button"
                  onClick={async () => {
                    const nextStatus = smtpStatus === 'true' ? 'false' : 'true';
                    setSmtpStatus(nextStatus);
                    try {
                      await api.put(API_ENDPOINTS.SETTINGS, { smtp_status: nextStatus });
                    } catch (err) {
                      console.error('Instant SMTP toggle error:', err);
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: smtpStatus === 'true' ? 'var(--accent)' : 'var(--text-subtle)'
                  }}
                >
                  {smtpStatus === 'true' ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
                <span style={{ fontSize: '11px', fontWeight: 700, color: smtpStatus === 'true' ? 'var(--accent-dark)' : 'var(--text-muted)' }}>MAIL ON</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    style={{ height: '38px', fontSize: '13px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Port
                    </label>
                    <input
                      type="text"
                      required
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                      style={{ height: '38px', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Encryption
                    </label>
                    <select
                      value={smtpEncryption}
                      onChange={(e) => setSmtpEncryption(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '10px 14px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)', 
                        outline: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        height: '38px'
                      }}
                    >
                      <option value="tls">STARTTLS (587)</option>
                      <option value="ssl">SSL/TLS (465)</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpSenderName}
                    onChange={(e) => setSmtpSenderName(e.target.value)}
                    placeholder="Growffiy Notifications"
                    style={{ height: '38px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    SMTP Username / Email
                  </label>
                  <input
                    type="email"
                    required
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="notifications@yourdomain.com"
                    autoComplete="off"
                    style={{ height: '38px', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    SMTP Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSmtpPassword ? 'text' : 'password'}
                      required
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      placeholder="Enter App Password"
                      autoComplete="new-password"
                      style={{ paddingRight: '36px', height: '38px', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showSmtpPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action inside Box */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '24px' }}>
              <Button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 28px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                  color: 'white',
                  boxShadow: 'var(--shadow-blue)'
                }}
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save & Apply Settings'}
              </Button>
            </div>
          </Card>
        )}

        {/* Support View Tab */}
        {activeTab === 'support' && (
          <Card style={{ padding: '24px 28px' }}>
            <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                Direct Support Information
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Configure the support contact details that are displayed to all clients on their help and support desks.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Support Email
                </label>
                <input
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@growffiy.com"
                  style={{ height: '38px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Support Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ height: '38px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Live Chat Timings / Note
                </label>
                <input
                  type="text"
                  required
                  value={supportTimings}
                  onChange={(e) => setSupportTimings(e.target.value)}
                  placeholder="Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)"
                  style={{ height: '38px', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Support Address
                </label>
                <input
                  type="text"
                  value={supportAddress}
                  onChange={(e) => setSupportAddress(e.target.value)}
                  placeholder="Mumbai, India"
                  style={{ height: '38px', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* Submit Action inside Box */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '24px' }}>
              <Button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 28px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                  color: 'white',
                  boxShadow: 'var(--shadow-blue)'
                }}
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save & Apply Settings'}
              </Button>
            </div>
          </Card>
        )}


        {/* Algo Timings View Tab */}
        {activeTab === 'algo' && (
          <Card style={{ padding: '24px 28px' }}>
            <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                Algo Engine Timings
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Daily schedule for the automated trading engine. All times in IST (24-hour format).
              </p>
            </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Token Refresh</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Daily Zerodha auto-login for all active clients</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface)', padding: '4px 10px', borderRadius: '6px' }}>default: 08:00</div>
                </div>
                <input
                  type="time"
                  value={algoTokenRefreshTime}
                  onChange={(e) => setAlgoTokenRefreshTime(e.target.value)}
                  required
                  style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Pre-Open Fetch</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>NSE pre-open data fetch for all strategies</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--surface)', padding: '4px 10px', borderRadius: '6px' }}>default: 09:08</div>
                </div>
                <input
                  type="time"
                  value={algoPreopenFetchTime}
                  onChange={(e) => setAlgoPreopenFetchTime(e.target.value)}
                  required
                  style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>

              <div style={{ padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Pre-Select & Entry</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Per-strategy timing configured individually</div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--primary)', background: 'rgba(99,102,241,0.08)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>Per-Strategy</div>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-body)', margin: 0, lineHeight: 1.6 }}>
                    Pre-Select Time, Entry Time, and Check Interval are configured per-strategy in{' '}
                    <strong style={{ color: 'var(--primary)' }}>Strategies → Edit → Basic Strategy Info</strong>.
                    This allows different strategies to run on different schedules.
                  </p>
                </div>
            </div>
          </div>
 
            <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-light)', paddingTop: '24px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '16px', fontFamily: 'var(--font-title)' }}>
                Google Sheets Synchronization
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Target Spreadsheet ID or Google Sheet URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/... or ID"
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Google Service Account Credentials (JSON)
                  </label>
                  <textarea
                    placeholder='{"type": "service_account", ...}'
                    value={googleCredentialsJson}
                    onChange={(e) => setGoogleCredentialsJson(e.target.value)}
                    rows={6}
                    style={{ width: '100%', fontSize: '14px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '24px' }}>
              <Button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 28px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                  color: 'white',
                  boxShadow: 'var(--shadow-blue)'
                }}
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save & Apply Settings'}
              </Button>
            </div>
          </Card>
        )}

        {/* Market Calendar Tab */}
        {activeTab === 'calendar' && (
          <><Card style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                  Market Calendar
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Control trading days, market holidays, and special sessions for the auto engine.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => { setNewSpecialDay(''); setNewSpecialDayName(''); setShowSpecialDayModal(true); }}
                  style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '8px' }}
                >
                  <Plus size={14} /> Add Special Day
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => { setNewHoliday(''); setNewHolidayName(''); setShowHolidayModal(true); }}
                  style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '8px' }}
                >
                  <Plus size={14} /> Add Holiday
                </Button>
              </div>
            </div>

            {/* Trading Days */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Trading Days</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>Select weekdays for trading</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Mon', key: 'Mon' },
                  { label: 'Tue', key: 'Tue' },
                  { label: 'Wed', key: 'Wed' },
                  { label: 'Thu', key: 'Thu' },
                  { label: 'Fri', key: 'Fri' },
                  { label: 'Sat', key: 'Sat' },
                  { label: 'Sun', key: 'Sun' },
                ].map(({ label, key }) => {
                  const isSelected = tradingDays.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTradingDays(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key])}
                      style={{
                        flex: 1,
                        minWidth: '60px',
                        padding: '10px 8px',
                        borderRadius: '8px',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: isSelected ? 'var(--primary)' : 'var(--surface)',
                        color: isSelected ? 'white' : 'var(--text-body)',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day Checker */}
            {(() => {
              const d = new Date(selectedDate + 'T00:00:00');
              const weekdayShort = d.toLocaleDateString('en-US', { weekday: 'short' });
              const isTradingDay = tradingDays.includes(weekdayShort);
              const isHoliday = holidays.some(h => h.date === selectedDate);
              const isSpecialDay = specialDays.some(s => s.date === selectedDate);
              const holidayName = holidays.find(h => h.date === selectedDate)?.name;
              const specialName = specialDays.find(s => s.date === selectedDate)?.name;
              const isOpen = autoTradeEnabled && !isHoliday && (isTradingDay || isSpecialDay);

              const [viewYear, viewMonth] = viewDate.split('-').map(Number);
              const firstDay = new Date(viewYear, viewMonth - 1, 1);
              const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
              const startWeekday = firstDay.getDay();
              const monthLabel = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

              const calendarDays: (number | null)[] = [];
              for (let i = 0; i < startWeekday; i++) calendarDays.push(null);
              for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

              const getDateStr = (day: number) =>
                `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

              return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <button type="button" onClick={() => {
                      const prev = new Date(viewYear, viewMonth - 2, 1);
                      setViewDate(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '4px', fontSize: '16px' }}>‹</button>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>{monthLabel}</span>
                    <button type="button" onClick={() => {
                      const next = new Date(viewYear, viewMonth, 1);
                      setViewDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', borderRadius: '4px', fontSize: '16px' }}>›</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', marginBottom: '4px' }}>
                    {['Su','Mo','Tu','We','Th','Fr','Sa'].map(day => (
                      <span key={day} style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>{day}</span>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                    {calendarDays.map((day, i) => {
                      if (day === null) return <div key={`e${i}`} />;
                      const dateStr = getDateStr(day);
                      const dd = new Date(dateStr + 'T00:00:00');
                      const dw = dd.toLocaleDateString('en-US', { weekday: 'short' });
                      const isTd = tradingDays.includes(dw);
                      const isHol = holidays.some(h => h.date === dateStr);
                      const isSp = specialDays.some(s => s.date === dateStr);
                      const open = autoTradeEnabled && !isHol && (isTd || isSp);
                      const isSelected = dateStr === selectedDate;
                      const isToday = dateStr === today.toLocaleDateString('en-CA');
                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => setSelectedDate(dateStr)}
                          style={{
                            padding: '6px 0',
                            borderRadius: '6px',
                            border: isSelected ? '2px solid var(--primary)' : 'none',
                            fontSize: '12px',
                            fontWeight: isSelected || isToday ? 700 : 400,
                            cursor: 'pointer',
                            background: isSelected ? 'var(--primary)' : isToday && !isSelected ? 'var(--border-color)' : 'transparent',
                            color: isSelected ? 'white' : open ? 'var(--accent)' : 'var(--danger)',
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: 600, textAlign: 'center', color: isOpen ? 'var(--accent)' : 'var(--danger)' }}>
                    {isOpen ? '● Market OPEN' : '● Market CLOSED'}
                  </div>
                </div>
                <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Day Details</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <StatusRow label="Date" value={d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })} />
                    <StatusRow label="Weekday" value={d.toLocaleDateString('en-US', { weekday: 'long' })} />
                    <StatusRow label="Trading Day" status={isTradingDay} />
                    <StatusRow label="Holiday" status={!isHoliday} />
                    <StatusRow label="Special Day" status={isSpecialDay} />
                    {isHoliday && <StatusRow label="Holiday Name" value={holidayName || ''} />}
                    {isSpecialDay && <StatusRow label="Special Name" value={specialName || ''} />}
                    <div style={{ marginTop: '4px', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', fontSize: '12px', fontWeight: 600, textAlign: 'center', color: !autoTradeEnabled ? 'var(--text-muted)' : isHoliday ? 'var(--danger)' : (isTradingDay || isSpecialDay) ? 'var(--accent)' : 'var(--danger)' }}>
                      {!autoTradeEnabled ? 'Engine Stopped — Auto Trade OFF' :
                       isHoliday ? 'Trade SKIP — Market Holiday' :
                       isTradingDay || isSpecialDay ? 'Trade will EXECUTE' :
                       'Trade SKIP — Not a Trading Day'}
                    </div>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* All Scheduled Days */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>All Scheduled Days</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>Special days & holidays — sorted by date</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto' }}>
                {(() => {
                  const combined = [
                    ...specialDays.map(d => ({ ...d, type: 'special' as const })),
                    ...holidays.map(d => ({ ...d, type: 'holiday' as const })),
                  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  return combined.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>No scheduled days configured</div>
                  ) : (
                    combined.map((item, i) => (
                      <div key={item.date + item.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: item.type === 'special' ? 'var(--accent)' : 'var(--danger)',
                            display: 'inline-block', flexShrink: 0
                          }} />
                          <span style={{ fontWeight: 600 }}>{item.name}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>— {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} ({new Date(item.date).toLocaleDateString('en-US', { weekday: 'long' })})</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: item.type === 'special' ? 'var(--accent)' : 'var(--danger)', background: item.type === 'special' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '2px 10px', borderRadius: '4px' }}>{item.type === 'special' ? 'SPECIAL' : 'HOLIDAY'}</span>
                        </div>
                        <button type="button" onClick={() => {
                          setDeleteTarget({ type: item.type, date: item.date, name: item.name });
                          setShowDeleteConfirm(true);
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', opacity: 0.6 }}><Trash2 size={14} /></button>
                      </div>
                    ))
                  );
                })()}
              </div>
            </div>

            </Card>

            {/* Add Special Day Modal */}
            <Modal isOpen={showSpecialDayModal} onClose={() => setShowSpecialDayModal(false)} title="Add Special Market Day"
              footer={
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <Button type="button" onClick={() => setShowSpecialDayModal(false)} variant="secondary" style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600 }}>Cancel</Button>
                  <Button type="button" onClick={async () => {
                    if (newSpecialDay && newSpecialDayName && !specialDays.some(d => d.date === newSpecialDay)) {
                      const updated = [...specialDays, { date: newSpecialDay, name: newSpecialDayName }];
                      setSpecialDays(updated);
                      setNewSpecialDay(''); setNewSpecialDayName(''); setShowSpecialDayModal(false);
                      setSaving(true);
                      try {
                        await api.put(API_ENDPOINTS.SETTINGS, {
                          auto_trade_enabled: autoTradeEnabled ? 'true' : 'false',
                          trading_days: JSON.stringify(tradingDays),
                          special_market_days: JSON.stringify(updated),
        market_holidays: JSON.stringify(holidays),
        app_name: appName,
        app_title: appTitle,
        app_favicon: appFavicon,
        app_logo: appLogo,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        footer_text: footerText,
        google_analytics_id: googleAnalyticsId,
                        });
                        setNotification({ type: 'success', message: 'Special day saved.' });
                        setTimeout(() => setNotification(null), 3000);
                      } catch { setNotification({ type: 'error', message: 'Failed to save.' }); }
                      finally { setSaving(false); }
                    }
                  }} variant="primary" style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600 }}>Add</Button>
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Name</label>
                  <input type="text" placeholder="e.g. Budget Day" value={newSpecialDayName} onChange={(e) => setNewSpecialDayName(e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Date</label>
                  <input type="date" value={newSpecialDay} onChange={(e) => setNewSpecialDay(e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
              </div>
            </Modal>

            {/* Add Holiday Modal */}
            <Modal isOpen={showHolidayModal} onClose={() => setShowHolidayModal(false)} title="Add Market Holiday"
              footer={
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <Button type="button" onClick={() => setShowHolidayModal(false)} variant="secondary" style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600 }}>Cancel</Button>
                  <Button type="button" onClick={async () => {
                    if (newHoliday && newHolidayName && !holidays.some(h => h.date === newHoliday)) {
                      const updated = [...holidays, { date: newHoliday, name: newHolidayName }];
                      setHolidays(updated);
                      setNewHoliday(''); setNewHolidayName(''); setShowHolidayModal(false);
                      setSaving(true);
                      try {
                        await api.put(API_ENDPOINTS.SETTINGS, {
                          auto_trade_enabled: autoTradeEnabled ? 'true' : 'false',
                          trading_days: JSON.stringify(tradingDays),
                          special_market_days: JSON.stringify(specialDays),
                          market_holidays: JSON.stringify(updated),
                        });
                        setNotification({ type: 'success', message: 'Holiday saved.' });
                        setTimeout(() => setNotification(null), 3000);
                      } catch { setNotification({ type: 'error', message: 'Failed to save.' }); }
                      finally { setSaving(false); }
                    }
                  }} variant="danger" style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600 }}>Add</Button>
                </div>
              }
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Name</label>
                  <input type="text" placeholder="e.g. Diwali" value={newHolidayName} onChange={(e) => setNewHolidayName(e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Date</label>
                  <input type="date" value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)}
                    style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
              </div>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Confirm Delete"
              footer={
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <Button type="button" onClick={() => setShowDeleteConfirm(false)} variant="secondary" style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600 }}>No</Button>
                  <Button type="button" onClick={async () => {
                    if (!deleteTarget) return;
                    const updatedSpecial = deleteTarget.type === 'special'
                      ? specialDays.filter(d => d.date !== deleteTarget.date)
                      : specialDays;
                    const updatedHolidays = deleteTarget.type === 'holiday'
                      ? holidays.filter(h => h.date !== deleteTarget.date)
                      : holidays;
                    setSpecialDays(updatedSpecial);
                    setHolidays(updatedHolidays);
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                    setSaving(true);
                    try {
                      await api.put(API_ENDPOINTS.SETTINGS, {
                        auto_trade_enabled: autoTradeEnabled ? 'true' : 'false',
                        trading_days: JSON.stringify(tradingDays),
                        special_market_days: JSON.stringify(updatedSpecial),
                        market_holidays: JSON.stringify(updatedHolidays),
                      });
                      setNotification({ type: 'success', message: 'Deleted and saved.' });
                      setTimeout(() => setNotification(null), 3000);
                    } catch { setNotification({ type: 'error', message: 'Failed to save.' }); }
                    finally { setSaving(false); }
                  }} variant="danger" style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 600 }}>Yes</Button>
                </div>
              }
            >
              <div style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{deleteTarget?.name}</strong> (
                {deleteTarget?.type === 'special' ? 'Special Day' : 'Holiday'})?
              </div>
            </Modal>

          </>)}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <Card style={{ padding: '24px 28px' }}>
            <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                Branding Settings
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Customize app name, browser title, favicon, and logo. Changes reflect across admin, client, and website.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Application Name</label>
                <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Browser Tab Title</label>
                <input type="text" value={appTitle} onChange={(e) => setAppTitle(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <ImagePicker label="Favicon" value={appFavicon} onChange={setAppFavicon} />
              <ImagePicker label="Logo" value={appLogo} onChange={setAppLogo} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '24px' }}>
              <Button type="submit" disabled={saving} style={{
                padding: '10px 28px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white', boxShadow: 'var(--shadow-blue)'
              }}>
                {saving ? <RefreshCw size={14} className="animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save & Apply Settings'}
              </Button>
            </div>
          </Card>
        )}

        {/* Website / SEO Tab */}
        {activeTab === 'website' && (
          <Card style={{ padding: '24px 28px' }}>
            <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                Website & SEO Settings
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Manage meta tags, search engine optimization, and analytics tracking.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Hero Title (HTML Supported)</label>
                <textarea value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} rows={2}
                  style={{ width: '100%', fontSize: '14px', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Hero Subtitle</label>
                <textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={3}
                  style={{ width: '100%', fontSize: '14px', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Meta Description</label>
                <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3}
                  style={{ width: '100%', fontSize: '14px', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Meta Keywords</label>
                <input type="text" placeholder="algo trading, stock market, trading terminal" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Footer Text</label>
                <input type="text" placeholder="© 2026 Growffiy. All rights reserved." value={footerText} onChange={(e) => setFooterText(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Footer Tagline</label>
                <textarea value={footerTagline} onChange={(e) => setFooterTagline(e.target.value)} rows={2}
                  style={{ width: '100%', fontSize: '14px', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Regulatory Disclaimer</label>
                <textarea value={footerDisclaimer} onChange={(e) => setFooterDisclaimer(e.target.value)} rows={3}
                  style={{ width: '100%', fontSize: '14px', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Bottom Tagline</label>
                <input type="text" placeholder="Designed for NSE/BSE Intraday Algo Traders" value={footerBottomTagline} onChange={(e) => setFooterBottomTagline(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Google Analytics ID</label>
                <input type="text" placeholder="G-XXXXXXXXXX" value={googleAnalyticsId} onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '24px' }}>
              <Button type="submit" disabled={saving} style={{
                padding: '10px 28px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white', boxShadow: 'var(--shadow-blue)'
              }}>
                {saving ? <RefreshCw size={14} className="animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save & Apply Settings'}
              </Button>
            </div>
          </Card>
        )}

        {/* Legal Pages Tab */}
        {activeTab === 'legal' && (
          <Card style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} />
                  Legal Pages Editor
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Edit content for Privacy Policy, Terms & Conditions, Refund Policy, Risk Disclaimer, and FAQ pages.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLegalPreview(!legalPreview)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: legalPreview ? 'var(--primary)' : 'var(--surface)',
                  color: legalPreview ? 'white' : 'var(--text-body)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {legalPreview ? 'Edit' : 'Preview'}
              </button>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {([
                { key: 'privacy' as const, label: 'Privacy Policy' },
                { key: 'terms' as const, label: 'Terms & Conditions' },
                { key: 'refund' as const, label: 'Refund Policy' },
                { key: 'disclaimer' as const, label: 'Risk Disclaimer' },
                { key: 'faq' as const, label: 'FAQ' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setLegalActivePage(key); setLegalPreview(false); }}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '6px',
                    background: legalActivePage === key ? 'var(--primary)' : 'var(--surface)',
                    color: legalActivePage === key ? 'white' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: legalActivePage === key ? 'none' : '1px solid var(--border-color)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Editor / Preview */}
            {legalPreview ? (
              <div style={{
                background: 'var(--bg-white)',
                borderRadius: '12px',
                padding: 'clamp(20px, 5vw, 40px) clamp(16px, 5vw, 44px)',
                border: '1px solid #e8edf5',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                fontSize: '14px',
                lineHeight: '1.75',
                color: 'var(--text-body)',
              }}>
                {legalActivePage === 'faq' ? (
                  <div>
                    {faqItems.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>No FAQ items to preview.</p>}
                    {faqItems.map((item, i) => (
                      <div key={i} style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-heading)' }}>{item.q || `Question ${i + 1}`}</h3>
                        <div className="legal-rich-text" style={{ fontSize: '14px', lineHeight: '1.75', color: 'var(--text-body)' }} dangerouslySetInnerHTML={{ __html: item.a || '<em style="color:#94a3b8">No answer yet.</em>' }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="legal-rich-text" dangerouslySetInnerHTML={{
                    __html: legalActivePage === 'privacy' ? legalPrivacyContent :
                            legalActivePage === 'terms' ? legalTermsContent :
                            legalActivePage === 'refund' ? legalRefundContent :
                            legalDisclaimerContent
                  }} />
                )}
              </div>
            ) : (
              <div>
                {legalActivePage !== 'faq' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Rich Text Editor — {legalActivePage === 'privacy' ? 'Privacy Policy' :
                                         legalActivePage === 'terms' ? 'Terms & Conditions' :
                                         legalActivePage === 'refund' ? 'Refund Policy' :
                                         'Risk Disclaimer'}
                    </label>
                  </div>
                )}
                {legalActivePage === 'privacy' && (
                  <RichTextEditor value={legalPrivacyContent} onChange={setLegalPrivacyContent} />
                )}
                {legalActivePage === 'terms' && (
                  <RichTextEditor value={legalTermsContent} onChange={setLegalTermsContent} />
                )}
                {legalActivePage === 'refund' && (
                  <RichTextEditor value={legalRefundContent} onChange={setLegalRefundContent} />
                )}
                {legalActivePage === 'disclaimer' && (
                  <RichTextEditor value={legalDisclaimerContent} onChange={setLegalDisclaimerContent} />
                )}
                {legalActivePage === 'faq' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        FAQ Editor — Add, edit, or remove Q&A pairs
                      </label>
                    </div>
                    {faqItems.length === 0 && (
                      <div style={{ padding: '24px', textAlign: 'center', background: 'var(--surface)', borderRadius: '8px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                        No FAQs yet. Click "Add Question" below to get started.
                      </div>
                    )}
                    {faqItems.map((item, i) => (
                      <div key={i} style={{ marginBottom: '16px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-white)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Q{i + 1}</span>
                          <button type="button" onClick={() => { const next = faqItems.filter((_, j) => j !== i); setFaqItems(next); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px' }}>
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                        <input type="text" value={item.q} onChange={(e) => { const next = [...faqItems]; next[i] = { ...next[i], q: e.target.value }; setFaqItems(next); }} placeholder="Enter question..." style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} />
                        <RichTextEditor value={item.a} onChange={(val) => { const next = [...faqItems]; next[i] = { ...next[i], a: val }; setFaqItems(next); }} minHeight="120px" />
                      </div>
                    ))}
                    <button type="button" onClick={() => setFaqItems([...faqItems, { q: '', a: '' }])} style={{ padding: '10px 18px', borderRadius: '8px', border: '1px dashed var(--border-color)', background: 'var(--surface)', cursor: 'pointer', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center' }}>
                      <Plus size={14} /> Add Question
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '24px' }}>
              <Button type="submit" disabled={saving} style={{
                padding: '10px 28px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color: 'white', boxShadow: 'var(--shadow-blue)'
              }}>
                {saving ? <RefreshCw size={14} className="animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save & Apply Settings'}
              </Button>
            </div>
          </Card>
        )}

      </form>

      {/* Info Help Modal */}
      {infoModal && (
        <Modal
          isOpen={!!infoModal}
          onClose={() => setInfoModal(null)}
          title={infoModal.title}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setInfoModal(null)}>Got it, Thanks</Button>
            </div>
          }
        >
          {infoModal.content}
        </Modal>
      )}
    </div>
  );
}
