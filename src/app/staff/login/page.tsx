'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp, Shield, Zap, BarChart2, Sun, Moon, KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Loader } from '../../../shared/components/views/Loader';
import { api } from '../../../shared/services/api';

export default function StaffLoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('Growffiy');
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      const storedRole = localStorage.getItem('growffiy_logged_in_user_role');
      if (storedId && storedRole === 'staff') {
        window.location.href = '/staff';
        return;
      }
      setCheckingAuth(false);

      const savedTheme = localStorage.getItem('growffiy_theme');
      const prefersDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(prefersDark);
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    const load = () => {
      setBrandLogo(localStorage.getItem('growffiy_brand_logo') || '');
      setBrandName(localStorage.getItem('growffiy_brand_name') || 'Growffiy');
    };
    load();
    window.addEventListener('branding-updated', load);
    return () => window.removeEventListener('branding-updated', load);
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
      const res = await api.post('/api/auth/staff-login', { userId, password });

      if (!res.success) {
        setError(res.error || 'Invalid staff credentials');
        setLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('growffiy_logged_in_user_id', res.staff.id);
        localStorage.setItem('growffiy_logged_in_staff_userId', res.staff.userId);
        localStorage.setItem('growffiy_logged_in_user_name', res.staff.name);
        localStorage.setItem('growffiy_logged_in_user_role', 'staff');
        localStorage.setItem('growffiy_staff_permissions', JSON.stringify(res.staff.permissions || []));
        localStorage.setItem('growffiy_staff_id', res.staff.id);
      }

      setTimeout(() => {
        window.location.href = '/staff';
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

        @media (max-width: 1024px) {
          .login-wrap { grid-template-columns: 1fr; }
          .login-left  { display: none !important; }
          .login-mobile-bar { display: flex !important; }
          .login-right { padding: 40px 24px; }
        }
        @media (max-width: 768px) {
          .login-right { padding: 36px 20px; }
          .login-left { display: none !important; }
        }
        @media (max-width: 480px) {
          .login-right { padding: 28px 14px !important; }
          .login-right h2 { font-size: 22px !important; }
          .login-right > div > div:first-child { margin-bottom: 24px !important; }
          .login-input { padding: 11px 14px !important; font-size: 14px !important; }
          .login-right form { gap: 14px !important; }
          .login-right button[type="submit"] { padding: 12px !important; font-size: 14px !important; }
          .login-right > div { max-width: 100% !important; }
        }

        @media (max-width: 380px) {
          .login-right { padding: 24px 12px !important; }
          .login-mobile-bar { padding: 12px 16px !important; }
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
          padding: 60px 48px;
          position: relative;
          transition: background-color 0.3s;
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
          fontSize: 11, fontWeight: 700, color: '#818cf8',
          background: 'rgba(129,140,248,0.1)',
          border: '1px solid rgba(129,140,248,0.2)',
          padding: '4px 10px', borderRadius: 99, letterSpacing: '0.5px',
        }}>STAFF PORTAL</div>
      </div>

      <div className="login-wrap">
        {/* ═══ LEFT PANEL ═══ */}
        <div className="login-left">
          <div style={{
            position: 'absolute', top: '-20%', right: '-10%',
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)',
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
                background: 'linear-gradient(135deg, #818cf8, #1252AB)',
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
              Staff Control<br />
              <span style={{
                background: 'linear-gradient(135deg, #818cf8, #1E88FF)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Panel
              </span>
            </h1>

            <p style={{ fontSize: 15, lineHeight: 1.7, color: '#94a3b8', maxWidth: 420, marginBottom: 40 }}>
              Manage clients, monitor trades, and access permitted modules. All actions are logged and audited.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: <TrendingUp size={16} />, text: 'Client Management & Onboarding', color: '#818cf8' },
                { icon: <Shield size={16} />, text: 'Role-Based Module Access Control', color: '#10b981' },
                { icon: <Zap size={16} />, text: 'Real-Time Trading & Market Data', color: '#f59e0b' },
                { icon: <BarChart2 size={16} />, text: 'Reports, Plans & Support Tickets', color: '#1E88FF' },
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

            <div style={{
              display: 'flex', gap: 32, marginTop: 48,
              paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)',
            }}>
              {[
                { val: 'Staff', lbl: 'Access Management' },
                { val: 'Modules', lbl: 'Permission Control' },
                { val: 'Audit', lbl: 'Full Tracking' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', fontFamily: 'Outfit, sans-serif' }}>{s.val}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT PANEL ═══ */}
        <div className="login-right">
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
            <div style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: 26, fontWeight: 800, color: 'var(--text-heading)',
                fontFamily: 'Outfit, sans-serif', marginBottom: 8,
              }}>
                Staff Sign In
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Enter your staff credentials to access the management panel.
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
                <label className="login-label">Staff ID / Email</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Staff ID or Email"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="login-input"
                  autoComplete="off"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="login-label" style={{ marginBottom: 0 }}>Password</label>
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
                    accentColor: '#818cf8'
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
                  background: 'linear-gradient(135deg, #818cf8 0%, #1252AB 100%)',
                  color: 'white',
                  boxShadow: '0 6px 20px rgba(129,140,248,0.25)',
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

            <div style={{
              marginTop: 28, paddingTop: 24,
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                🔒 Authorized personnel only. All sessions are logged.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
