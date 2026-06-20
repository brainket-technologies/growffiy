'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, HelpCircle, User, ChevronDown, Lock, UserCheck, LogOut, X, RefreshCw } from 'lucide-react';
import styles from './components.module.css';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../../core/constants';

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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Profile Form State
  const [profileName, setProfileName] = useState(userName);
  const [profileEmail, setProfileEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Fetch current user details dynamically on profile modal open
  useEffect(() => {
    if (profileModalOpen && typeof window !== 'undefined') {
      const activeUser = localStorage.getItem('growffiy_logged_in_user_id');
      if (activeUser) {
        api.get(`${API_ENDPOINTS.AUTH_PROFILE}?userId=${activeUser}`)
          .then(res => {
            if (res.success && res.user) {
              setProfileName(res.user.name);
              setProfileEmail(res.user.email);
              // Also update localStorage so that display names are refreshed locally
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

  // Click outside to close dropdown
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
      if (activeRole === 'admin') {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/websites/login';
      }
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
        userId: activeUserId,
        name: profileName,
        email: profileEmail
      });

      if (res.success) {
        setProfileSuccess(true);
        if (typeof window !== 'undefined') {
          // If updated email, set it as user id if necessary, or just refresh
          localStorage.setItem('growffiy_logged_in_user_id', profileEmail || activeUserId);
          setTimeout(() => {
            setProfileModalOpen(false);
            window.location.reload();
          }, 1000);
        }
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
        userId: activeUserId,
        currentPassword,
        newPassword
      });

      if (res.success) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setPasswordModalOpen(false);
        }, 1500);
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Incorrect current password or update failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <header className={styles.header}>
        <h2 className={styles.headerTitle}>{title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Bell size={20} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                backgroundColor: 'var(--color-danger)',
                borderRadius: '50%',
              }}
            />
          </button>

          <button
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <HelpCircle size={20} />
          </button>

          {/* User Profile Area with Dropdown */}
          <div 
            style={{ position: 'relative' }} 
            ref={dropdownRef}
          >
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderLeft: '1px solid var(--border-color)',
                paddingLeft: '24px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)',
                }}
              >
                <User size={16} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {userName}
                  <ChevronDown size={12} style={{ opacity: 0.7, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {userRole}
                </p>
              </div>
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: '200px',
                background: 'white',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                padding: '6px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setProfileModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-body)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <UserCheck size={14} /> Update Profile
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setPasswordModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-body)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Lock size={14} /> Change Password
                </button>

                <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 12px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ UPDATE PROFILE MODAL ═══ */}
      {profileModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            width: '100%',
            maxWidth: '440px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>Update Profile</h3>
              <button 
                onClick={() => setProfileModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateProfile} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {profileError && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 500 }}>
                  ⚠️ {profileError}
                </div>
              )}
              {profileSuccess && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #d1fae5', color: '#065f46', fontSize: '12px', fontWeight: 600 }}>
                  ✓ Profile updated successfully! Reloading...
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-body)', marginBottom: '6px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '14px',
                    color: 'var(--text-heading)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-body)', marginBottom: '6px' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '14px',
                    color: 'var(--text-heading)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'white',
                    color: 'var(--text-body)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: profileLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {profileLoading ? <RefreshCw size={14} className="spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ CHANGE PASSWORD MODAL ═══ */}
      {passwordModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            width: '100%',
            maxWidth: '440px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>Change Password</h3>
              <button 
                onClick={() => setPasswordModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleChangePassword} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {passwordError && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 500 }}>
                  ⚠️ {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#ecfdf5', border: '1px solid #d1fae5', color: '#065f46', fontSize: '12px', fontWeight: 600 }}>
                  ✓ Password updated successfully!
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-body)', marginBottom: '6px' }}>Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '14px',
                    color: 'var(--text-heading)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-body)', marginBottom: '6px' }}>New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '14px',
                    color: 'var(--text-heading)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-body)', marginBottom: '6px' }}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '14px',
                    color: 'var(--text-heading)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'white',
                    color: 'var(--text-body)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: passwordLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {passwordLoading ? <RefreshCw size={14} className="spin" /> : null}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
