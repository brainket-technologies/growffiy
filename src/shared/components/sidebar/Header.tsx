'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown, Lock, UserCheck, LogOut, X, RefreshCw, Sun, Moon, Menu } from 'lucide-react';
import styles from './Header.module.css';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../../core/constants';
import { useAppViewModel } from '../../viewmodels/AppContext';

interface HeaderProps {
  title: string;
  userName?: string;
  userRole?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  userName = 'Firoz Mohammad',
  userRole = 'Administrator',
}) => {
  const { isTradingActive } = useAppViewModel();
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(true);
  const [tradingDays, setTradingDays] = useState<string[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [specialDays, setSpecialDays] = useState<string[]>([]);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(API_ENDPOINTS.SETTINGS).then((res: any) => {
      if (res.success && res.settings) {
        setAutoTradeEnabled(res.settings.auto_trade_enabled !== 'false');
        try { setTradingDays(JSON.parse(res.settings.trading_days || '[]')); } catch { }
        try { setHolidays(JSON.parse(res.settings.market_holidays || '[]')); } catch { }
        try { setSpecialDays(JSON.parse(res.settings.special_market_days || '[]')); } catch { }
      }
    }).catch(() => { });
  }, []);

  const getTradingDayLabel = () => {
    if (!autoTradeEnabled) return 'Auto OFF';
    const todayStr = new Date().toLocaleDateString('en-CA');
    const weekday = new Date().toLocaleDateString('en-US', { weekday: 'short' });

    if (holidays.includes(todayStr)) return 'Holiday';
    if (specialDays.includes(todayStr) || tradingDays.includes(weekday)) return 'Trading Day';
    return 'Off-Day';
  };

  const tradingDayLabel = getTradingDayLabel();

  const [profileName, setProfileName] = useState(userName);
  const [profileEmail, setProfileEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('growffiy_theme');
      const prefersDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(prefersDark);
    }
  }, []);

  const toggleTheme = (dark: boolean) => {
    setIsDark(dark);
    const theme = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('growffiy_theme', theme);
  };

  useEffect(() => {
    if (profileModalOpen && typeof window !== 'undefined') {
      const activeUser = localStorage.getItem('growffiy_logged_in_user_id');
      if (activeUser) {
        api.get(`${API_ENDPOINTS.AUTH_PROFILE}?userId=${activeUser}`)
          .then(res => {
            if (res.success && res.user) {
              setProfileName(res.user.name);
              setProfileEmail(res.user.email);
              localStorage.setItem('growffiy_logged_in_user_name', res.user.name);
            } else {
              setProfileName(userName);
              setProfileEmail(activeUser.includes('@') ? activeUser : `${activeUser}@growffiy.com`);
            }
          })
          .catch(() => {
            setProfileName(userName);
            setProfileEmail(activeUser.includes('@') ? activeUser : `${activeUser}@growffiy.com`);
          });
      }
    }
  }, [profileModalOpen, userName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      const activeRole = localStorage.getItem('growffiy_logged_in_user_role');
      localStorage.removeItem('growffiy_logged_in_user_id');
      localStorage.removeItem('growffiy_logged_in_user_role');
      window.location.href = activeRole === 'admin' ? '/admin/login' : '/vendor/login';
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      const activeUserId = localStorage.getItem('growffiy_logged_in_user_id') || 'admin';
      const res = await api.post(API_ENDPOINTS.AUTH_PROFILE, {
        userId: activeUserId, name: profileName, email: profileEmail
      });
      if (res.success) {
        setProfileSuccess(true);
        localStorage.setItem('growffiy_logged_in_user_id', profileEmail || activeUserId);
        setTimeout(() => { setProfileModalOpen(false); window.location.reload(); }, 1000);
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }
    try {
      const activeUserId = localStorage.getItem('growffiy_logged_in_user_id') || 'admin';
      const res = await api.post(API_ENDPOINTS.AUTH_PROFILE, {
        userId: activeUserId, currentPassword, newPassword
      });
      if (res.success) {
        setPasswordSuccess(true);
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        setTimeout(() => setPasswordModalOpen(false), 1500);
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Incorrect current password or update failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  const userInitial = userName.charAt(0).toUpperCase();

  const renderBreadcrumb = () => {
    if (!title.includes('|')) return <span className={styles.currentPage}>{title}</span>;
    const parts = title.split('|').map(s => s.trim());
    return (
      <>
        <span className={styles.breadcrumb}>
          {parts[0]}
          <span className={styles.breadcrumbSep}>/</span>
        </span>
        <span className={styles.currentPage}>{parts[1]}</span>
      </>
    );
  };

  return (
    <>
      <header className={styles.header}>
        <div className={styles.leftSection}>
          <button className={styles.hamburger} onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))} aria-label="Toggle sidebar">
            <Menu size={20} />
          </button>
          {renderBreadcrumb()}
        </div>

        <div className={styles.actions}>
          {/* Status Indicator */}
          {userRole !== 'Client Account' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-color)',
              fontSize: '11px',
              fontWeight: 600,
              marginRight: '8px'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isTradingActive ? 'var(--accent)' : 'var(--danger)',
                boxShadow: isTradingActive ? '0 0 6px var(--accent)' : 'none',
                display: 'inline-block'
              }} title={isTradingActive ? 'Engine is Running' : 'Engine is Stopped'} />
              <span style={{ color: isTradingActive ? 'var(--accent)' : 'var(--danger)', marginLeft: '2px' }}>
                {isTradingActive ? 'Online' : 'Offline'}
              </span>
              <span style={{ width: '1px', height: '10px', background: 'var(--border-color)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>
                {tradingDayLabel === 'Trading Day' ? 'Market Day' : 'Market Off'}
              </span>
            </div>
          )}

          <div className={styles.themeToggle}>
            <button
              className={`${styles.themeBtn} ${isDark ? styles.themeBtnActive : ''}`}
              onClick={() => toggleTheme(true)}
              title="Dark mode"
            >
              <Moon size={13} />
            </button>
            <button
              className={`${styles.themeBtn} ${!isDark ? styles.themeBtnActive : ''}`}
              onClick={() => toggleTheme(false)}
              title="Light mode"
            >
              <Sun size={13} />
            </button>
          </div>

          <div className={styles.divider} />

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div
              className={styles.profileTrigger}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className={styles.profileAvatar}>{userInitial}</div>
              <div>
                <p className={styles.profileName}>
                  {userName}
                  <ChevronDown size={10} className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`} />
                </p>
                <p className={styles.profileRole}>{userRole}</p>
              </div>
            </div>

            {dropdownOpen && (
              <div className={styles.dropdown}>
                <button className={styles.dropdownItem} onClick={() => { setDropdownOpen(false); setProfileModalOpen(true); }}>
                  <UserCheck size={14} /> Update Profile
                </button>
                <button className={styles.dropdownItem} onClick={() => { setDropdownOpen(false); setPasswordModalOpen(true); }}>
                  <Lock size={14} /> Change Password
                </button>
                <div className={styles.dropdownDivider} />
                <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={handleLogout}>
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {profileModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Update Profile</h3>
              <button className={styles.modalClose} onClick={() => setProfileModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleUpdateProfile} className={styles.modalForm}>
              {profileError && <div className={styles.alertError}>⚠ {profileError}</div>}
              {profileSuccess && <div className={styles.alertSuccess}>✓ Profile updated! Reloading...</div>}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Full Name</label>
                <input type="text" required className={styles.formInput} value={profileName} onChange={(e) => setProfileName(e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Email Address</label>
                <input type="email" required className={styles.formInput} value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setProfileModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={profileLoading}>
                  {profileLoading ? <RefreshCw size={13} /> : null} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Change Password</h3>
              <button className={styles.modalClose} onClick={() => setPasswordModalOpen(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleChangePassword} className={styles.modalForm}>
              {passwordError && <div className={styles.alertError}>⚠ {passwordError}</div>}
              {passwordSuccess && <div className={styles.alertSuccess}>✓ Password updated!</div>}
              <div className={styles.formField}>
                <label className={styles.formLabel}>Current Password</label>
                <input type="password" required className={styles.formInput} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>New Password</label>
                <input type="password" required className={styles.formInput} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Confirm New Password</label>
                <input type="password" required className={styles.formInput} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <div className={styles.formActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setPasswordModalOpen(false)}>Cancel</button>
                <button type="submit" className={styles.btnPrimary} disabled={passwordLoading}>
                  {passwordLoading ? <RefreshCw size={13} /> : null} Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
