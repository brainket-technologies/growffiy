'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Eye, EyeOff, Lock, User, AlertTriangle, Server, Database, BarChart2 } from 'lucide-react';
import { THEME_COLORS } from '../../../lib/constants';

export default function AdminLoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeUser = localStorage.getItem('growffiy_logged_in_user_id');
      // If admin or any user session is logged in, auto navigate to dashboard
      if (activeUser) {
        window.location.href = activeUser.toLowerCase().includes('admin') ? '/admin' : '/dashboard';
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('growffiy_logged_in_user_id', userId);
    }
    
    setTimeout(() => {
      window.location.href = '/admin';
    }, 1000);
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
        background: linear-gradient(145deg, #0f172a 0%, #1a0a2e 50%, #0f172a 100%);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 48px 56px;
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
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Activity size={15} color="white" />
        </div>
        <span style={{ fontSize: 17, fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.5px' }}>GROWFFIY</span>
      </div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#f59e0b',
        background: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.2)',
        padding: '4px 10px', borderRadius: 99, letterSpacing: '0.8px',
      }}>ADMIN CONSOLE</div>
    </div>

    <div className="admin-login-wrap">
      {/* ── LEFT PANEL ── */}
      <div className="admin-left-panel">
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(245,158,11,0.5) 30px, rgba(245,158,11,0.5) 31px),
                            repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(245,158,11,0.5) 30px, rgba(245,158,11,0.5) 31px)`,
        }} />

        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 280, height: 280, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={20} color="white" />
            </div>
            <span style={{
              fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px',
              background: 'linear-gradient(to right, #fbbf24, #f87171)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              GROWFFIY
            </span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 12, padding: '4px 12px', borderRadius: 99,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
          }}>
            <ShieldCheck size={12} color="#f59e0b" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: 1 }}>
              ADMIN CONSOLE
            </span>
          </div>
        </div>

        {/* Main headline */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: 36, fontWeight: 900, color: 'white',
            letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 16,
          }}>
            System Control
            <br />
            <span style={{
              background: 'linear-gradient(to right, #fbbf24, #f87171)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Center
            </span>
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 40 }}>
            Restricted access. Authorized personnel only. All sessions are logged and monitored.
          </p>

          {/* System stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: <Server size={16} color="#f59e0b" />, label: 'System Status', value: 'All Systems Operational', color: '#22c55e' },
              { icon: <Database size={16} color="#f59e0b" />, label: 'Active Clients', value: '—', color: '#94a3b8' },
              { icon: <BarChart2 size={16} color="#f59e0b" />, label: 'Today\'s Trades', value: '—', color: '#94a3b8' },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: 'rgba(245,158,11,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: item.color, fontWeight: 700 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '14px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
        }}>
          <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            Unauthorized access attempts are logged and reported to security teams. By logging in, you agree to
            the admin terms of use.
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
                  color: focusedField === 'userId' ? '#f59e0b' : '#9ca3af',
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
                  style={{
                    width: '100%',
                    padding: '13px 14px 13px 44px',
                    borderRadius: 12,
                    border: `1.5px solid ${focusedField === 'userId' ? '#f59e0b' : '#e2e8f0'}`,
                    background: 'white',
                    color: '#0f172a',
                    fontSize: 14,
                    outline: 'none',
                    boxShadow: focusedField === 'userId' ? '0 0 0 3px rgba(245,158,11,0.1)' : 'none',
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
                  color: focusedField === 'password' ? '#f59e0b' : '#9ca3af',
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
                  style={{
                    width: '100%',
                    padding: '13px 44px 13px 44px',
                    borderRadius: 12,
                    border: `1.5px solid ${focusedField === 'password' ? '#f59e0b' : '#e2e8f0'}`,
                    background: 'white',
                    color: '#0f172a',
                    fontSize: 14,
                    outline: 'none',
                    boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(245,158,11,0.1)' : 'none',
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
                  ? 'linear-gradient(135deg, #d97706, #dc2626)'
                  : 'linear-gradient(135deg, #f59e0b, #ef4444)',
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
