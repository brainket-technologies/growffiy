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

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      if (storedId) {
        // Humanize the userId for display name
        const cleanName = storedId
          .split(/[_-]/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setActiveUser({ name: cleanName, id: storedId });
      }
    }
  }, []);

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
