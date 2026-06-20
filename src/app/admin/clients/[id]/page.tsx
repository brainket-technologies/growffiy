'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '../../../../shared/components/views/Card';
import { Button } from '../../../../shared/components/views/Button';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Shield, 
  Server, 
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
  Pencil
} from 'lucide-react';
import { useAppViewModel } from '../../../../shared/viewmodels/AppContext';
import { Modal } from '../../../../shared/components/views/Modal';
import { API_ENDPOINTS, APP_ROUTES } from '../../../../core/constants';
import { api } from '../../../../shared/services/api';
import { KiteClient } from '../../../../shared/services/kite';

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { updateClient } = useAppViewModel();

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
  const [tradingStatus, setTradingStatus] = useState('inactive');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [margins, setMargins] = useState<any>(null);
  const [marginError, setMarginError] = useState<string | null>(null);
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [dob, setDob] = useState('');
  const [kycStatus, setKycStatus] = useState('pending');

  // TOTP Display
  const [totpCode, setTotpCode] = useState('------');
  const [totpCountdown, setTotpCountdown] = useState(30);

  // UI Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showZerodhaPassword, setShowZerodhaPassword] = useState(false);
  const [alertModal, setAlertModal] = useState<{ title: string; message: React.ReactNode; onConfirm?: () => void } | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await api.get(`${API_ENDPOINTS.CLIENTS}/${id}`);
        if (res.client) {
          const c = res.client;
          setName(c.user?.name || c.name || '');
          setEmail(c.user?.email || c.email || '');
          setUserId(c.user?.userId || c.userId || '');
          setPassword(c.user?.password || '');
          setZerodhaClientId(c.zerodhaClientId || '');
          setZerodhaApiKey(c.zerodhaApiKey || '');
          setZerodhaApiSecret(c.zerodhaApiSecret || '');
          setZerodhaPassword(c.zerodhaPassword || '');
          setZerodhaTotpSecret(c.zerodhaTotpSecret || '');
          setCapital(String(c.capital));
          setTradingStatus(c.tradingStatus);
          setAccessToken(c.accessToken || null);
          setProfile(res.profile || null);
          setMargins(res.margin || null);
          setPanNumber(c.panNumber || '');
          setAadhaarNumber(c.aadhaarNumber || '');
          setDob(c.dob || '');
          setKycStatus(c.kycStatus || 'pending');
        } else {
          setError('Failed to load client details');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching client details');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const err = urlParams.get('error');
      
      if (success === 'connected') {
        setAlertModal({
          title: 'Connected',
          message: 'Zerodha Kite Connect session established successfully!'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (err) {
        setAlertModal({
          title: 'Connection Failed',
          message: decodeURIComponent(err)
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [id]);

  // TOTP auto-refresh
  useEffect(() => {
    if (!zerodhaTotpSecret) {
      setTotpCode('------');
      return;
    }
    const update = async () => {
      try {
        const { generateClientTOTP, getTOTPCountdown } = await import('../../../../shared/services/totpClient');
        setTotpCode(await generateClientTOTP(zerodhaTotpSecret));
        setTotpCountdown(getTOTPCountdown());
      } catch { setTotpCode('------'); }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [zerodhaTotpSecret]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await updateClient(id, {
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
      });

      if (success) {
        setAlertModal({
          title: 'Success',
          message: 'Client details updated successfully!',
          onConfirm: () => router.push(APP_ROUTES.ADMIN_CLIENTS)
        });
      } else {
        setAlertModal({
          title: 'Error',
          message: 'Failed to update client details'
        });
      }
    } catch (err: any) {
      setAlertModal({
        title: 'Error',
        message: err.message || 'Error updating client details'
      });
    } finally {
      setLoading(false);
    }
  };

  const showSetupGuide = (shouldConnect: boolean = false) => {
    const redirectUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${API_ENDPOINTS.CALLBACK_ZERODHA}` 
      : '';

    const guideContent = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.6' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Follow these steps to connect your Zerodha Kite API:
        </p>
        <ol style={{ fontSize: '13px', color: 'var(--text-body)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li>
            <strong>Configure Redirect URL:</strong> Open the <a href="https://developers.kite.trade/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Kite Developer Console</a>, edit your app settings, and paste this Redirect URL:
            <div style={{ margin: '6px 0', padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', color: '#0f172a', border: '1px solid #cbd5e1', wordBreak: 'break-all' }}>
              {redirectUrl}
            </div>
          </li>
          <li>
            <strong>Save API Credentials:</strong> Enter the <strong>Kite API Key</strong> and <strong>Kite API Secret</strong> in the form below and click <strong>Save & Update Client</strong>.
          </li>
          <li>
            <strong>Authenticate:</strong> Proceed to connect to your Zerodha account.
          </li>
          <li>
            <strong>OTP & TOTP:</strong> Enter your Zerodha credentials. For the OTP, enter the TOTP/2FA code from your <strong>Kite Mobile App</strong> or <strong>Google Authenticator</strong>.
          </li>
          <li>
            <strong>Auto-Login Setup (Recommended):</strong> Go to your Zerodha Account &gt; Settings &gt; Password &amp; Security &gt; Enable/Regenerate 2FA TOTP. Copy the raw alphanumeric Secret Key (below the QR code) and paste it into the <strong>Zerodha TOTP Secret</strong> field in the client settings. This enables fully automated daily token refresh!
          </li>
          <li>
            <strong>Success:</strong> Upon successful login, Zerodha will redirect you back here automatically and exchange the token!
          </li>
        </ol>
        {shouldConnect && (
          <p style={{ marginTop: '8px', color: 'var(--danger)', fontWeight: 600, fontSize: '13px' }}>
            ⚠️ Have you configured the Redirect URL in the developer console? If yes, click Confirm to proceed to Zerodha login.
          </p>
        )}
      </div>
    );

    if (shouldConnect) {
      if (!zerodhaApiKey || !zerodhaApiSecret) {
        setAlertModal({
          title: 'Missing Credentials',
          message: 'Please enter and save the Zerodha API Key and API Secret first before connecting.'
        });
        return;
      }
      setAlertModal({
        title: 'How to Connect Zerodha Kite API (Setup Guide)',
        message: guideContent,
        onConfirm: () => {
          window.location.href = KiteClient.getLoginUrl(zerodhaApiKey, id);
        }
      });
    } else {
      setAlertModal({
        title: 'How to Connect Zerodha Kite API (Setup Guide)',
        message: guideContent
      });
    }
  };

  const showFieldInfo = (field: string) => {
    let title = '';
    let message: React.ReactNode = null;

    switch (field) {
      case 'clientId':
        title = 'Zerodha Client ID';
        message = (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p><strong>What is this:</strong> Your Zerodha Kite username / login ID.</p>
            <p style={{ marginTop: '8px' }}><strong>Where to find it:</strong></p>
            <ol style={{ paddingLeft: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Open your Kite Mobile App or visit <a href="https://kite.zerodha.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>kite.zerodha.com</a>.</li>
              <li>Your 6-character login ID (e.g. <code>RZJ500</code>) is your Client ID.</li>
            </ol>
          </div>
        );
        break;
      case 'apiKey':
        title = 'Kite API Key';
        message = (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p><strong>What is this:</strong> A unique key provided by Zerodha Developer console to link your app.</p>
            <p style={{ marginTop: '8px' }}><strong>Where to find it:</strong></p>
            <ol style={{ paddingLeft: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Login to the <a href="https://developers.kite.trade/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Kite Developer Console</a>.</li>
              <li>Create a developer app if you haven't already.</li>
              <li>Go to your app details, and copy the <strong>API Key</strong>.</li>
            </ol>
          </div>
        );
        break;
      case 'apiSecret':
        title = 'Kite API Secret';
        message = (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p><strong>What is this:</strong> A private secret key used to secure communications with the Kite API.</p>
            <p style={{ marginTop: '8px' }}><strong>Where to find it:</strong></p>
            <ol style={{ paddingLeft: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Login to the <a href="https://developers.kite.trade/" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Kite Developer Console</a>.</li>
              <li>Open your app details page.</li>
              <li>Click show under <strong>API Secret</strong> to view and copy it.</li>
            </ol>
          </div>
        );
        break;
      case 'password':
        title = 'Zerodha Password';
        message = (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p><strong>What is this:</strong> The login password of your Zerodha account.</p>
            <p style={{ marginTop: '8px' }}><strong>Where to find it:</strong></p>
            <p style={{ marginTop: '6px' }}>This is the same password you use when logging into the <a href="https://kite.zerodha.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Kite website</a> or Kite mobile app.</p>
          </div>
        );
        break;
      case 'totp':
        title = 'Zerodha TOTP Secret';
        message = (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <p><strong>What is this:</strong> The 2FA/TOTP setup key that allows the server to generate 6-digit TOTP codes automatically.</p>
            <p style={{ marginTop: '8px' }}><strong>Where to find it:</strong></p>
            <ol style={{ paddingLeft: '20px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Go to <a href="https://kite.zerodha.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Kite</a>, log in, and click on your Profile &rarr; <strong>My Profile / Settings</strong>.</li>
              <li>Click on <strong>Password & Security</strong>.</li>
              <li>Click <strong>Enable 2FA TOTP</strong> (or click "Method to enable TOTP").</li>
              <li>You will see a QR Code and a text link saying <strong>"Can't scan? Copy the key"</strong>.</li>
              <li>Copy that secret key (e.g. <code>JBSWY3DPEHPK3PXP</code>) and paste it here.</li>
            </ol>
          </div>
        );
        break;
      default:
        break;
    }

    if (title && message) {
      setAlertModal({ title, message });
    }
  };

  const handleSimulateConnection = async (connect: boolean) => {
    if (connect && tradingStatus !== 'active') {
      setAlertModal({
        title: 'Status Inactive',
        message: 'This client cannot be connected to Zerodha because their Trading Status is currently set to Inactive. Please activate the client first.'
      });
      return;
    }

    if (connect) {
      showSetupGuide(true);
    } else {
      setAlertModal({
        title: 'Disconnect Zerodha',
        message: 'Are you sure you want to disconnect this client\'s Zerodha session?',
        onConfirm: async () => {
          try {
            const success = await updateClient(id, { accessToken: null });
            if (success) {
              setAccessToken(null);
              setProfile(null);
              setMargins(null);
              setAlertModal({
                title: 'Success',
                message: 'Zerodha session disconnected.'
              });
            } else {
              setAlertModal({
                title: 'Error',
                message: 'Failed to disconnect session'
              });
            }
          } catch (err: any) {
            setAlertModal({
              title: 'Error',
              message: 'Error updating connection: ' + err.message
            });
          }
        }
      });
    }
  };

  if (loading && !name) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
        <div className="live-dot" style={{ width: '16px', height: '16px', backgroundColor: 'var(--primary)' }}></div>
        <div style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '15px' }}>Loading client details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>
          <Shield size={36} />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '8px' }}>Error Loading Details</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>{error}</p>
        </div>
        <Button onClick={() => router.push(APP_ROUTES.ADMIN_CLIENTS)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .client-details-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 28px;
          align-items: start;
        }
        @media (max-width: 992px) {
          .client-details-grid {
            grid-template-columns: 1fr;
          }
        }
        .profile-input-field {
          width: 100%;
        }
      `}</style>

      {/* Breadcrumb Navigation & Back Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => router.push(APP_ROUTES.ADMIN_CLIENTS)}>Clients</span>
          <ChevronRight size={14} />
          <span style={{ color: 'var(--text-heading)', fontWeight: 500 }}>{name}</span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', letterSpacing: '-0.5px' }}>
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
                
                {/* Visual Connection Token Status indicator pill */}
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
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                View credentials, adjust capital limits, and manage connected Kite API secrets.
              </p>
            </div>
          </div>
        </div>
      </div>



      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div className="client-details-grid">
          {/* Left Column: Profile Card with Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <Card style={{ display: 'flex', flexDirection: 'column', padding: '24px', alignItems: 'center', textAlign: 'center' }}>
              {/* Avatar representation - smaller and clean */}
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
                color: 'white',
                fontSize: '22px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '12px',
                fontFamily: 'var(--font-title)'
              }}>
                {name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CL'}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', marginBottom: '2px' }}>
                {name || 'Client Profile'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px', wordBreak: 'break-all' }}>
                {email || 'No email configured'}
              </p>
              
              <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--border-light)', marginBottom: '18px' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', textAlign: 'left' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Login User ID</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                    <input 
                      type="text" 
                      required 
                      value={userId} 
                      onChange={(e) => setUserId(e.target.value)} 
                      style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Login Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      style={{ paddingLeft: '36px', paddingRight: '36px', height: '38px', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
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
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: API & Configuration Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <Card style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', backgroundColor: 'var(--accent-light)', color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Server size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Zerodha Kite Terminal API
                      <button 
                        type="button" 
                        title="View Setup Guide"
                        onClick={() => showSetupGuide(false)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          padding: 0, 
                          margin: 0, 
                          cursor: 'pointer', 
                          color: 'var(--primary)', 
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.85,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.85'}
                      >
                        <Info size={16} />
                      </button>
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Configure connection secrets and active limits</p>
                  </div>
                </div>
                <div>
                  {accessToken ? (
                    <Button 
                      type="button" 
                      variant="danger" 
                      onClick={() => handleSimulateConnection(false)} 
                      style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600 }}
                    >
                      Disconnect Zerodha
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      onClick={() => handleSimulateConnection(true)} 
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '12px', 
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
                        color: 'white',
                        border: 'none',
                        boxShadow: 'var(--shadow-green)'
                      }}
                    >
                      Connect Zerodha
                    </Button>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Zerodha Client ID
                    <button 
                      type="button" 
                      onClick={() => showFieldInfo('clientId')}
                      title="Click to see where to find Client ID"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Info size={13} />
                    </button>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                    <input 
                      type="text" 
                      required 
                      value={zerodhaClientId} 
                      onChange={(e) => setZerodhaClientId(e.target.value)} 
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Kite API Key
                    <button 
                      type="button" 
                      onClick={() => showFieldInfo('apiKey')}
                      title="Click to see where to find API Key"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Info size={13} />
                    </button>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                    <input 
                      type="text" 
                      required 
                      value={zerodhaApiKey} 
                      onChange={(e) => setZerodhaApiKey(e.target.value)} 
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Kite API Secret
                    <button 
                      type="button" 
                      onClick={() => showFieldInfo('apiSecret')}
                      title="Click to see where to find API Secret"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Info size={13} />
                    </button>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                    <input 
                      type={showApiSecret ? 'text' : 'password'} 
                      required 
                      value={zerodhaApiSecret} 
                      onChange={(e) => setZerodhaApiSecret(e.target.value)} 
                      style={{ paddingLeft: '40px', paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiSecret(!showApiSecret)}
                      style={{
                        position: 'absolute',
                        right: '14px',
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
                      {showApiSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Zerodha Password (for Auto-Login)
                    <button 
                      type="button" 
                      onClick={() => showFieldInfo('password')}
                      title="Click to see where to find Zerodha Password"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Info size={13} />
                    </button>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                    <input 
                      type={showZerodhaPassword ? 'text' : 'password'} 
                      value={zerodhaPassword} 
                      onChange={(e) => setZerodhaPassword(e.target.value)} 
                      placeholder="Zerodha Password"
                      style={{ paddingLeft: '40px', paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowZerodhaPassword(!showZerodhaPassword)}
                      style={{
                        position: 'absolute',
                        right: '14px',
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
                      {showZerodhaPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Zerodha TOTP Secret (for Auto-Login)
                    <button 
                      type="button" 
                      onClick={() => showFieldInfo('totp')}
                      title="Click to see where to find Zerodha TOTP Secret"
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <Info size={13} />
                    </button>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                    <input 
                      type="text" 
                      value={zerodhaTotpSecret} 
                      onChange={(e) => setZerodhaTotpSecret(e.target.value)} 
                      placeholder="e.g. JBSWY3DPEHPK3PXP"
                      style={{ paddingLeft: '40px' }}
                    />
                  </div>
                  {zerodhaTotpSecret && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, letterSpacing: '4px', color: 'var(--primary)' }}>
                        {totpCode}
                      </div>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>
                        {totpCountdown}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {totpCode === '------' ? 'No secret key' : 'Current TOTP — match this with your phone app'}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Allocated Capital (INR)</label>
                    <div style={{ position: 'relative' }}>
                      <Coins size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                      <input 
                        type="number" 
                        required 
                        value={capital} 
                        onChange={(e) => setCapital(e.target.value)} 
                        style={{ paddingLeft: '40px' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Trading Status</label>
                    <div style={{ position: 'relative' }}>
                      <Activity size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', zIndex: 5 }} />
                      <select
                        value={tradingStatus}
                        onChange={(e) => setTradingStatus(e.target.value)}
                        style={{ 
                          width: '100%', 
                          padding: '10px 14px 10px 40px', 
                          borderRadius: '8px', 
                          border: '1px solid var(--border-color)', 
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Contact & KYC Information */}
        <Card style={{ padding: '24px 28px', marginTop: '8px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary)', marginBottom: '20px', fontFamily: 'var(--font-title)' }}>
            Contact & KYC Information
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>PAN Number</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={panNumber} 
                  onChange={(e) => setPanNumber(e.target.value)} 
                  placeholder="e.g. ABCDE1234F"
                  style={{ width: '100%', height: '40px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>Aadhaar Number</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={aadhaarNumber} 
                  onChange={(e) => setAadhaarNumber(e.target.value)} 
                  placeholder="e.g. XXXX XXXX 1234"
                  style={{ width: '100%', height: '40px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>Date of Birth</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)} 
                  placeholder="e.g. 15 Jan 1990"
                  style={{ width: '100%', height: '40px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '8px' }}>KYC Status</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={kycStatus}
                  onChange={(e) => setKycStatus(e.target.value)}
                  style={{ 
                    width: '100%', 
                    height: '40px', 
                    padding: '10px 24px 10px 14px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    outline: 'none',
                    fontSize: '13px',
                    cursor: 'pointer',
                    appearance: 'none',
                    fontWeight: 600,
                    color: kycStatus === 'verified' ? 'var(--color-success)' : kycStatus === 'failed' ? 'var(--color-danger)' : 'var(--text-secondary)',
                    backgroundColor: kycStatus === 'verified' ? 'var(--color-success-bg)' : kycStatus === 'failed' ? '#fee2e2' : '#f1f5f9'
                  }}
                >
                  <option value="pending" style={{ color: 'var(--text-body)', backgroundColor: '#ffffff' }}>Pending</option>
                  <option value="verified" style={{ color: 'var(--color-success)', backgroundColor: '#ffffff' }}>Verified</option>
                  <option value="failed" style={{ color: 'var(--color-danger)', backgroundColor: '#ffffff' }}>Failed</option>
                </select>
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▼</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Render Zerodha Profile details if active session profile is loaded */}
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
                        backgroundColor: '#f1f5f9', 
                        color: '#475569',
                        border: '1px solid #e2e8f0'
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
                        backgroundColor: '#eff6ff', 
                        color: '#1e40af',
                        border: '1px solid #bfdbfe'
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
                        backgroundColor: '#f0fdf4', 
                        color: '#166534',
                        border: '1px solid #bbf7d0'
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

        {/* Render Zerodha Margins and Funds details if active session margins are loaded */}
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
              {/* Equity Segment */}
              {margins.equity && (
                <div style={{ 
                  padding: '20px', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border-light)', 
                  backgroundColor: margins.equity.enabled ? 'rgba(248, 250, 252, 0.5)' : '#fafafa',
                  opacity: margins.equity.enabled ? 1 : 0.6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Equity Segment</h5>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      padding: '3px 8px', 
                      borderRadius: '12px', 
                      backgroundColor: margins.equity.enabled ? 'rgba(16, 185, 129, 0.1)' : '#cbd5e1',
                      color: margins.equity.enabled ? 'var(--accent-dark)' : '#64748b'
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
                        {/* Available */}
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

                        {/* Utilised */}
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
                  backgroundColor: margins.commodity.enabled ? 'rgba(248, 250, 252, 0.5)' : '#fafafa',
                  opacity: margins.commodity.enabled ? 1 : 0.6
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Commodity Segment</h5>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      padding: '3px 8px', 
                      borderRadius: '12px', 
                      backgroundColor: margins.commodity.enabled ? 'rgba(16, 185, 129, 0.1)' : '#cbd5e1',
                      color: margins.commodity.enabled ? 'var(--accent-dark)' : '#64748b'
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
                        {/* Available */}
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

                        {/* Utilised */}
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
            onClick={() => router.push(APP_ROUTES.ADMIN_CLIENTS)} 
            style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            style={{ 
              padding: '12px 28px', 
              fontSize: '14px', 
              fontWeight: 600,
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              color: 'white',
              boxShadow: 'var(--shadow-blue)'
            }}
          >
            Save & Update Client
          </Button>
        </div>
      </form>

      {/* Custom Alert/Confirmation Modal */}
      {alertModal && (
        <Modal
          isOpen={!!alertModal}
          onClose={() => setAlertModal(null)}
          title={alertModal.title}
          footer={
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              {alertModal.onConfirm ? (
                <>
                  <Button variant="secondary" onClick={() => setAlertModal(null)}>Cancel</Button>
                  <Button onClick={() => {
                    const confirmFn = alertModal.onConfirm;
                    setAlertModal(null);
                    if (confirmFn) confirmFn();
                  }}>Confirm</Button>
                </>
              ) : (
                <Button onClick={() => setAlertModal(null)}>OK</Button>
              )}
            </div>
          }
        >
          <div style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.5 }}>
            {alertModal.message}
          </div>
        </Modal>
      )}
    </div>
  );
}
