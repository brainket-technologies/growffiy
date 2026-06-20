'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider } from '../../shared/viewmodels/AppContext';
import { Sidebar } from '../../shared/components/sidebar/Sidebar';
import { Header } from '../../shared/components/views/Header';
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
      } else if (activeUserRole !== 'admin') {
        window.location.href = '/clients';
      } else {
        setIsAdminAuthenticated(true);
      }
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header title="Growffiy Admin Panel" />
          <main className={styles.contentWrapper}>
            {children}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
