'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../../../shared/components/views/Card';
import { Button } from '../../../shared/components/views/Button';
import { Shield, Server, RefreshCw, Key, Eye, EyeOff, CheckCircle2, AlertTriangle, ToggleLeft, ToggleRight, Mail, CreditCard, Globe, Info, LifeBuoy, Clock, Calendar, Plus, Trash2 } from 'lucide-react';
import { api } from '../../../shared/services/api';
import { Modal } from '../../../shared/components/views/Modal';
import { API_ENDPOINTS } from '../../../core/constants';


type TabType = 'payments' | 'smtp' | 'support' | 'algo' | 'calendar';

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

  // Algo Timings (global infrastructure only)
  const [algoPreopenFetchTime, setAlgoPreopenFetchTime] = useState('09:08');
  const [algoTokenRefreshTime, setAlgoTokenRefreshTime] = useState('08:00');

  // Auto Trade Calendar
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(true);
  const [tradingDays, setTradingDays] = useState<string[]>(['Mon','Tue','Wed','Thu','Fri']);
  const [specialDays, setSpecialDays] = useState<string[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);

  const [newSpecialDay, setNewSpecialDay] = useState('');
  const [newHoliday, setNewHoliday] = useState('');

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

          setAlgoPreopenFetchTime(res.settings.algo_preopen_fetch_time || '09:08');
          setAlgoTokenRefreshTime(res.settings.algo_token_refresh_time || '08:00');

          setAutoTradeEnabled(res.settings.auto_trade_enabled !== 'false');
          try { setTradingDays(JSON.parse(res.settings.trading_days || '["Mon","Tue","Wed","Thu","Fri"]')); } catch {}
          try { setSpecialDays(JSON.parse(res.settings.special_market_days || '[]')); } catch {}
          try { setHolidays(JSON.parse(res.settings.market_holidays || '[]')); } catch {}
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
        algo_preopen_fetch_time: algoPreopenFetchTime,
        algo_token_refresh_time: algoTokenRefreshTime,
        auto_trade_enabled: autoTradeEnabled ? 'true' : 'false',
        trading_days: JSON.stringify(tradingDays),
        special_market_days: JSON.stringify(specialDays),
        market_holidays: JSON.stringify(holidays),
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

  const StatusRow = ({ label, value, status }: { label: string; value?: string; status?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
        {value ? value : status !== undefined ? (status ? <span style={{ color: '#059669' }}>✅ {label === 'Holiday' ? 'Not a holiday' : label === 'Special Day' ? 'Special session' : 'Yes'}</span> : <span style={{ color: 'var(--danger)' }}>❌ No</span>) : ''}
      </span>
    </div>
  );

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
          onClick={() => setActiveTab('support')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 4px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'support' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'support' ? 'var(--primary)' : 'var(--text-secondary)',
            background: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <LifeBuoy size={16} />
          Support Info
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('algo')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 4px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'algo' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'algo' ? 'var(--primary)' : 'var(--text-secondary)',
            background: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Clock size={16} />
          Algo Timings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 4px',
            fontSize: '14px',
            fontWeight: 600,
            border: 'none',
            borderBottom: activeTab === 'calendar' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'calendar' ? 'var(--primary)' : 'var(--text-secondary)',
            background: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Calendar size={16} />
          Market Calendar
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


        {/* Algo Timings View Tab */}
        {activeTab === 'algo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card style={{ padding: '28px 32px' }}>
              <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #1E88FF, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <Clock size={16} />
                    </div>
                    Algo Engine Timings
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', marginLeft: '42px' }}>
                    Daily schedule for the automated trading engine. All times in IST (24-hour format).
                  </p>
                </div>
              </div>

              <div style={{ position: 'relative', paddingLeft: '32px' }}>
                {/* Timeline line */}
                <div style={{ position: 'absolute', left: '11px', top: '8px', bottom: '8px', width: '2px', background: 'linear-gradient(to bottom, #1E88FF, #3b82f6)', borderRadius: '1px', opacity: 0.3 }} />

                {/* Token Refresh */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-26px', top: '18px', width: '14px', height: '14px', borderRadius: '50%', background: '#3b82f6', border: '3px solid rgba(59,130,246,0.15)', zIndex: 1 }} />
                  <div style={{ flex: 1, padding: '18px 22px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(59,130,246,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>🔑 Token Refresh</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Daily Zerodha auto-login for all active clients</div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '6px' }}>default: 08:00</div>
                    </div>
                    <input
                      type="time"
                      value={algoTokenRefreshTime}
                      onChange={(e) => setAlgoTokenRefreshTime(e.target.value)}
                      required
                      style={{ marginTop: '12px', width: '100%', height: '42px', fontSize: '14px', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Pre-Open Fetch */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-26px', top: '18px', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--primary)', border: '3px solid rgba(14,165,233,0.15)', zIndex: 1 }} />
                  <div style={{ flex: 1, padding: '18px 22px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(14,165,233,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>📊 Pre-Open Fetch</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>NSE pre-open data fetch for all strategies</div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: '6px' }}>default: 09:08</div>
                    </div>
                    <input
                      type="time"
                      value={algoPreopenFetchTime}
                      onChange={(e) => setAlgoPreopenFetchTime(e.target.value)}
                      required
                      style={{ marginTop: '12px', width: '100%', height: '42px', fontSize: '14px', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Pre-Select & Entry */}
                <div style={{ display: 'flex', gap: '20px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-26px', top: '18px', width: '14px', height: '14px', borderRadius: '50%', background: '#8b5cf6', border: '3px solid rgba(139,92,246,0.15)', zIndex: 1 }} />
                  <div style={{ flex: 1, padding: '18px 22px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'rgba(139,92,246,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>⚡ Pre-Select & Entry</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Per-strategy timing configured individually</div>
                      </div>
                      <div style={{ fontSize: '11px', color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>Per-Strategy</div>
                    </div>
                    <div style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-body)', margin: 0, lineHeight: 1.6 }}>
                        Pre-Select Time, Entry Time, and Check Interval are configured per-strategy in{' '}
                        <strong style={{ color: '#8b5cf6' }}>Strategies → Edit → Basic Strategy Info</strong>.
                        This allows different strategies to run on different schedules.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '28px' }}>
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
          </div>
        )}

        {/* Market Calendar Tab */}
        {activeTab === 'calendar' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Card */}
            <Card style={{ padding: '28px 32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <Calendar size={16} />
                    </div>
                    Market Calendar
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', marginLeft: '42px' }}>
                    Control trading days, market holidays, and special sessions for the auto engine.
                  </p>
                </div>
              </div>

              {/* Auto Trade Status Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderRadius: '12px', background: autoTradeEnabled ? 'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(16,185,129,0.04))' : 'rgba(148,163,184,0.06)', border: `1px solid ${autoTradeEnabled ? 'rgba(5,150,105,0.2)' : 'var(--border-color)'}`, marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: autoTradeEnabled ? 'linear-gradient(135deg, #059669, #10b981)' : 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <RefreshCw size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: autoTradeEnabled ? '#059669' : 'var(--text-muted)' }}>
                      Auto Trading {autoTradeEnabled ? 'Active' : 'Disabled'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {autoTradeEnabled ? 'Engine will execute trades on approved days' : 'No trades will be executed regardless of day'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoTradeEnabled(!autoTradeEnabled)}
                  style={{
                    padding: '10px 28px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: autoTradeEnabled ? 'linear-gradient(135deg, #dc2626, #ef4444)' : 'linear-gradient(135deg, #059669, #10b981)',
                    color: 'white',
                    transition: 'all 0.2s',
                    boxShadow: autoTradeEnabled ? '0 2px 8px rgba(239,68,68,0.25)' : '0 2px 8px rgba(16,185,129,0.25)'
                  }}
                >
                  {autoTradeEnabled ? 'Turn OFF' : 'Turn ON'}
                </button>
              </div>

              {/* Two Column Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left: Trading Days */}
                <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>Trading Days</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>Select weekdays for trading</span>
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
                      const isWeekend = key === 'Sat' || key === 'Sun';
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setTradingDays(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key])}
                          style={{
                            flex: 1,
                            minWidth: '60px',
                            padding: '12px 8px',
                            borderRadius: '10px',
                            border: '2px solid',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: isSelected ? 'linear-gradient(135deg, var(--primary), #1252AB)' : 'var(--bg-secondary)',
                            borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                            color: isSelected ? 'white' : isWeekend ? 'var(--text-subtle)' : 'var(--text-primary)',
                            opacity: isWeekend && !isSelected ? 0.5 : 1,
                            transition: 'all 0.15s'
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Today's Status */}
                <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>Today's Status</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <StatusRow label="Date" value={new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })} />
                    <StatusRow label="Weekday" value={new Date().toLocaleDateString('en-US', { weekday: 'long' })} />
                    <StatusRow label="Trading Day" status={tradingDays.includes(new Date().toLocaleDateString('en-US', { weekday: 'short' }))} />
                    <StatusRow label="Holiday" status={!holidays.includes(new Date().toLocaleDateString('en-CA'))} />
                    <StatusRow label="Special Day" status={specialDays.includes(new Date().toLocaleDateString('en-CA'))} />
                    <div style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', fontSize: '12px', fontWeight: 600, textAlign: 'center', color: !autoTradeEnabled ? 'var(--text-muted)' : holidays.includes(new Date().toLocaleDateString('en-CA')) ? 'var(--danger)' : (tradingDays.includes(new Date().toLocaleDateString('en-US', { weekday: 'short' })) || specialDays.includes(new Date().toLocaleDateString('en-CA')) ? '#059669' : 'var(--danger)') }}>
                      {!autoTradeEnabled ? '🔴 Engine Stopped — Auto Trade OFF' :
                       holidays.includes(new Date().toLocaleDateString('en-CA')) ? '🔴 Trade SKIP — Market Holiday' :
                       tradingDays.includes(new Date().toLocaleDateString('en-US', { weekday: 'short' })) || specialDays.includes(new Date().toLocaleDateString('en-CA')) ? '🟢 Trade will EXECUTE Today' :
                       '🔴 Trade SKIP — Not a Trading Day'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Days & Holidays */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                {/* Special Market Days */}
                <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(5,150,105,0.2)', background: 'rgba(5,150,105,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700 }}>+</div>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>Special Market Days</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>Weekends pe trading enable karein</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <input
                      type="date"
                      value={newSpecialDay}
                      onChange={(e) => setNewSpecialDay(e.target.value)}
                      style={{ flex: 1, height: '40px', fontSize: '13px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => { if (newSpecialDay && !specialDays.includes(newSpecialDay)) { setSpecialDays([...specialDays, newSpecialDay]); setNewSpecialDay(''); } }}
                      style={{ height: '40px', padding: '0 18px', fontSize: '12px', fontWeight: 600, borderRadius: '8px' }}
                    >
                      <Plus size={14} /> Add
                    </Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {specialDays.length === 0 ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0', textAlign: 'center' }}>No special days added yet</div>
                    ) : (
                      specialDays.map((date, i) => (
                        <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.08)', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 500 }}>{new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({new Date(date).toLocaleDateString('en-US', { weekday: 'long' })})</span>
                          </div>
                          <button type="button" onClick={() => setSpecialDays(specialDays.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', opacity: 0.6 }}><Trash2 size={14} /></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Market Holidays */}
                <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'linear-gradient(135deg, #dc2626, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700 }}>✕</div>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>Market Holidays</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>Inn dinon trade skip hoga</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <input
                      type="date"
                      value={newHoliday}
                      onChange={(e) => setNewHoliday(e.target.value)}
                      style={{ flex: 1, height: '40px', fontSize: '13px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => { if (newHoliday && !holidays.includes(newHoliday)) { setHolidays([...holidays, newHoliday]); setNewHoliday(''); } }}
                      style={{ height: '40px', padding: '0 18px', fontSize: '12px', fontWeight: 600, borderRadius: '8px' }}
                    >
                      <Plus size={14} /> Add
                    </Button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {holidays.length === 0 ? (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0', textAlign: 'center' }}>No holidays added yet</div>
                    ) : (
                      holidays.map((date, i) => (
                        <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.08)', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontWeight: 500 }}>{new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({new Date(date).toLocaleDateString('en-US', { weekday: 'long' })})</span>
                          </div>
                          <button type="button" onClick={() => setHolidays(holidays.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', opacity: 0.6 }}><Trash2 size={14} /></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '20px', marginTop: '28px' }}>
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
          </div>
        )}

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
