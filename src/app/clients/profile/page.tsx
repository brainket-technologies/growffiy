'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '../../../shared/components/views/Card';
import { Button } from '../../../shared/components/views/Button';
import { Modal } from '../../../shared/components/views/Modal';
import { 
  User, 
  Mail, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Coins, 
  Activity,
  ChevronRight,
  Info,
  Shield,
  Server,
  TrendingUp,
  Copy,
  Check,
  CheckCircle2
} from 'lucide-react';
import { useAppViewModel } from '../../../shared/viewmodels/AppContext';
import { API_ENDPOINTS } from '../../../core/constants';
import { api } from '../../../shared/services/api';
import { KiteClient } from '../../../shared/services/kite';

export default function ClientProfilePage() {
  const router = useRouter();
  const { clients, activeUser, loading: appLoading, updateClient } = useAppViewModel();

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [zerodhaClientId, setZerodhaClientId] = useState('');
  const [zerodhaApiKey, setZerodhaApiKey] = useState('');
  const [zerodhaApiSecret, setZerodhaApiSecret] = useState('');
  const [zerodhaPassword, setZerodhaPassword] = useState('');
  const [zerodhaTotpSecret, setZerodhaTotpSecret] = useState('');
  const [capital, setCapital] = useState('');
  const [tradingStatus, setTradingStatus] = useState('active');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [margins, setMargins] = useState<any>(null);
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [dob, setDob] = useState('');
  const [kycStatus, setKycStatus] = useState('verified');
  const [productTypeId, setProductTypeId] = useState('');
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [dedicatedIp, setDedicatedIp] = useState('');
  const [serverIp, setServerIp] = useState('');
  const [copiedIp, setCopiedIp] = useState(false);

  // TOTP Display State
  const [totpCode, setTotpCode] = useState('------');
  const [totpCountdown, setTotpCountdown] = useState(30);

  // UI Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showZerodhaPassword, setShowZerodhaPassword] = useState(false);
  const [showTotpSecret, setShowTotpSecret] = useState(false);
  const [alertModal, setAlertModal] = useState<{ title: string; message: React.ReactNode; onConfirm?: () => void } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Find dynamic client matching logged-in activeUser
  const matchedClient = activeUser?.client || clients.find(c => 
    c.zerodhaClientId?.toLowerCase() === activeUser?.id?.toLowerCase() || 
    c.user?.userId?.toLowerCase() === activeUser?.id?.toLowerCase() ||
    c.user?.name?.toLowerCase() === activeUser?.name?.toLowerCase()
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('growffiy_show_client_profile');
      if (stored === 'false') {
        router.push('/clients');
        return;
      }
    }
    const checkSetting = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.SETTINGS);
        if (res.success && res.settings && res.settings.show_client_profile === 'false') {
          router.push('/clients');
        }
      } catch {}
    };
    checkSetting();
  }, [router]);

  useEffect(() => {
    if (!matchedClient?.id) {
      if (!appLoading && !activeUser) {
        setError('User session not found');
        setLoading(false);
      }
      return;
    }

    const fetchClientData = async () => {
      try {
        const res = await api.get(`${API_ENDPOINTS.CLIENTS}/${matchedClient.id}`);
        if (res.client) {
          const c = res.client;
          setClient(c);
          setName(c.user?.name || c.name || '');
          setEmail(c.user?.email || c.email || '');
          setUserId(c.user?.userId || c.userId || '');
          setPassword(c.user?.password || '');
          setZerodhaClientId(c.zerodhaClientId || '');
          setZerodhaApiKey(c.zerodhaApiKey || '');
          setZerodhaApiSecret(c.zerodhaApiSecret || '');
          setZerodhaPassword(c.zerodhaPassword || '');
          setZerodhaTotpSecret(c.zerodhaTotpSecret || '');
          setDedicatedIp(c.dedicatedIp || '');
          setCapital(String(c.capital || 100000));
          setTradingStatus(c.tradingStatus || 'active');
          setAccessToken(c.accessToken || null);
          setProfile(res.profile || null);
          setMargins(res.margin || null);
          setPanNumber(c.panNumber || '');
          setAadhaarNumber(c.aadhaarNumber || '');
          setDob(c.dob || '');
          setKycStatus(c.kycStatus || 'verified');
          setProductTypeId(c.productTypeId || '');
        } else {
          setClient(matchedClient);
          setName(matchedClient.user?.name || matchedClient.name || '');
          setEmail(matchedClient.user?.email || matchedClient.email || '');
          setUserId(matchedClient.user?.userId || matchedClient.userId || '');
          setPassword(matchedClient.user?.password || '');
          setZerodhaClientId(matchedClient.zerodhaClientId || '');
          setCapital(String(matchedClient.capital || 100000));
          setTradingStatus(matchedClient.tradingStatus || 'active');
        }
      } catch (err: any) {
        setClient(matchedClient);
        setName(matchedClient.user?.name || matchedClient.name || '');
        setEmail(matchedClient.user?.email || matchedClient.email || '');
      } finally {
        setLoading(false);
      }
    };

    const fetchProductTypes = async () => {
      try {
        const res = await fetch('/api/admin/product-types');
        const data = await res.json();
        if (data.success && data.productTypes) {
          setProductTypes(data.productTypes);
        }
      } catch (err) {
        console.error('Failed to load product types:', err);
      }
    };

    const fetchPublicIp = async () => {
      try {
        const res = await fetch('/api/system/public-ip');
        const data = await res.json();
        if (data.success && data.ip) setServerIp(data.ip);
      } catch (err) {
        console.error('Failed to load server IP:', err);
      }
    };

    fetchClientData();
    fetchProductTypes();
    fetchPublicIp();
  }, [matchedClient?.id, appLoading, activeUser]);

  // TOTP auto-refresh ticker
  useEffect(() => {
    if (!zerodhaTotpSecret) {
      setTotpCode('------');
      return;
    }
    const update = async () => {
      try {
        const { generateClientTOTP, getTOTPCountdown } = await import('../../../shared/services/totpClient');
        setTotpCode(await generateClientTOTP(zerodhaTotpSecret));
        setTotpCountdown(getTOTPCountdown());
      } catch { 
        setTotpCode('------'); 
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [zerodhaTotpSecret]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client?.id) return;

    setIsSaving(true);
    try {
      const success = await updateClient(client.id, {
        name,
        email,
        userId,
        password,
        zerodhaClientId,
        zerodhaApiKey,
        zerodhaApiSecret,
        zerodhaPassword,
        zerodhaTotpSecret,
        capital: Number(capital),
        tradingStatus,
        panNumber,
        aadhaarNumber,
        dob,
        kycStatus,
        productTypeId: productTypeId || null,
      });

      if (success) {
        setAlertModal({
          title: 'Success',
          message: 'Client profile & credentials updated successfully!'
        });
      } else {
        setAlertModal({
          title: 'Error',
          message: 'Failed to update profile details.'
        });
      }
    } catch (err: any) {
      setAlertModal({
        title: 'Error',
        message: err.message || 'Error updating profile details'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateConnection = async (connect: boolean) => {
    if (!client?.id) return;
    const apiToUse = zerodhaApiKey;

    if (connect) {
      if (zerodhaTotpSecret) {
        setAlertModal({
          title: 'Auto-Login in Progress',
          message: 'Connecting to Zerodha using Auto-Login...',
        });
        try {
          const res = await api.post(`${API_ENDPOINTS.CLIENTS}/${client.id}/autologin`, {}).catch(err => {
            return { success: false, error: err.message || 'Auto-login failed' };
          });
          if (res.success) {
            setAlertModal({
              title: 'Connected',
              message: 'Zerodha Kite Connect session established successfully via Auto-Login!',
              onConfirm: () => window.location.reload()
            });
          } else {
            setAlertModal({
              title: 'Auto-Login Failed',
              message: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p>{res.error || 'Failed to auto-login.'}</p>
                  <p style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-heading)', marginTop: '4px' }}>
                    Would you like to log in manually instead?
                  </p>
                </div>
              ),
              onConfirm: () => {
                window.location.href = KiteClient.getLoginUrl(apiToUse, client.id);
              }
            });
          }
        } catch (err: any) {
          setAlertModal({
            title: 'Auto-Login Error',
            message: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p>{err.message || 'Error occurred during auto-login.'}</p>
              </div>
            ),
            onConfirm: () => {
              window.location.href = KiteClient.getLoginUrl(apiToUse, client.id);
            }
          });
        }
      } else {
        window.location.href = KiteClient.getLoginUrl(apiToUse, client.id);
      }
    } else {
      setAlertModal({
        title: 'Disconnect Zerodha',
        message: 'Are you sure you want to disconnect your Zerodha session?',
        onConfirm: async () => {
          setIsDisconnecting(true);
          try {
            const success = await updateClient(client.id, { accessToken: null });
            if (success) {
              setAccessToken(null);
              setProfile(null);
              setMargins(null);
              setAlertModal({
                title: 'Disconnected',
                message: 'Zerodha session disconnected successfully.'
              });
            }
          } catch (err: any) {
            setAlertModal({
              title: 'Error',
              message: 'Error disconnecting session: ' + err.message
            });
          } finally {
            setIsDisconnecting(false);
          }
        }
      });
    }
  };

  const showHelpModal = (field: string) => {
    let title = '';
    let message: React.ReactNode = null;

    switch (field) {
      case 'clientId':
        title = 'Zerodha Client ID';
        message = (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p><strong>What is this:</strong> Your Zerodha Kite username / login ID.</p>
            <p style={{ marginTop: '8px' }}><strong>Where to find it:</strong> Open your Kite App or visit <a href="https://kite.zerodha.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>kite.zerodha.com</a>.</p>
          </div>
        );
        break;
      case 'apiKey':
        title = 'Kite API Key';
        message = (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p><strong>What is this:</strong> A unique API key from Zerodha Developer Console.</p>
            <p style={{ marginTop: '8px' }}><strong>Where to find it:</strong> Login to <a href="https://developers.kite.trade/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>developers.kite.trade</a>.</p>
          </div>
        );
        break;
      case 'totp':
        title = 'Zerodha TOTP Secret';
        message = (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p><strong>What is this:</strong> The 2FA secret key that enables automated login without manual OTP entry.</p>
            <p style={{ marginTop: '8px' }}><strong>Where to find it:</strong> Go to Kite &rarr; Profile &rarr; Password & Security &rarr; Enable 2FA TOTP &rarr; "Can't scan? Copy the key".</p>
          </div>
        );
        break;
      default:
        break;
    }
    if (title) setAlertModal({ title, message });
  };

  if (loading || appLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div className="live-dot" style={{ width: '16px', height: '16px', backgroundColor: 'var(--primary)' }}></div>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading profile & credentials...</div>
      </div>
    );
  }

  const clientInitials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'VS';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <style>{`
        .client-details-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 28px;
        }
        @media (max-width: 992px) {
          .client-details-grid { grid-template-columns: 1fr; }
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 600px) {
          .form-grid-2 { grid-template-columns: 1fr; gap: 16px; }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .premium-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .premium-input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          pointer-events: none;
          z-index: 2;
        }
        .premium-input {
          width: 100% !important;
          height: 42px !important;
          padding: 10px 14px 10px 42px !important;
          border-radius: 8px !important;
          border: 1px solid var(--border-color) !important;
          background-color: var(--bg-white) !important;
          color: var(--text-heading) !important;
          font-size: 13.5px !important;
          outline: none !important;
          transition: all 0.2s ease !important;
        }
        .premium-input:focus {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 3px var(--primary-light) !important;
        }
        .avatar-glow {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          font-size: 24px;
          font-weight: 700;
          box-shadow: 0 0 16px rgba(18, 82, 171, 0.25);
          margin-bottom: 14px;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }
        .info-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-body);
          background-color: var(--surface);
          border: 1px solid var(--border-light);
          width: 100%;
          justify-content: space-between;
        }
        .btn-connect-kite {
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
          color: white;
          border: none;
          box-shadow: var(--shadow-green);
        }
      `}</style>

      {/* Top Header & Session Status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => router.push('/clients')}>Clients</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{name}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', letterSpacing: '-0.5px', margin: 0 }}>
              {name}
            </h1>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'capitalize',
              backgroundColor: tradingStatus === 'active' ? 'var(--accent-light)' : 'var(--border-light)',
              color: tradingStatus === 'active' ? 'var(--accent-dark)' : 'var(--text-muted)',
              border: `1px solid ${tradingStatus === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'var(--border)'}`
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: tradingStatus === 'active' ? 'var(--accent)' : 'var(--text-subtle)',
                display: 'inline-block'
              }} />
              {tradingStatus}
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: accessToken ? 'rgba(14, 165, 233, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              color: accessToken ? 'var(--primary)' : 'var(--danger)',
              border: `1px solid ${accessToken ? 'rgba(14, 165, 233, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
            }}>
              {accessToken ? 'Kite Session Live' : 'Kite Session Expired'}
            </span>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '-4px' }}>
          View credentials, adjust capital limits, and manage connected Kite API secrets.
        </p>
      </div>

      {/* Main Profile & Credentials Form */}
      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div className="client-details-grid">
          
          {/* Left Column: Profile Card & KYC details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <Card style={{ display: 'flex', flexDirection: 'column', padding: '24px', alignItems: 'center', textAlign: 'center' }}>
              <div className="avatar-glow">
                {clientInitials}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', marginBottom: '2px' }}>
                {name || 'Client Profile'}
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px', wordBreak: 'break-all' }}>
                {email || 'No email configured'}
              </p>
              
              <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--border-light)', marginBottom: '18px' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', textAlign: 'left' }}>
                <div className="info-pill">
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Trading Account</span>
                  <span style={{ fontWeight: 600, fontSize: '12px', textTransform: 'capitalize', color: tradingStatus === 'active' ? 'var(--accent-dark)' : 'var(--text-muted)' }}>
                    {tradingStatus}
                  </span>
                </div>
                
                <div className="info-pill">
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Allocated Capital</span>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: capital === '-1' ? 'var(--accent)' : 'var(--primary)' }}>
                    {capital === '-1' ? 'Live Balance' : `₹${Number(capital || 0).toLocaleString('en-IN')}`}
                  </span>
                </div>

                <div className="info-pill">
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>API Status</span>
                  <span style={{ fontWeight: 600, fontSize: '12px', color: accessToken ? 'var(--accent)' : 'var(--danger)' }}>
                    {accessToken ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                <Button 
                  type="button" 
                  onClick={() => router.push('/clients/performance')}
                  style={{ 
                    marginTop: '12px',
                    width: '100%',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px',
                    fontSize: '13px', 
                    fontWeight: 600,
                    background: 'none',
                    border: '1.5px solid var(--primary)',
                    color: 'var(--primary)',
                    borderRadius: '8px',
                    height: '40px'
                  }}
                >
                  <TrendingUp size={14} /> View Performance
                </Button>
              </div>
            </Card>

            {/* KYC Card under Profile Overview */}
            <Card style={{ padding: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                <Shield size={16} color="var(--primary)" /> KYC & Verification
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">PAN Number</label>
                  <input 
                    type="text" 
                    value={panNumber} 
                    onChange={(e) => setPanNumber(e.target.value)} 
                    placeholder="e.g. ABCDE1234F"
                    style={{ width: '100%', height: '40px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', backgroundColor: 'var(--bg-white)', color: 'var(--text-heading)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Aadhaar Number</label>
                  <input 
                    type="text" 
                    value={aadhaarNumber} 
                    onChange={(e) => setAadhaarNumber(e.target.value)} 
                    placeholder="e.g. XXXX XXXX 1234"
                    style={{ width: '100%', height: '40px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', backgroundColor: 'var(--bg-white)', color: 'var(--text-heading)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input 
                    type="text" 
                    value={dob} 
                    onChange={(e) => setDob(e.target.value)} 
                    placeholder="e.g. 15 Jan 1990"
                    style={{ width: '100%', height: '40px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px', backgroundColor: 'var(--bg-white)', color: 'var(--text-heading)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">KYC Status</label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '40px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border-light)'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      color: kycStatus === 'verified' ? 'var(--accent-dark)' : kycStatus === 'failed' ? 'var(--danger)' : 'var(--warning-dark)'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: kycStatus === 'verified' ? 'var(--accent)' : kycStatus === 'failed' ? 'var(--danger)' : 'var(--warning)',
                        display: 'inline-block'
                      }} />
                      {kycStatus || 'Verified'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 500 }}>
                      Verified by Admin
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Main Config and Credentials Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Account Credentials & Settings */}
            <Card style={{ padding: '24px 28px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                <User size={18} color="var(--primary)" /> Account Credentials & Settings
              </h4>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="premium-input-wrapper">
                    <User size={15} className="premium-input-icon" />
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="premium-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Login User ID</label>
                  <div className="premium-input-wrapper">
                    <User size={15} className="premium-input-icon" style={{ zIndex: 2, color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      readOnly 
                      value={userId} 
                      className="premium-input"
                      style={{ backgroundColor: 'var(--surface)', cursor: 'default', color: 'var(--text-heading)' }}
                      title="Managed by Admin"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Zerodha API Secrets & Setup */}
            <Card style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-title)' }}>
                  <Server size={18} color="var(--primary)" /> Zerodha API Secrets & Setup
                  <button 
                    type="button" 
                    title="View Setup Info"
                    onClick={() => showHelpModal('apiKey')}
                    style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', opacity: 0.85 }}
                  >
                    <Info size={15} />
                  </button>
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      Zerodha Client ID *
                      <button 
                        type="button" 
                        onClick={() => showHelpModal('clientId')}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <Info size={12} />
                      </button>
                    </label>
                    <div className="premium-input-wrapper">
                      <User size={15} className="premium-input-icon" />
                      <input 
                        type="text" 
                        required 
                        value={zerodhaClientId} 
                        onChange={(e) => setZerodhaClientId(e.target.value)} 
                        className="premium-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Kite API Key (Optional)
                      <button 
                        type="button" 
                        onClick={() => showHelpModal('apiKey')}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <Info size={12} />
                      </button>
                    </label>
                    <div className="premium-input-wrapper">
                      <Key size={15} className="premium-input-icon" />
                      <input 
                        type="text" 
                        value={zerodhaApiKey} 
                        onChange={(e) => setZerodhaApiKey(e.target.value)} 
                        className="premium-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Kite API Secret (Optional)
                    </label>
                    <div className="premium-input-wrapper">
                      <Lock size={15} className="premium-input-icon" />
                      <input 
                        type={showApiSecret ? 'text' : 'password'} 
                        value={zerodhaApiSecret} 
                        onChange={(e) => setZerodhaApiSecret(e.target.value)} 
                        className="premium-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiSecret(!showApiSecret)}
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
                        {showApiSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Zerodha Password (for Auto-Login) *
                    </label>
                    <div className="premium-input-wrapper">
                      <Lock size={15} className="premium-input-icon" />
                      <input 
                        type={showZerodhaPassword ? 'text' : 'password'} 
                        value={zerodhaPassword} 
                        onChange={(e) => setZerodhaPassword(e.target.value)} 
                        placeholder="Zerodha Password"
                        className="premium-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowZerodhaPassword(!showZerodhaPassword)}
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
                        {showZerodhaPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Zerodha TOTP Secret (for Auto-Login) *
                    <button 
                      type="button" 
                      onClick={() => showHelpModal('totp')}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Info size={12} />
                    </button>
                  </label>
                  <div className="premium-input-wrapper">
                    <Key size={15} className="premium-input-icon" />
                    <input 
                      type={showTotpSecret ? 'text' : 'password'} 
                      value={zerodhaTotpSecret} 
                      onChange={(e) => setZerodhaTotpSecret(e.target.value)} 
                      placeholder="e.g. JBSWY3DPEHPK3PXP"
                      className="premium-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTotpSecret(!showTotpSecret)}
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
                      {showTotpSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  
                  {zerodhaTotpSecret && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', padding: '12px 16px', borderRadius: '10px', backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '24px', fontWeight: 800, letterSpacing: '6px', color: 'var(--primary)' }}>
                        {totpCode}
                      </div>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                        {totpCountdown}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {totpCode === '------' ? 'Invalid TOTP Secret' : 'Current TOTP — match this with your phone app'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Permanent Dedicated Static IP Card */}
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(14, 165, 233, 0.06)',
                  border: '1px solid rgba(14, 165, 233, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Server size={16} color="var(--primary)" />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-heading)' }}>
                        Permanent Static Outbound IP
                      </span>
                    </div>
                    {(dedicatedIp || serverIp) && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(dedicatedIp || serverIp);
                          setCopiedIp(true);
                          setTimeout(() => setCopiedIp(false), 2000);
                        }}
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: copiedIp ? '#10b981' : 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {copiedIp ? '✓ Copied IP' : '📋 Copy Static IP'}
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="text"
                      readOnly
                      value={dedicatedIp || serverIp || '49.36.212.101'}
                      style={{
                        flex: 1,
                        height: '38px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        backgroundColor: 'var(--bg-white)',
                        color: 'var(--primary)'
                      }}
                    />
                    <a
                      href="https://developers.kite.trade/profile"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--primary)',
                        textDecoration: 'underline',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Kite Whitelist ↗
                    </a>
                  </div>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    Paste this static IP into <strong>developers.kite.trade</strong> -&gt; Profile -&gt; <strong>IP Whitelist</strong> so trade execution never encounters <i>PermissionException</i>.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Full-Width Card 1: Active Zerodha Client Profile Details */}
        {profile && (
          <Card style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
              <div style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '8px', 
                backgroundColor: 'rgba(14, 165, 233, 0.1)', 
                color: 'var(--primary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px'
              }}>
                ZK
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                  Active Zerodha Client Profile Details
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fetched directly from Zerodha Kite Connect session profile API</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Zerodha User ID</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>{profile.user_id || 'N/A'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>User Name</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>{profile.user_name || 'N/A'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Email Address</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>{profile.email || 'N/A'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Broker</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>{profile.broker || 'N/A'}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>User Type</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)', textTransform: 'capitalize' }}>{profile.user_type || 'N/A'}</span>
              </div>
            </div>

            {profile.exchanges && profile.exchanges.length > 0 && (
              <div style={{ marginTop: '20px', borderTop: '1px dashed var(--border-light)', paddingTop: '16px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Enabled Exchanges</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.exchanges.map((exchange: string) => (
                    <span 
                      key={exchange} 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: 600, 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        backgroundColor: 'var(--surface)', 
                        color: 'var(--text-body)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {exchange}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.products && profile.products.length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px dashed var(--border-light)', paddingTop: '16px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Margin Products</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.products.map((product: string) => (
                    <span 
                      key={product} 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: 600, 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        backgroundColor: 'var(--primary-light)', 
                        color: 'var(--primary-dark)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.order_types && profile.order_types.length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px dashed var(--border-light)', paddingTop: '16px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>Allowed Order Types</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.order_types.map((orderType: string) => (
                    <span 
                      key={orderType} 
                      style={{ 
                        fontSize: '11px', 
                        fontWeight: 600, 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        backgroundColor: 'var(--accent-light)', 
                        color: 'var(--accent-dark)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      {orderType}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Full-Width Card 2: Active Zerodha Client Margins & Funds */}
        {margins && (
          <Card style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
              <div style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '8px', 
                backgroundColor: 'rgba(14, 165, 233, 0.1)', 
                color: 'var(--primary)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px'
              }}>
                ₹
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)' }}>
                  Active Zerodha Client Margins & Funds
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fetched directly from Zerodha Kite Connect session margins API</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Equity Segment */}
              {margins.equity && (
                <div style={{ 
                  padding: '20px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-light)', 
                  backgroundColor: margins.equity.enabled ? 'var(--surface)' : 'rgba(128, 128, 128, 0.05)',
                  opacity: margins.equity.enabled ? 1 : 0.6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Equity Segment</h5>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      padding: '3px 8px', 
                      borderRadius: '12px', 
                      backgroundColor: margins.equity.enabled ? 'rgba(16, 185, 129, 0.1)' : 'var(--border-color)',
                      color: margins.equity.enabled ? 'var(--accent-dark)' : 'var(--text-muted)'
                    }}>
                      {margins.equity.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  {margins.equity.enabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ padding: '12px', backgroundColor: 'rgba(14, 165, 233, 0.05)', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.1)' }}>
                        <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Cash Balance</span>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                          ₹{margins.equity.net?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Available Cash */}
                        <div>
                          <h6 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>Available Cash</h6>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Opening:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.equity.available?.opening_balance?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Live Balance:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.equity.available?.live_balance?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Cash:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.equity.available?.cash?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Intraday Payin:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.equity.available?.intraday_payin?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Collateral:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.equity.available?.collateral?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Utilised Margins */}
                        <div>
                          <h6 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>Utilised Margins</h6>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Debits:</span>
                              <span style={{ fontWeight: 600, color: 'var(--danger)' }}>₹{margins.equity.utilised?.debits?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>SPAN:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.equity.utilised?.span?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Exposure:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.equity.utilised?.exposure?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>M2M Realised:</span>
                              <span style={{ fontWeight: 600, color: (margins.equity.utilised?.m2m_realised || 0) >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                                ₹{margins.equity.utilised?.m2m_realised?.toLocaleString('en-IN') || '0.00'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>M2M Unrealised:</span>
                              <span style={{ fontWeight: 600, color: (margins.equity.utilised?.m2m_unrealised || 0) >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                                ₹{margins.equity.utilised?.m2m_unrealised?.toLocaleString('en-IN') || '0.00'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Commodity Segment */}
              {margins.commodity && (
                <div style={{ 
                  padding: '20px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-light)', 
                  backgroundColor: margins.commodity.enabled ? 'var(--surface)' : 'rgba(128, 128, 128, 0.05)',
                  opacity: margins.commodity.enabled ? 1 : 0.6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Commodity Segment</h5>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      padding: '3px 8px', 
                      borderRadius: '12px', 
                      backgroundColor: margins.commodity.enabled ? 'rgba(16, 185, 129, 0.1)' : 'var(--border-color)',
                      color: margins.commodity.enabled ? 'var(--accent-dark)' : 'var(--text-muted)'
                    }}>
                      {margins.commodity.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  {margins.commodity.enabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ padding: '12px', backgroundColor: 'rgba(14, 165, 233, 0.05)', borderRadius: '8px', border: '1px solid rgba(14, 165, 233, 0.1)' }}>
                        <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Cash Balance</span>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                          ₹{margins.commodity.net?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* Available Cash */}
                        <div>
                          <h6 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>Available Cash</h6>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Opening:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.commodity.available?.opening_balance?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Live Balance:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.commodity.available?.live_balance?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Cash:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.commodity.available?.cash?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Intraday Payin:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.commodity.available?.intraday_payin?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Collateral:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.commodity.available?.collateral?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Utilised Margins */}
                        <div>
                          <h6 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>Utilised Margins</h6>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Debits:</span>
                              <span style={{ fontWeight: 600, color: 'var(--danger)' }}>₹{margins.commodity.utilised?.debits?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>SPAN:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.commodity.utilised?.span?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Exposure:</span>
                              <span style={{ fontWeight: 600 }}>₹{margins.commodity.utilised?.exposure?.toLocaleString('en-IN') || '0.00'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>M2M Realised:</span>
                              <span style={{ fontWeight: 600, color: (margins.commodity.utilised?.m2m_realised || 0) >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                                ₹{margins.commodity.utilised?.m2m_realised?.toLocaleString('en-IN') || '0.00'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>M2M Unrealised:</span>
                              <span style={{ fontWeight: 600, color: (margins.commodity.utilised?.m2m_unrealised || 0) >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                                ₹{margins.commodity.utilised?.m2m_unrealised?.toLocaleString('en-IN') || '0.00'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => router.push('/clients')} 
            style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving}
            style={{ 
              padding: '12px 28px', 
              fontSize: '14px', 
              fontWeight: 600,
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              color: 'white',
              boxShadow: 'var(--shadow-blue)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isSaving ? 'Saving...' : 'Save & Update Client'}
          </Button>
        </div>
      </form>

      {/* Alert Modal */}
      {alertModal && (
        <Modal 
          isOpen={!!alertModal} 
          onClose={() => setAlertModal(null)} 
          title={alertModal.title}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>{alertModal.message}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button 
                onClick={() => {
                  const cb = alertModal.onConfirm;
                  setAlertModal(null);
                  if (cb) cb();
                }}
              >
                OK
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
