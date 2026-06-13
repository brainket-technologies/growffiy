'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider } from '../../viewmodels/AppContext';
import { Sidebar } from '../../views/components/Sidebar';
import { Header } from '../../views/components/Header';
import styles from '../../views/components/components.module.css';
import { THEME_COLORS } from '../../lib/constants';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminLogin = pathname === '/admin/login';

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
