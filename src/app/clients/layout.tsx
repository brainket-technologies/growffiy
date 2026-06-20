'use client';

import React from 'react';
import { AppProvider } from '../../shared/viewmodels/AppContext';
import { Sidebar } from '../../shared/components/sidebar/Sidebar';
import { Header } from '../../shared/components/views/Header';
import { Loader } from '../../shared/components/views/Loader';
import styles from '../../shared/components/views/components.module.css';

export default function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeUser, setActiveUser] = React.useState<any>({ name: 'Client User', id: '' });
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
          window.location.href = '/websites/login';
        }
      } else {
        const storedName = localStorage.getItem('growffiy_logged_in_user_name');
        const cleanName = storedName || storedId
          .split(/[_-]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setActiveUser({ name: cleanName, id: storedId });
        setIsAuthenticated(true);
      }
    }
  }, []);

  if (!isAuthenticated) {
    return <Loader title="Authenticating session" text="Securing demat connection and verifying client credentials..." />;
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
