'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ArrowRight, TrendingUp, Shield, Zap, BarChart2 } from 'lucide-react';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/constants';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeUser = localStorage.getItem('growffiy_logged_in_user_id');
      const isSessionPersistent = localStorage.getItem('growffiy_remember_me') === 'true';
      
      // If user is logged in, auto navigate to dashboard
      if (activeUser) {
        window.location.href = '/dashboard';
      }

      // Pre-fill user ID if remembered
      const savedUserId = localStorage.getItem('growffiy_saved_user_id');
      if (savedUserId) {
        setUserId(savedUserId);
        setRememberMe(true);
      }
    }
  }, []);

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
        localStorage.setItem('growffiy_logged_in_user_id', userId);
        localStorage.setItem('growffiy_remember_me', String(rememberMe));
        if (rememberMe) {
          localStorage.setItem('growffiy_saved_user_id', userId);
        } else {
          localStorage.removeItem('growffiy_saved_user_id');
        }
      }
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Server error occurred during login');
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

        .login-wrap {
          height: 100vh;
          max-height: 100vh;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          font-family: 'Inter', sans-serif;
        }

        /* Mobile: hide left panel, single column */
        @media (max-width: 768px) {
          .login-wrap { grid-template-columns: 1fr; }
          .login-left  { display: none !important; }
          .login-mobile-bar { display: flex !important; }
          .login-right { padding: 24px 20px 40px; }
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
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
        }

        /* Mobile top bar — hidden on desktop */
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
          border: 1.5px solid #e2e8f0;
          background: white;
          font-size: 15px;
          color: #0f172a;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
        }
        .login-input:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.12);
        }
      `}</style>

      {/* Mobile sticky branding bar */}
      <div className="login-mobile-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={16} color="white" />
          </div>
          <span style={{
            fontSize: 18, fontWeight: 800, color: '#f1f5f9',
            fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px',
          }}>GROWFFIY</span>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#0ea5e9',
          background: 'rgba(14,165,233,0.1)',
          border: '1px solid rgba(14,165,233,0.2)',
          padding: '4px 10px', borderRadius: 99, letterSpacing: '0.5px',
        }}>CLIENT LOGIN</div>
      </div>

      <div className="login-wrap">

        {/* ═══ LEFT PANEL ═══ */}
        <div className="login-left">
          {/* Blobs */}
          <div style={{
            position: 'absolute', top: '-20%', right: '-10%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)',
            animation: 'floatCard1 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute', bottom: '-15%', left: '-5%',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            animation: 'floatCard2 10s ease-in-out infinite',
          }} />
          {/* Grid overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={20} color="white" />
              </div>
              <span style={{
                fontSize: 22, fontWeight: 800, color: '#f1f5f9',
                fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.5px',
              }}>GROWFFIY</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 40, fontWeight: 800, lineHeight: 1.15,
              color: '#f1f5f9', fontFamily: 'Outfit, sans-serif',
              letterSpacing: '-1px', marginBottom: 16,
            }}>
              Your Trades,<br />
              <span style={{
                background: 'linear-gradient(135deg, #0ea5e9, #818cf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Fully Automated
              </span>
            </h1>

            <p style={{ fontSize: 15, lineHeight: 1.7, color: '#94a3b8', maxWidth: 420, marginBottom: 40 }}>
              Connect your Zerodha Kite API and let our pre-open momentum engine execute disciplined, risk-managed trades while you focus on what matters.
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: <TrendingUp size={16} />, text: 'Pre-Open Momentum Breakout Strategy', color: '#0ea5e9' },
                { icon: <Shield size={16} />, text: '1% Capital Risk Guard on Every Trade', color: '#10b981' },
                { icon: <Zap size={16} />, text: 'Auto MIS Bracket Orders via Kite API', color: '#f59e0b' },
                { icon: <BarChart2 size={16} />, text: 'Live P&L Dashboard & Telegram Alerts', color: '#818cf8' },
              ].map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  animation: `fadeInUp 0.5s ease ${0.2 + i * 0.1}s both`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${f.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: f.color, flexShrink: 0,
                  }}>
                    {f.icon}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>{f.text}</span>
                </div>
              ))}
            </div>

            {/* Stats bar */}
            <div style={{
              display: 'flex', gap: 32, marginTop: 48,
              paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)',
            }}>
              {[
                { val: '₹12.4Cr+', lbl: 'Capital Managed' },
                { val: '1,200+', lbl: 'Trades Executed' },
                { val: '68%', lbl: 'Win Rate' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>{s.val}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Login Form ═══ */}
        <div className="login-right">
          {/* Subtle dot pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }} />

          <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 400 }}>
            {/* Welcome text */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: 26, fontWeight: 800, color: '#0f172a',
                fontFamily: 'Outfit, sans-serif', marginBottom: 8,
              }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>
                Sign in to access your trading dashboard and manage your portfolio.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {error && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  backgroundColor: '#fef2f2',
                  border: '1.5px solid #fee2e2',
                  color: '#b91c1c',
                  fontSize: '13px',
                  fontWeight: 600,
                  lineHeight: 1.5,
                  textAlign: 'left'
                }}>
                  ⚠️ {error}
                </div>
              )}
              <div>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 700, color: '#334155',
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  Client ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. aman_sharma"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="login-input"
                />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 700, color: '#334155',
                  marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                />
              </div>

              {/* Remember Me Checkbox option */}
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
                    border: '1.5px solid #cbd5e1',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                />
                <label 
                  htmlFor="rememberMe" 
                  style={{ 
                    fontSize: '13px', 
                    color: '#475569', 
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
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                  color: 'white',
                  boxShadow: '0 6px 20px rgba(14,165,233,0.3)',
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

            {/* Bottom info */}
            <div style={{
              marginTop: 28, paddingTop: 24,
              borderTop: '1px solid #e2e8f0',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
                🔒 Protected by 256-bit SSL encryption.<br />
                By signing in you agree to our{' '}
                <a href="/terms" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>Terms</a>
                {' & '}
                <a href="/privacy" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
