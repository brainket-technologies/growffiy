'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../../../shared/components/views/Card';
import { Button } from '../../../../shared/components/views/Button';
import RichTextEditor from '../../../../shared/components/views/RichTextEditor';
import { RefreshCw, CheckCircle2, AlertTriangle, Plus, Trash2, Image, Globe, FileText, Upload, LifeBuoy } from 'lucide-react';
import { api } from '../../../../shared/services/api';
import { API_ENDPOINTS } from '../../../../core/constants';

type TabType = 'branding' | 'support' | 'website' | 'legal';

export default function WebsiteSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('branding');

  // Branding
  const [appName, setAppName] = useState('Growffiy');
  const [appTitle, setAppTitle] = useState('Growffiy — Algo Trading Terminal');
  const [appFavicon, setAppFavicon] = useState('');
  const [appLogo, setAppLogo] = useState('');

  // Support contact info
  const [supportEmail, setSupportEmail] = useState('support@growffiy.com');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [supportTimings, setSupportTimings] = useState('Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)');
  const [supportAddress, setSupportAddress] = useState('Mumbai, India');

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
  const [legalActivePage, setLegalActivePage] = useState<'privacy' | 'terms' | 'refund' | 'disclaimer' | 'about' | 'faq'>('privacy');
  const [legalPrivacyContent, setLegalPrivacyContent] = useState('');
  const [legalTermsContent, setLegalTermsContent] = useState('');
  const [legalRefundContent, setLegalRefundContent] = useState('');
  const [legalDisclaimerContent, setLegalDisclaimerContent] = useState('');
  const [legalAboutContent, setLegalAboutContent] = useState('');
  const [legalFaqContent, setLegalFaqContent] = useState('');
  const defaultFaqItems: {q: string; a: string}[] = [
    {q: "How does the Pre-Open Momentum Breakout strategy work?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">The Pre-Open Momentum Breakout strategy scans NSE/BSE stocks during the pre-open session (9:00-9:08 AM) to identify high-momentum candidates based on volume and price thresholds. Once identified, it places automated MIS (Margin Intraday Squared-off) orders at market open. All orders are squared off by 3:15 PM automatically.</p>"},
    {q: "How is position sizing calculated?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">Position sizing is calculated based on your configured risk per trade (default 5-8% of available capital) and the stock's current market price. The system automatically calculates the number of lots or shares to allocate to each trade, ensuring no single position exceeds your predefined risk tolerance.</p>"},
    {q: "Do I need a Zerodha Kite Connect subscription?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">Yes, Growffiy requires an active Zerodha Kite Connect subscription (API access). Your Zerodha account must have Kite Connect enabled, and you will need to generate API Key, API Secret, and Access Token from the Zerodha Kite Console. The free tier of Kite Connect (3 tokens) is sufficient for getting started.</p>"},
    {q: "Can I pause the bot at any time?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">Absolutely. You can pause or stop the automated trading bot at any time from your client dashboard. When paused, no new trades will be placed. Any open positions held at the time of pausing will continue until their configured square-off time (3:15 PM) unless manually closed from your broker terminal.</p>"},
    {q: "What happens if my internet goes down during a trade?", a: "<p style=\"font-size:14px;line-height:1.75;color:#475569;margin:0;\">Growffiy runs on cloud servers, not your local machine. Once a strategy is deployed and active, trade execution continues server-side regardless of your internet connectivity. However, you may lose visibility of real-time updates on your dashboard until your connection is restored. All trades follow their pre-configured square-off schedule.</p>"},
  ];
  const [faqItems, setFaqItems] = useState<{q: string; a: string}[]>(defaultFaqItems);

  // UI Status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.SETTINGS);
        if (res.success && res.settings) {
          setAppName(res.settings.app_name || 'Growffiy');
          setAppTitle(res.settings.app_title || 'Growffiy — Algo Trading Terminal');
          setAppFavicon(res.settings.app_favicon || '');
          setAppLogo(res.settings.app_logo || '');
          setSupportEmail(res.settings.support_email || 'support@growffiy.com');
          setSupportPhone(res.settings.support_phone || '+91 98765 43210');
          setSupportTimings(res.settings.support_timings || 'Live Chat (Mon-Fri, 9:00 AM - 3:30 PM)');
          setSupportAddress(res.settings.support_address || 'Mumbai, India');
          setHeroTitle(res.settings.hero_title || 'Automate Your<br /><span class="text-gradient">Stock Market</span><br />Trades Smarter');
          setHeroSubtitle(res.settings.hero_subtitle || 'Growffiy connects to your Zerodha Kite API and executes pre-open momentum breakout strategies with strict 1% risk management — fully automated.');
          setMetaDescription(res.settings.meta_description || '');
          setMetaKeywords(res.settings.meta_keywords || '');
          setFooterText(res.settings.footer_text || '');
          setFooterTagline(res.settings.footer_tagline || 'Advanced algorithmic trading middleware connecting directly with Zerodha Kite API. Built for mathematical discipline and speed.');
          setFooterDisclaimer(res.settings.footer_disclaimer || 'Algorithmic trading involves substantial financial risk. Growffiy is a software utility and is NOT a SEBI-registered investment advisor, broker, or portfolio manager. All simulated performance data shown does not represent guaranteed future results. Past performance is not indicative of future returns. Trade responsibly.');
          setFooterBottomTagline(res.settings.footer_bottom_tagline || 'Designed for NSE/BSE Intraday Algo Traders');
          setGoogleAnalyticsId(res.settings.google_analytics_id || '');
          setLegalPrivacyContent(res.settings.legal_privacy_content || '');
          setLegalTermsContent(res.settings.legal_terms_content || '');
          setLegalRefundContent(res.settings.legal_refund_content || '');
          setLegalDisclaimerContent(res.settings.legal_disclaimer_content || '');
          setLegalAboutContent(res.settings.legal_about_content || '');
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

    const updatedFaqJson = JSON.stringify(faqItems);

    try {
      const res = await api.put(API_ENDPOINTS.SETTINGS, {
        app_name: appName,
        app_title: appTitle,
        app_favicon: appFavicon,
        app_logo: appLogo,
        support_email: supportEmail,
        support_phone: supportPhone,
        support_timings: supportTimings,
        support_address: supportAddress,
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
        legal_about_content: legalAboutContent,
        legal_faq_content: updatedFaqJson,
      });

      if (res.success) {
        localStorage.setItem('growffiy_brand_logo', appLogo);
        localStorage.setItem('growffiy_brand_name', appName);
        localStorage.setItem('growffiy_footer_tagline', footerTagline);
        localStorage.setItem('growffiy_footer_disclaimer', footerDisclaimer);
        localStorage.setItem('growffiy_footer_bottom_tagline', footerBottomTagline);
        localStorage.setItem('growffiy_footer_text', footerText);
        localStorage.setItem('growffiy_support_email', supportEmail);
        localStorage.setItem('growffiy_support_phone', supportPhone);
        localStorage.setItem('growffiy_support_address', supportAddress);
        window.dispatchEvent(new Event('branding-updated'));

        setNotification({ type: 'success', message: 'Settings saved and applied successfully!' });
      } else {
        setNotification({ type: 'error', message: res.message || 'Failed to update settings.' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'A network error occurred.' });
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

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
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', gap: '12px', color: 'var(--text-muted)' }}>
        <RefreshCw className="animate-spin" size={24} />
        <span style={{ fontSize: '15px', fontWeight: 600 }}>Loading Website Settings...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 10px 40px' }}>
      {/* Title */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
          Website Settings
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Configure app branding, hero titles, SEO metadata, support contact details, and legal policy pages.
        </p>
      </div>

      {/* Notifications */}
      {notification && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', borderRadius: '10px', marginBottom: '24px',
          background: notification.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${notification.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: notification.type === 'success' ? '#10b981' : '#ef4444',
          fontSize: '14px', fontWeight: 600
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tab Buttons */}
      <div style={{ display: 'flex', gap: '8px', background: 'var(--surface)', padding: '6px', borderRadius: '10px', border: '1px solid var(--border-light)', overflowX: 'auto', marginBottom: '24px' }}>
        <button type="button" onClick={() => setActiveTab('branding')} style={{
          display: 'flex', alignItems: 'center', gap: '6px', border: 'none',
          background: activeTab === 'branding' ? 'var(--bg-white)' : 'transparent',
          color: activeTab === 'branding' ? 'var(--text-heading)' : 'var(--text-muted)',
          padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: activeTab === 'branding' ? 700 : 600, cursor: 'pointer',
          boxShadow: activeTab === 'branding' ? 'var(--shadow-sm)' : 'none',
        }}>
          <Image size={15} />
          Branding
        </button>

        <button type="button" onClick={() => setActiveTab('support')} style={{
          display: 'flex', alignItems: 'center', gap: '6px', border: 'none',
          background: activeTab === 'support' ? 'var(--bg-white)' : 'transparent',
          color: activeTab === 'support' ? 'var(--text-heading)' : 'var(--text-muted)',
          padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: activeTab === 'support' ? 700 : 600, cursor: 'pointer',
          boxShadow: activeTab === 'support' ? 'var(--shadow-sm)' : 'none',
        }}>
          <LifeBuoy size={15} />
          Support Info
        </button>

        <button type="button" onClick={() => setActiveTab('website')} style={{
          display: 'flex', alignItems: 'center', gap: '6px', border: 'none',
          background: activeTab === 'website' ? 'var(--bg-white)' : 'transparent',
          color: activeTab === 'website' ? 'var(--text-heading)' : 'var(--text-muted)',
          padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: activeTab === 'website' ? 700 : 600, cursor: 'pointer',
          boxShadow: activeTab === 'website' ? 'var(--shadow-sm)' : 'none',
        }}>
          <Globe size={15} />
          Website & SEO
        </button>

        <button type="button" onClick={() => setActiveTab('legal')} style={{
          display: 'flex', alignItems: 'center', gap: '6px', border: 'none',
          background: activeTab === 'legal' ? 'var(--bg-white)' : 'transparent',
          color: activeTab === 'legal' ? 'var(--text-heading)' : 'var(--text-muted)',
          padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: activeTab === 'legal' ? 700 : 600, cursor: 'pointer',
          boxShadow: activeTab === 'legal' ? 'var(--shadow-sm)' : 'none',
        }}>
          <FileText size={15} />
          Legal Pages
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
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

        {/* Support Info Tab */}
        {activeTab === 'support' && (
          <Card style={{ padding: '24px 28px' }}>
            <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                Support Contact Details
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Configure support contact details displayed on help desks and website footers.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Support Email</label>
                <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Support Phone Number</label>
                <input type="text" value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Support Live Timings</label>
                <input type="text" value={supportTimings} onChange={(e) => setSupportTimings(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Support Address</label>
                <input type="text" value={supportAddress} onChange={(e) => setSupportAddress(e.target.value)}
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Footer Regulatory Disclaimer</label>
                <textarea value={footerDisclaimer} onChange={(e) => setFooterDisclaimer(e.target.value)} rows={3}
                  style={{ width: '100%', fontSize: '14px', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Footer Bottom Tagline</label>
                <input type="text" placeholder="Designed for Algo Traders" value={footerBottomTagline} onChange={(e) => setFooterBottomTagline(e.target.value)}
                  style={{ width: '100%', height: '40px', fontSize: '14px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Google Analytics Measurement ID</label>
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
            <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                Legal Policies & Page Contents
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Edit content for Privacy Policy, Terms & Conditions, Refund Policy, Risk Disclaimer, and FAQ pages.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', background: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-light)', overflowX: 'auto', marginBottom: '24px' }}>
              {[
                { key: 'privacy' as const, label: 'Privacy Policy' },
                { key: 'terms' as const, label: 'Terms' },
                { key: 'refund' as const, label: 'Refund' },
                { key: 'disclaimer' as const, label: 'Disclaimer' },
                { key: 'about' as const, label: 'About Us' },
                { key: 'faq' as const, label: 'FAQs' },
              ].map(sub => (
                <button key={sub.key} type="button" onClick={() => setLegalActivePage(sub.key)} style={{
                  border: 'none', background: legalActivePage === sub.key ? 'var(--bg-white)' : 'transparent',
                  color: legalActivePage === sub.key ? 'var(--primary)' : 'var(--text-muted)',
                  padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  boxShadow: legalActivePage === sub.key ? 'var(--shadow-sm)' : 'none',
                }}>{sub.label}</button>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              {legalActivePage === 'privacy' && (
                <RichTextEditor value={legalPrivacyContent} onChange={setLegalPrivacyContent} />
              )}
              {legalActivePage === 'terms' && (
                <RichTextEditor value={legalTermsContent} onChange={setLegalTermsContent} />
              )}
              {legalActivePage === 'refund' && (
                <RichTextEditor value={legalRefundContent} onChange={setLegalRefundContent} />
              )}
              {legalActivePage === 'about' && (
                <RichTextEditor value={legalAboutContent} onChange={setLegalAboutContent} />
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
    </div>
  );
}
