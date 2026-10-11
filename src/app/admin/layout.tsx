'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider } from '../../shared/viewmodels/AppContext';
import { Sidebar } from '../../shared/components/sidebar/Sidebar';
import { Header } from '../../shared/components/sidebar/Header';
import { Loader } from '../../shared/components/views/Loader';
import styles from '../../shared/components/views/components.module.css';
import { THEME_COLORS } from '../../core/constants';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminLogin = pathname === '/admin/login';

  const [isAdminAuthenticated, setIsAdminAuthenticated] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const activeUser = localStorage.getItem('growffiy_logged_in_user_id');
      const activeUserRole = localStorage.getItem('growffiy_logged_in_user_role');
      if (isAdminLogin) {
        if (activeUser) {
          if (activeUserRole === 'admin') {
            window.location.href = '/admin';
            return;
          } else if (activeUserRole === 'client') {
            window.location.href = '/clients';
            return;
          }
        }
        setIsAdminAuthenticated(true);
        return;
      }
      if (!activeUser) {
        window.location.href = '/admin/login';
        return;
      } else if (activeUserRole !== 'admin') {
        window.location.href = '/clients';
        return;
      }

      const authToken = localStorage.getItem('growffiy_auth_token');
      if (!authToken) {
        localStorage.removeItem('growffiy_logged_in_user_id');
        localStorage.removeItem('growffiy_logged_in_user_role');
        window.location.href = '/admin/login?reason=session_expired';
        return;
      }

      fetch('/api/auth/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser, role: 'admin', token: authToken })
      })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.valid) {
            setIsAdminAuthenticated(true);
          } else {
            localStorage.removeItem('growffiy_logged_in_user_id');
            localStorage.removeItem('growffiy_logged_in_user_role');
            localStorage.removeItem('growffiy_auth_token');
            localStorage.removeItem('growffiy_logged_in_user_name');
            localStorage.removeItem('growffiy_logged_in_user_email');
            window.location.href = '/admin/login?reason=session_expired';
          }
        })
        .catch(() => {
          setIsAdminAuthenticated(true);
        });
    }
  }, [isAdminLogin]);

  if (!isAdminAuthenticated) {
    return <Loader title="Authenticating admin session" text="Securing admin panel settings and verifying credentials..." />;
  }

  if (isAdminLogin) {
    return (
      <AppProvider>
        <div style={{ minHeight: '100vh', width: '100vw', background: THEME_COLORS.BG_PRIMARY }}>
          {children}
        </div>
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <div className={styles.layoutWrapper}>
        <Sidebar isAdmin={true} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header title="Growffiy Admin Panel" />
          <main className={styles.contentWrapper}>
            {children}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
