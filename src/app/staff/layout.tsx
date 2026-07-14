'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppProvider } from '../../shared/viewmodels/AppContext';
import { Sidebar } from '../../shared/components/sidebar/Sidebar';
import { Header } from '../../shared/components/sidebar/Header';
import { Loader } from '../../shared/components/views/Loader';
import styles from '../../shared/components/views/components.module.css';
import { THEME_COLORS } from '../../core/constants';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isStaffLogin = pathname === '/staff/login';

  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [staffName, setStaffName] = React.useState('');
  const [permissions, setPermissions] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      const storedRole = localStorage.getItem('growffiy_logged_in_user_role');
      const storedName = localStorage.getItem('growffiy_logged_in_user_name');
      const storedPerms = localStorage.getItem('growffiy_staff_permissions');

      if (isStaffLogin) {
        if (storedId && storedRole === 'staff') {
          window.location.href = '/staff';
          return;
        }
        setIsAuthenticated(true);
        return;
      }

      if (!storedId || storedRole !== 'staff') {
        window.location.href = '/staff/login';
      } else {
        setStaffName(storedName || 'Staff');
        try { setPermissions(JSON.parse(storedPerms || '[]')); } catch { setPermissions([]); }
        setIsAuthenticated(true);

        // Refresh permissions from server on page load
        const storedStaffId = localStorage.getItem('growffiy_staff_id');
        if (storedStaffId) {
          fetch(`/api/admin/staff/${storedStaffId}`)
            .then(r => r.json())
            .then(res => {
              if (res.success && res.staff?.permissions) {
                const perms = res.staff.permissions.map((p: any) => ({
                  module: p.module,
                  permission: p.permission,
                  granted: p.granted,
                }));
                localStorage.setItem('growffiy_staff_permissions', JSON.stringify(perms));
                setPermissions(perms);
              }
            })
            .catch(() => {});
        }
      }
    }
  }, [isStaffLogin]);

  if (!isAuthenticated) {
    return <Loader title="Authenticating staff session" text="Verifying staff credentials..." />;
  }

  if (isStaffLogin) {
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
        <Sidebar isAdmin={false} staffPermissions={permissions} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Header title="Staff Panel" userName={staffName} userRole="Staff" />
          <main className={styles.contentWrapper}>
            {children}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}
