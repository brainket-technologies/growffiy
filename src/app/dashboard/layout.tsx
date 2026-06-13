'use client';

import React from 'react';
import { AppProvider } from '../../viewmodels/AppContext';
import { Sidebar } from '../../views/components/Sidebar';
import { Header } from '../../views/components/Header';
import styles from '../../views/components/components.module.css';

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeUser, setActiveUser] = React.useState({ name: 'Aman Sharma', id: 'aman_sharma' });
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      const storedRole = localStorage.getItem('growffiy_logged_in_user_role');
      if (!storedId || storedRole !== 'client') {
        if (storedRole === 'admin') {
          window.location.href = '/admin';
        } else {
          localStorage.removeItem('growffiy_logged_in_user_id');
          localStorage.removeItem('growffiy_logged_in_user_role');
          window.location.href = '/login';
        }
      } else {
        // Humanize the userId for display name
        const cleanName = storedId
          .split(/[_-]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setActiveUser({ name: cleanName, id: storedId });
        setIsAuthenticated(true);
      }
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontFamily: 'sans-serif' }}>
        Authenticating session...
      </div>
    );
  }

  return (
    <AppProvider>
      <div className={styles.layoutWrapper}>
        <Sidebar isAdmin={false} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header title="Growffiy Client Portal" userName={activeUser.name} userRole="Client Account" />
          <main className={styles.contentWrapper}>
            {children}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
