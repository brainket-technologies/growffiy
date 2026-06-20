'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  TrendingUp,
  LayoutDashboard,
  Users,
  LineChart,
  Activity,
  FileText,
  CreditCard,
  Settings,
  ShieldCheck,
  LifeBuoy,
  LogOut,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import styles from './components.module.css';

interface SidebarProps {
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isAdmin = true }) => {
  const pathname = usePathname();
  const [isMarketOpen, setIsMarketOpen] = useState(true);

  // Auto-expand "Market" category if currently active on one of its routes
  useEffect(() => {
    if (
      pathname.includes('/scanner') ||
      pathname.includes('/market') ||
      pathname.includes('/market-watch')
    ) {
      setIsMarketOpen(true);
    }
  }, [pathname]);

  const adminMenuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Clients', path: '/admin/clients', icon: Users },
    {
      name: 'Market',
      isGroup: true,
      icon: LineChart,
      subItems: [
        { name: 'Pre-Open', path: '/admin/scanner' },
        { name: 'Live Market', path: '/admin/market-watch' },
      ],
    },
    { name: 'Strategies', path: '/admin/strategies', icon: TrendingUp },
    { name: 'Live Trading', path: '/admin/trades', icon: Activity },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Subscription Plans', path: '/admin/plans', icon: CreditCard },
    { name: 'Transactions', path: '/admin/payments', icon: CreditCard },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
    { name: 'Support', path: '/admin/support', icon: LifeBuoy },
  ];

  const userMenuItems = [
    { name: 'Dashboard', path: '/clients', icon: LayoutDashboard },
    {
      name: 'Market',
      isGroup: true,
      icon: LineChart,
      subItems: [
        { name: 'Pre-Open', path: '/clients/scanner' },
        { name: 'Live Market', path: '/clients/market' },
      ],
    },
    { name: 'Subscription Plans', path: '/clients/subscription', icon: CreditCard },
    { name: 'Payment History', path: '/clients/payments', icon: Activity },
    { name: 'Support', path: '/clients/support', icon: LifeBuoy },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarBrand}>
        <div className={styles.logoIconContainer}>
          <img src="/logo.png" alt="Growffiy" style={{ width: 22, height: 22, objectFit: 'contain' }} />
        </div>
        <div className={styles.brandText}>GROWFFIY</div>
      </div>
      <nav className={styles.sidebarMenu}>
        {menuItems.map((item) => {
          if (item.isGroup) {
            const IconComponent = item.icon;
            const hasActiveSub = item.subItems?.some((sub) => pathname === sub.path);
            return (
              <div key={item.name} style={{ display: 'flex', flexDirection: 'column' }}>
                <button
                  onClick={() => setIsMarketOpen(!isMarketOpen)}
                  className={`${styles.sidebarItem} ${hasActiveSub ? styles.sidebarItemActive : ''}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <IconComponent size={18} />
                    <span>{item.name}</span>
                  </div>
                  {isMarketOpen ? (
                    <ChevronDown size={14} style={{ opacity: 0.7 }} />
                  ) : (
                    <ChevronRight size={14} style={{ opacity: 0.7 }} />
                  )}
                </button>
                {isMarketOpen && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      paddingLeft: '32px',
                      marginTop: '4px',
                      marginBottom: '8px',
                      borderLeft: '1.5px solid rgba(255, 255, 255, 0.08)',
                      marginLeft: '22px',
                    }}
                  >
                    {item.subItems?.map((sub) => {
                      const isSubActive = pathname === sub.path;
                      return (
                        <Link
                          key={sub.name}
                          href={sub.path}
                          style={{
                            padding: '8px 12px',
                            color: isSubActive ? '#38bdf8' : '#94a3b8',
                            fontSize: '13px',
                            fontWeight: isSubActive ? 600 : 500,
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            backgroundColor: isSubActive ? 'rgba(14, 165, 233, 0.08)' : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSubActive) {
                              e.currentTarget.style.color = '#f1f5f9';
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSubActive) {
                              e.currentTarget.style.color = '#94a3b8';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const IconComponent = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`${styles.sidebarItem} ${isActive ? styles.sidebarItemActive : ''}`}
            >
              <IconComponent size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className={styles.sidebarFooter}>
        <div className={styles.userAvatar}>{isAdmin ? 'AD' : 'CL'}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: '13px' }}>
            {isAdmin ? 'Admin Portal' : 'Client Profile'}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--sidebar-text)' }}>
            {isAdmin ? 'Super Admin' : 'Client Account'}
          </p>
        </div>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('growffiy_logged_in_user_id');
              localStorage.removeItem('growffiy_logged_in_user_role');
              localStorage.removeItem('growffiy_logged_in_user_name');
              window.location.href = isAdmin ? '/admin/login' : '/websites/login';
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.7,
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
