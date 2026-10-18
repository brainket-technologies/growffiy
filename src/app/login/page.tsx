'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp, Shield, Zap, BarChart2, Sun, Moon, KeyRound, Mail, ArrowLeft, CheckCircle2, User, Gift, Layers, Lock, Eye, EyeOff } from 'lucide-react';
import { Loader } from '../../shared/components/views/Loader';
import { api } from '../../shared/services/api';
import { API_ENDPOINTS } from '../../core/constants';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');
  const [heroSubtitle, setHeroSubtitle] = useState('Connect your Zerodha Kite API and let our pre-open momentum engine execute disciplined, risk-managed trades while you focus on what matters.');

  // Forgot Password & Registration States
  const [view, setView] = useState<'login' | 'forgot' | 'register'>('login');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [zerodhaClientId, setZerodhaClientId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [isDark, setIsDark] = useState(true);

  // Registration States
  const [regName, setRegName] = useState('');
  const [regReferralCode, setRegReferralCode] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regProductType, setRegProductType] = useState('prod-algo');
  const [productTypes, setProductTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regAcceptTerms, setRegAcceptTerms] = useState(false);
  const [regMessage, setRegMessage] = useState<string | null>(null);

  // Initialize and Sync Theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'session_expired') {
        setError('Your session expired because your password was changed. Please log in again.');
      }

      const activeUser = localStorage.getItem('growffiy_logged_in_user_id');
      const activeUserRole = localStorage.getItem('growffiy_logged_in_user_role');
      const authToken = localStorage.getItem('growffiy_auth_token');
      
      // If user is logged in with valid token, auto navigate
      if (activeUser && authToken) {
        if (activeUserRole === 'admin') {
          window.location.replace('/admin');
          return;
        } else if (activeUserRole === 'staff') {
          window.location.replace('/staff');
          return;
        } else if (activeUserRole === 'client') {
          window.location.replace('/clients');
          return;
        }
      }
      setCheckingAuth(false);

      // Load Theme
      const savedTheme = localStorage.getItem('growffiy_theme');
      const prefersDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(prefersDark);
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Branding
  useEffect(() => {
    const load = () => {
      setBrandLogo(localStorage.getItem('growffiy_brand_logo') || '');
      setBrandName(localStorage.getItem('growffiy_brand_name') || 'Growffiy');
      setHeroSubtitle(localStorage.getItem('growffiy_hero_subtitle') || 'Connect your Zerodha Kite API and let our pre-open momentum engine execute disciplined, risk-managed trades while you focus on what matters.');
    };
    load();

    fetch(API_ENDPOINTS.SETTINGS_PUBLIC).then(res => res.json()).then((data: any) => {
      if (data && data.success) {
        if (data.appName) {
          setBrandName(data.appName);
          if (typeof window !== 'undefined') localStorage.setItem('growffiy_brand_name', data.appName);
        }
        if (data.appLogo !== undefined) {
          setBrandLogo(data.appLogo);
          if (typeof window !== 'undefined') localStorage.setItem('growffiy_brand_logo', data.appLogo);
        }
        if (data.heroSubtitle) {
          setHeroSubtitle(data.heroSubtitle);
          if (typeof window !== 'undefined') localStorage.setItem('growffiy_hero_subtitle', data.heroSubtitle);
        }
      }
    }).catch(() => {});

    window.addEventListener('branding-updated', load);
    return () => window.removeEventListener('branding-updated', load);
  }, []);

  // Fetch product types for registration dropdown
  useEffect(() => {
    fetch('/api/v1/product-types')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.data)) {
          setProductTypes(data.data);
          const defaultAlgo = data.data.find((p: any) => p.name.toLowerCase().includes('algo') || p.id === 'prod-algo');
          if (defaultAlgo) {
            setRegProductType(defaultAlgo.id);
          } else if (data.data.length > 0) {
            setRegProductType(data.data[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    const theme = nextDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('growffiy_theme', theme);
  };

  if (checkingAuth) {
    return <Loader title="Verifying session" text="Checking authentication status..." />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await api.post(API_ENDPOINTS.AUTH_LOGIN, {
        userId,
        password,
        role: 'client'
      });

      if (!res.success) {
        setError(res.error || 'Invalid user credentials');
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('growffiy_logged_in_user_id', res.user.id);
        localStorage.setItem('growffiy_logged_in_user_name', res.user.name || userId);
        localStorage.setItem('growffiy_logged_in_user_email', res.user.email || '');
        localStorage.setItem('growffiy_logged_in_user_role', 'client');
        if (res.token) {
          localStorage.setItem('growffiy_auth_token', res.token);
        }
        localStorage.setItem('growffiy_remember_me', String(rememberMe));
        if (rememberMe) {
          localStorage.setItem('growffiy_saved_user_id', userId);
        } else {
          localStorage.removeItem('growffiy_saved_user_id');
        }
      }
      
      setTimeout(() => {
        window.location.replace('/clients');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Server error occurred during login');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regAcceptTerms) {
      setError('Please accept the Terms and Conditions and Privacy Policy');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    setRegMessage(null);

    try {
      const res = await api.post('/api/auth/register', {
        fullName: regName,
        referralCode: regReferralCode.trim() || undefined,
        email: regEmail.trim(),
        productType: regProductType || 'prod-algo',
        tradingStrategies: [], // empty as requested
        password: regPassword
      });

      if (!res.success) {
        setError(res.error || 'Registration failed');
        setLoading(false);
        return;
      }

      setRegMessage(res.message || 'Account registered successfully! Redirecting to login...');
      setLoading(false);
      
      // Clear fields
      setRegName('');
      setRegReferralCode('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegAcceptTerms(false);

      setTimeout(() => {
        setView('login');
        setRegMessage(null);
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Server error occurred during registration');
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setForgotMessage(null);

    try {
      if (forgotStep === 1) {
        // Step 1: Send OTP
        const res = await api.post('/api/auth/forgot-password', {
          action: 'send-otp',
          zerodhaClientId
        });

        if (res.success) {
          setMaskedEmail(res.maskedEmail || '');
          setForgotStep(2);
          setForgotMessage(`Verification code sent to registered email: ${res.maskedEmail}`);
        } else {
          setError(res.error || 'Failed to send verification code');
        }
      } else {
        // Step 2: Verify & Reset
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const res = await api.post('/api/auth/forgot-password', {
          action: 'reset-password',
          zerodhaClientId,
          otp,
          newPassword
        });

        if (res.success) {
          setForgotMessage('Password reset successfully! Redirecting to login...');
          setTimeout(() => {
            setView('login');
            setForgotStep(1);
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
            setForgotMessage(null);
            setError(null);
          }, 2000);
        } else {
          setError(res.error || 'Invalid verification code or password update failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Verification request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@700;800;900&display=swap');
        @keyframes floatCard1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes floatCard2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(10px)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }

        .login-wrap {
          height: 100vh;
          max-height: 100vh;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          font-family: 'Inter', sans-serif;
          background-color: var(--bg);
          color: var(--text-body);
          transition: background-color 0.3s, color 0.3s;
        }

        @media (max-width: 992px) {
          .login-wrap { grid-template-columns: 1fr; }
          .login-left  { display: none !important; }
          .login-mobile-bar { display: flex !important; }
          .login-right { padding: 40px 24px; }
        }
        @media (max-width: 480px) {
          .login-right { padding: 24px 16px !important; }
          .login-wrap { height: auto; min-height: 100vh; }
          .login-left-stats { gap: 16px !important; flex-wrap: wrap !important; }
          .login-left-stats > div { min-width: 80px; }
        }

        .login-left {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 56px;
        }

        .login-right {
          background: var(--bg-white);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 48px;
          position: relative;
          transition: background-color 0.3s;
          overflow-y: auto;
          max-height: 100vh;
        }

        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .login-input-icon {
          position: absolute;
          left: 14px;
          color: #8391A1;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .login-input-with-icon {
          padding-left: 42px !important;
        }
        .login-input-eye {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #8391A1;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: color 0.2s;
        }
        .login-input-eye:hover {
          color: var(--text-heading);
        }
        .login-select {
          width: 100%;
          padding: 13px 40px 13px 42px;
          border-radius: 12px;
          border: 1.5px solid var(--border);
          background: var(--surface);
          font-size: 15px;
          color: var(--text-heading);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background-color 0.3s;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238391A1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 14px center;
          background-size: 16px;
        }
        .login-select:focus {
          border-color: #1E88FF;
          box-shadow: 0 0 0 3px rgba(30,136,255,0.15);
        }

        .login-mobile-bar {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #0f172a;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .login-input {
          width: 100%;
          padding: 13px 16px;
          border-radius: 12px;
          border: 1.5px solid var(--border);
          background: var(--surface);
          font-size: 15px;
          color: var(--text-heading);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background-color 0.3s;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
        }
        .login-input:focus {
          border-color: #1E88FF;
          box-shadow: 0 0 0 3px rgba(30,136,255,0.15);
        }
        .login-input::placeholder {
          color: var(--text-subtle);
        }

        .login-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>

      {/* Mobile sticky branding bar */}
      <div className="login-mobile-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #1E88FF, #1252AB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/logo.png" alt="Growffiy" style={{ width: 18, height: 18, objectFit: 'contain' }} />
          </div>
          <span style={{
            fontSize: 18, fontWeight: 800, color: '#f1f5f9',
            fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px',
          }}>GROWFFIY</span>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#1E88FF',
          background: 'rgba(30,136,255,0.1)',
          border: '1px solid rgba(30,136,255,0.2)',
          padding: '4px 10px', borderRadius: 99, letterSpacing: '0.5px',
        }}>CLIENT LOGIN</div>
      </div>

      <div className="login-wrap">
        {/* ═══ LEFT PANEL ═══ */}
        <div className="login-left">
          <div style={{
            position: 'absolute', top: '-20%', right: '-10%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)',
            animation: 'floatCard1 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '-15%', left: '-5%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(18,82,171,0.12) 0%, transparent 70%)',
            animation: 'floatCard2 10s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #1E88FF, #1252AB)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src={brandLogo || '/logo.png'} alt={brandName} style={{ width: 22, height: 22, objectFit: 'contain' }} />
              </div>
              <span style={{
                fontSize: 22, fontWeight: 800, color: '#f1f5f9',
                fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px',
              }}>{brandName.toUpperCase()}</span>
            </div>

            <h1 style={{
              fontSize: 40, fontWeight: 800, lineHeight: 1.15,
              color: '#f1f5f9', fontFamily: 'Outfit, sans-serif',
              letterSpacing: '-1px', marginBottom: 16,
            }}>
              Your Trades,<br />
              <span style={{
                background: 'linear-gradient(135deg, #1E88FF, #818cf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Fully Automated
              </span>
            </h1>

            <p style={{ fontSize: 15, lineHeight: 1.7, color: '#94a3b8', maxWidth: 420, marginBottom: 40 }}>
              {heroSubtitle}
            </p>


          </div>
        </div>

        {/* ═══ RIGHT PANEL — Login/Forgot Forms ═══ */}
        <div className="login-right">
          {/* Theme Switcher Button */}
          <button 
            onClick={toggleTheme} 
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-heading)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s',
              zIndex: 10
            }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Subtle dot pattern */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: isDark 
              ? 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)' 
              : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none'
          }} />

          <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 400 }}>
            
            {/* ═══ VIEW: SIGN IN FORM ═══ */}
            {view === 'login' && (
              <>
                <div style={{ marginBottom: 32 }}>
                  <h2 style={{
                    fontSize: 26, fontWeight: 800, color: 'var(--text-heading)',
                    fontFamily: 'Outfit, sans-serif', marginBottom: 8,
                  }}>
                    Welcome to {brandName}
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Sign in to access your algorithmic trading dashboard.
                  </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {error && (
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      backgroundColor: 'rgba(239,68,68,0.08)',
                      border: '1.5px solid var(--danger)',
                      color: 'var(--danger)',
                      fontSize: '13px',
                      fontWeight: 600,
                      lineHeight: 1.5,
                    }}>
                      ⚠️ {error}
                    </div>
                  )}

                  <div>
                    <label className="login-label">Client ID / Zerodha ID</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Client ID or Zerodha ID"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="login-input"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <label className="login-label" style={{ marginBottom: 0 }}>Password</label>
                      <button 
                        type="button" 
                        onClick={() => { setView('forgot'); setForgotStep(1); setError(null); setForgotMessage(null); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#1E88FF',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif'
                        }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="login-input"
                      autoComplete="new-password"
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '2px 0 6px 0' }}>
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        border: '1.5px solid var(--border)',
                        cursor: 'pointer',
                        accentColor: '#1E88FF'
                      }}
                    />
                    <label 
                      htmlFor="rememberMe" 
                      style={{ 
                        fontSize: '13px', 
                        color: 'var(--text-secondary)', 
                        fontWeight: 500, 
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      Remember Me
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 12,
                      border: 'none', fontWeight: 700, fontSize: 15,
                      cursor: loading ? 'wait' : 'pointer',
                      background: 'linear-gradient(135deg, #1E88FF 0%, #1252AB 100%)',
                      color: 'white',
                      boxShadow: '0 6px 20px rgba(30,136,255,0.25)',
                      transition: 'all 0.3s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: loading ? 0.75 : 1,
                      marginTop: 6,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{
                          width: 16, height: 16,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                        }} />
                        Signing in...
                      </>
                    ) : (
                      <>Sign In <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>

                <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setView('register'); setError(null); setRegMessage(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1E88FF',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      padding: 0
                    }}
                  >
                    Create Account
                  </button>
                </div>
              </>
            )}

            {/* ═══ VIEW: REGISTRATION FORM ═══ */}
            {view === 'register' && (
              <>
                <div style={{ marginBottom: 24 }}>
                  <button 
                    onClick={() => { setView('login'); setError(null); setRegMessage(null); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'none',
                      border: 'none',
                      color: '#1E88FF',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      marginBottom: 16,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    <ArrowLeft size={16} /> Back to Sign In
                  </button>
                  <h2 style={{
                    fontSize: 26, fontWeight: 800, color: 'var(--text-heading)',
                    fontFamily: 'Outfit, sans-serif', marginBottom: 8,
                  }}>
                    Create Account
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Register now as a client to automate your trading.
                  </p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  {error && (
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      backgroundColor: 'rgba(239,68,68,0.08)',
                      border: '1.5px solid var(--danger)',
                      color: 'var(--danger)',
                      fontSize: '13px',
                      fontWeight: 600,
                      lineHeight: 1.5,
                    }}>
                      ⚠️ {error}
                    </div>
                  )}

                  {regMessage && (
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      backgroundColor: 'rgba(16,185,129,0.08)',
                      border: '1.5px solid #10b981',
                      color: '#10b981',
                      fontSize: '13px',
                      fontWeight: 600,
                      lineHeight: 1.5,
                    }}>
                      ✓ {regMessage}
                    </div>
                  )}

                  <div>
                    <label className="login-label">Full Name</label>
                    <div className="login-input-wrap">
                      <div className="login-input-icon"><User size={18} /></div>
                      <input
                        type="text"
                        required
                        placeholder="Enter your full name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="login-input login-input-with-icon"
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="login-label">Referral Code (Optional)</label>
                    <div className="login-input-wrap">
                      <div className="login-input-icon"><Gift size={18} /></div>
                      <input
                        type="text"
                        placeholder="Enter referral code (if any)"
                        value={regReferralCode}
                        onChange={(e) => setRegReferralCode(e.target.value)}
                        className="login-input login-input-with-icon"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="login-label">Email Address</label>
                    <div className="login-input-wrap">
                      <div className="login-input-icon"><Mail size={18} /></div>
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="login-input login-input-with-icon"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="login-label">Product Type</label>
                    <div className="login-input-wrap">
                      <div className="login-input-icon"><Layers size={18} /></div>
                      <select
                        required
                        value={regProductType}
                        onChange={(e) => setRegProductType(e.target.value)}
                        className="login-select"
                      >
                        {productTypes.length === 0 ? (
                          <option value="prod-algo">Algo</option>
                        ) : (
                          productTypes.map((pt) => (
                            <option key={pt.id} value={pt.id}>
                              {pt.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="login-label">Password</label>
                    <div className="login-input-wrap">
                      <div className="login-input-icon"><Lock size={18} /></div>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="Choose a strong password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="login-input login-input-with-icon"
                        style={{ paddingRight: 42 }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="login-input-eye"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        tabIndex={-1}
                        title={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="login-label">Confirm Password</label>
                    <div className="login-input-wrap">
                      <div className="login-input-icon"><Lock size={18} /></div>
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="login-input login-input-with-icon"
                        style={{ paddingRight: 42 }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="login-input-eye"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        tabIndex={-1}
                        title={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 4 }}>
                    <input
                      type="checkbox"
                      id="regTerms"
                      required
                      checked={regAcceptTerms}
                      onChange={(e) => setRegAcceptTerms(e.target.checked)}
                      style={{
                        marginTop: 3,
                        width: 16,
                        height: 16,
                        cursor: 'pointer',
                        accentColor: '#1E88FF',
                      }}
                    />
                    <label htmlFor="regTerms" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}>
                      I accept the{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#1E88FF', fontWeight: 600, textDecoration: 'none' }}>
                        Terms and Conditions
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#1E88FF', fontWeight: 600, textDecoration: 'none' }}>
                        Privacy Policy
                      </a>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 12,
                      border: 'none', fontWeight: 700, fontSize: 15,
                      cursor: loading ? 'wait' : 'pointer',
                      background: 'linear-gradient(135deg, #1E88FF 0%, #1252AB 100%)',
                      color: 'white',
                      boxShadow: '0 6px 20px rgba(30,136,255,0.25)',
                      transition: 'all 0.3s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: loading ? 0.75 : 1,
                      marginTop: 6,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Register Account'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setView('login'); setError(null); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1E88FF',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: 14,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      Login
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ═══ VIEW: FORGOT PASSWORD ═══ */}
            {view === 'forgot' && (
              <>
                <div style={{ marginBottom: 32 }}>
                  <button 
                    onClick={() => { setView('login'); setError(null); setForgotMessage(null); }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'none',
                      border: 'none',
                      color: '#1E88FF',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      marginBottom: 16,
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    <ArrowLeft size={16} /> Back to Sign In
                  </button>

                  <h2 style={{
                    fontSize: 26, fontWeight: 800, color: 'var(--text-heading)',
                    fontFamily: 'Outfit, sans-serif', marginBottom: 8,
                  }}>
                    Reset Password
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {forgotStep === 1 
                      ? 'Enter your Zerodha Client ID to receive a 6-digit verification code.'
                      : `Enter the code sent to ${maskedEmail} and create a new password.`}
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {error && (
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      backgroundColor: 'rgba(239,68,68,0.08)',
                      border: '1.5px solid var(--danger)',
                      color: 'var(--danger)',
                      fontSize: '13px',
                      fontWeight: 600,
                      lineHeight: 1.5,
                    }}>
                      ⚠️ {error}
                    </div>
                  )}

                  {forgotMessage && (
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      backgroundColor: 'rgba(16,185,129,0.08)',
                      border: '1.5px solid var(--accent)',
                      color: 'var(--accent)',
                      fontSize: '13px',
                      fontWeight: 600,
                      lineHeight: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <CheckCircle2 size={16} /> {forgotMessage}
                    </div>
                  )}

                  {/* STEP 1: Enter Zerodha Client ID */}
                  {forgotStep === 1 && (
                    <div>
                      <label className="login-label">Zerodha Client ID</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          required
                          placeholder="Enter your Zerodha Client ID"
                          value={zerodhaClientId}
                          onChange={(e) => setZerodhaClientId(e.target.value)}
                          className="login-input"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Enter OTP Code & Reset Password */}
                  {forgotStep === 2 && (
                    <>
                      <div>
                        <label className="login-label">Verification Code (6-Digit OTP)</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="Enter 6-digit OTP code"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                          className="login-input"
                          style={{ letterSpacing: '2px', textAlign: 'center', fontWeight: 'bold' }}
                          autoComplete="off"
                        />
                      </div>

                      <div>
                        <label className="login-label">New Password</label>
                        <input
                          type="password"
                          required
                          placeholder="Min 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="login-input"
                          autoComplete="new-password"
                        />
                      </div>

                      <div>
                        <label className="login-label">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="login-input"
                          autoComplete="new-password"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 12,
                      border: 'none', fontWeight: 700, fontSize: 15,
                      cursor: loading ? 'wait' : 'pointer',
                      background: 'linear-gradient(135deg, #1E88FF 0%, #1252AB 100%)',
                      color: 'white',
                      boxShadow: '0 6px 20px rgba(30,136,255,0.25)',
                      transition: 'all 0.3s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: loading ? 0.75 : 1,
                      marginTop: 6,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{
                          width: 16, height: 16,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                        }} />
                        Processing...
                      </>
                    ) : (
                      forgotStep === 1 ? (
                        <>Send Verification Code <Mail size={16} /></>
                      ) : (
                        <>Reset Password <KeyRound size={16} /></>
                      )
                    )}
                  </button>

                  {forgotStep === 2 && (
                    <button
                      type="button"
                      onClick={() => { setForgotStep(1); setError(null); setForgotMessage(null); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        marginTop: 4,
                        fontFamily: 'Inter, sans-serif'
                      }}
                    >
                      Resend Verification Code (OTP)
                    </button>
                  )}
                </form>
              </>
            )}


          </div>
        </div>
      </div>
    </>
  );
}
