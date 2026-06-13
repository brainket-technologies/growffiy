'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../views/components/Card';
import { Button } from '../../../views/components/Button';
import { Shield, Server, RefreshCw, Key, Eye, EyeOff, CheckCircle2, AlertTriangle, ToggleLeft, ToggleRight, Mail, CreditCard, Sliders, Globe, Info } from 'lucide-react';
import { api } from '../../../lib/api';
import { Modal } from '../../../views/components/Modal';

type TabType = 'payments' | 'smtp' | 'risk';

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

  // Risk
  const [defaultRisk, setDefaultRisk] = useState('1.00');
  const [slippage, setSlippage] = useState('0.10');

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
        const res = await api.get('/api/admin/settings');
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

          setDefaultRisk(res.settings.default_risk || '1.00');
          setSlippage(res.settings.slippage || '0.10');
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
      const res = await api.put('/api/admin/settings', {
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
        default_risk: defaultRisk,
        slippage: slippage,
      });

      if (res.success) {
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
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border-light)', 
        gap: '24px',
        marginBottom: '4px' 
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 4px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'payments' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'payments' ? 'var(--primary)' : 'var(--text-secondary)',
            background: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <CreditCard size={16} />
          Payment Gateway
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('smtp')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 4px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'smtp' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'smtp' ? 'var(--primary)' : 'var(--text-secondary)',
            background: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Mail size={16} />
          SMTP Mail Configuration
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('risk')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 4px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'risk' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'risk' ? 'var(--primary)' : 'var(--text-secondary)',
            background: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Sliders size={16} />
          Risk Parameters
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
                backgroundColor: '#f1f5f9', 
                padding: '4px 14px', 
                borderRadius: '20px', 
                border: '1px solid #e2e8f0' 
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: razorpayMode === 'test' ? 'var(--primary)' : '#64748b' }}>TEST MODE</span>
                <button
                  type="button"
                  onClick={() => setRazorpayMode(razorpayMode === 'test' ? 'live' : 'test')}
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
                <span style={{ fontSize: '11px', fontWeight: 700, color: razorpayMode === 'live' ? 'var(--accent-dark)' : '#64748b' }}>LIVE MODE</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              
              {/* Test Column */}
              <div style={{ 
                padding: '24px', 
                borderRadius: '12px', 
                border: '1px solid ' + (razorpayMode === 'test' ? 'rgba(37, 99, 235, 0.25)' : 'var(--border-light)'), 
                backgroundColor: razorpayMode === 'test' ? 'rgba(37, 99, 235, 0.01)' : 'transparent',
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
                Save & Apply Settings
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
                              <li>Set <strong>SMTP Host</strong> to: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>smtp.gmail.com</code></li>
                              <li>Set <strong>Port</strong> to: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>587</code> and <strong>Encryption</strong> to: <strong>STARTTLS (587)</strong>.</li>
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
                              <li>Secure SSL port is typically <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>465</code> (SSL/TLS) and TLS/non-SSL port is <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>587</code>.</li>
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
                backgroundColor: '#f1f5f9', 
                padding: '4px 14px', 
                borderRadius: '20px', 
                border: '1px solid #e2e8f0' 
              }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: smtpStatus === 'false' ? 'var(--danger)' : '#64748b' }}>MAIL OFF</span>
                <button
                  type="button"
                  onClick={() => setSmtpStatus(smtpStatus === 'true' ? 'false' : 'true')}
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
                <span style={{ fontSize: '11px', fontWeight: 700, color: smtpStatus === 'true' ? 'var(--accent-dark)' : '#64748b' }}>MAIL ON</span>
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
                Save & Apply Settings
              </Button>
            </div>
          </Card>
        )}

        {/* Global Risk View Tab */}
        {activeTab === 'risk' && (
          <Card style={{ padding: '24px 28px' }}>
            <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                Global Risk Parameters
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Define default risk ceilings and maximum slippage filters for strategies.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Default Risk Size per trade (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={defaultRisk}
                  onChange={(e) => setDefaultRisk(e.target.value)}
                  required
                  style={{ height: '38px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Max Slippage tolerance (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  required
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
                Save & Apply Settings
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
