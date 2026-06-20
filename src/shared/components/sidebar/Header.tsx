'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, HelpCircle, User, ChevronDown, Lock, UserCheck, LogOut, X, RefreshCw, Search } from 'lucide-react';
import styles from './Header.module.css';
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
      window.location.href = activeRole === 'admin' ? '/admin/login' : '/websites/login';
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

  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <header className={styles.header}>
        <h2 className={styles.headerTitle}>
          {title.includes('|') ? (
            <>
              {title.split('|')[0].trim()}
              <span className={styles.headerTitleAccent}> | {title.split('|')[1].trim()}</span>
            </>
          ) : (
            title
          )}
        </h2>

        <div className={styles.actions}>
          <button className={styles.iconBtn} title="Notifications">
            <Bell size={17} />
            <span className={styles.notifDot} />
          </button>

          <button className={styles.iconBtn} title="Help">
            <HelpCircle size={17} />
          </button>

          <div className={styles.divider} />

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <div
              className={styles.profileTrigger}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className={styles.profileAvatar}>
                {userInitial}
              </div>
              <div className={styles.profileInfo}>
                <p className={styles.profileName}>
                  {userName}
                  <ChevronDown size={11} className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`} />
                </p>
                <p className={styles.profileRole}>{userRole}</p>
              </div>
            </div>

            {dropdownOpen && (
              <div className={styles.dropdown}>
                <button
                  className={styles.dropdownItem}
                  onClick={() => { setDropdownOpen(false); setProfileModalOpen(true); }}
                >
                  <UserCheck size={15} /> Update Profile
                </button>
                <button
                  className={styles.dropdownItem}
                  onClick={() => { setDropdownOpen(false); setPasswordModalOpen(true); }}
                >
                  <Lock size={15} /> Change Password
                </button>
                <div className={styles.dropdownDivider} />
                <button
                  className={`${styles.dropdownItem} ${styles.dropdownDanger}`}
                  onClick={handleLogout}
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ UPDATE PROFILE MODAL ═══ */}
      {profileModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Update Profile</h3>
              <button className={styles.modalClose} onClick={() => setProfileModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className={styles.modalForm}>
              {profileError && <div className={styles.alertError}>⚠ {profileError}</div>}
              {profileSuccess && <div className={styles.alertSuccess}>✓ Profile updated successfully! Reloading...</div>}

              <div className={styles.formField}>
                <label className={styles.formLabel}>Full Name</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Email Address</label>
                <input
                  type="email"
                  required
                  className={styles.formInput}
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setProfileModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={profileLoading}>
                  {profileLoading ? <RefreshCw size={14} /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ CHANGE PASSWORD MODAL ═══ */}
      {passwordModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Change Password</h3>
              <button className={styles.modalClose} onClick={() => setPasswordModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className={styles.modalForm}>
              {passwordError && <div className={styles.alertError}>⚠ {passwordError}</div>}
              {passwordSuccess && <div className={styles.alertSuccess}>✓ Password updated successfully!</div>}

              <div className={styles.formField}>
                <label className={styles.formLabel}>Current Password</label>
                <input
                  type="password"
                  required
                  className={styles.formInput}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>New Password</label>
                <input
                  type="password"
                  required
                  className={styles.formInput}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  className={styles.formInput}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setPasswordModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={passwordLoading}>
                  {passwordLoading ? <RefreshCw size={14} /> : null}
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
