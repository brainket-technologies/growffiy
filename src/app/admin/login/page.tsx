'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Eye, EyeOff, Lock, User, AlertTriangle, Server, Database, BarChart2 } from 'lucide-react';
import { THEME_COLORS, API_ENDPOINTS } from '../../../lib/constants';
import { api } from '../../../lib/api';

export default function AdminLoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeUser = localStorage.getItem('growffiy_logged_in_user_id');
      // If admin or any user session is logged in, auto navigate to dashboard
      if (activeUser) {
        window.location.href = '/admin';
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
        role: 'admin'
      });

      if (!res.success) {
        setError(res.error || 'Invalid administrator credentials');
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('growffiy_logged_in_user_id', userId);
      }
      
      setTimeout(() => {
        window.location.href = '/admin';
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Server error occurred during admin login');
      setLoading(false);
    }
  };

  return (
    <>
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      .admin-login-wrap {
        height: 100vh;
        max-height: 100vh;
        overflow: hidden;
        display: flex;
        font-family: 'Inter', -apple-system, sans-serif;
      }
      .admin-left-panel {
        flex: 0 0 45%;
        background: linear-gradient(135deg, #0b1329 0%, #111c44 50%, #080d1a 100%);
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 120px;
        padding: 48px 64px;
        position: relative;
        overflow: hidden;
      }
      .admin-right-panel {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8fafc;
        padding: 48px 40px;
      }
      .admin-mobile-bar {
        display: none;
        align-items: center;
        justify-content: space-between;
        padding: 14px 20px;
        background: #0f172a;
        position: sticky;
        top: 0;
        z-index: 50;
      }
      @media (max-width: 768px) {
        .admin-login-wrap { flex-direction: column; }
        .admin-left-panel  { display: none !important; }
        .admin-mobile-bar  { display: flex !important; }
        .admin-right-panel { padding: 32px 20px 48px; }
      }
    `}</style>

    {/* Mobile sticky branding bar */}
    <div className="admin-mobile-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: `linear-gradient(135deg, ${THEME_COLORS.PRIMARY}, #6366f1)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Activity size={15} color="white" />
        </div>
        <span style={{ fontSize: 17, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.5px' }}>GROWFFIY</span>
      </div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: THEME_COLORS.PRIMARY,
        background: 'rgba(37,99,235,0.1)',
        border: '1px solid rgba(37,99,235,0.2)',
        padding: '4px 10px', borderRadius: 99, letterSpacing: '0.8px',
      }}>ADMIN CONSOLE</div>
    </div>

    <div className="admin-login-wrap">
      {/* ── LEFT PANEL ── */}
      <div className="admin-left-panel">
        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `linear-gradient(135deg, ${THEME_COLORS.PRIMARY}, #6366f1)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={20} color="white" />
            </div>
            <span style={{
              fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px',
              background: `linear-gradient(to right, ${THEME_COLORS.PRIMARY}, #818cf8)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              GROWFFIY
            </span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 12, padding: '4px 12px', borderRadius: 99,
            background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)',
          }}>
            <ShieldCheck size={12} color={THEME_COLORS.PRIMARY} />
            <span style={{ fontSize: 11, fontWeight: 700, color: THEME_COLORS.PRIMARY, letterSpacing: 1 }}>
              ADMIN CONSOLE
            </span>
          </div>
        </div>

        {/* Main headline */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: 40, fontWeight: 900, color: 'white',
            letterSpacing: '-1.2px', lineHeight: 1.15, marginBottom: 16,
          }}>
            System Control
            <br />
            <span style={{
              background: `linear-gradient(to right, ${THEME_COLORS.PRIMARY}, #818cf8)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Center
            </span>
          </h1>
          <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, margin: 0, maxWidth: 360 }}>
            Restricted access. Authorized personnel only. All sessions are logged and monitored for system compliance.
          </p>
        </div>

      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{
              fontSize: 28, fontWeight: 800, color: '#0f172a',
              letterSpacing: '-0.5px', marginBottom: 8,
            }}>
              Admin Sign In
            </h2>
            <p style={{ fontSize: 14, color: '#64748b' }}>
              Enter your administrator credentials to access the control panel.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
            {/* Admin ID field */}
            <div>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: '#374151', marginBottom: 8,
              }}>
                Admin ID / Email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: focusedField === 'userId' ? THEME_COLORS.PRIMARY : '#9ca3af',
                  transition: 'color 0.2s',
                }}>
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin@growffiy.in"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onFocus={() => setFocusedField('userId')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  style={{
                    width: '100%',
                    padding: '13px 14px 13px 44px',
                    borderRadius: 12,
                    border: `1.5px solid ${focusedField === 'userId' ? THEME_COLORS.PRIMARY : '#e2e8f0'}`,
                    background: 'white',
                    color: '#0f172a',
                    fontSize: 14,
                    outline: 'none',
                    boxShadow: focusedField === 'userId' ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 600,
                color: '#374151', marginBottom: 8,
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: focusedField === 'password' ? THEME_COLORS.PRIMARY : '#9ca3af',
                  transition: 'color 0.2s',
                }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    padding: '13px 44px 13px 44px',
                    borderRadius: 12,
                    border: `1.5px solid ${focusedField === 'password' ? THEME_COLORS.PRIMARY : '#e2e8f0'}`,
                    background: 'white',
                    color: '#0f172a',
                    fontSize: 14,
                    outline: 'none',
                    boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', padding: 0, display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: loading
                  ? `linear-gradient(135deg, ${THEME_COLORS.PRIMARY}, #1d4ed8)`
                  : `linear-gradient(135deg, ${THEME_COLORS.PRIMARY}, #1d4ed8)`,
                color: 'white',
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.85 : 1,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                letterSpacing: 0.3,
                marginTop: 4,
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Authenticating...
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Sign In as Admin
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{
            marginTop: 40, paddingTop: 24,
            borderTop: '1px solid #e2e8f0',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              🔒 All admin sessions are encrypted and logged
            </p>
            <p style={{ fontSize: 12, color: '#cbd5e1', marginTop: 6 }}>
              © 2026 Growffiy Inc. — Restricted Access
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
    </>
  );
}
