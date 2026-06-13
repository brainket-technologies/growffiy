'use client';

import React from 'react';
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
  Zap,
} from 'lucide-react';
import styles from './components.module.css';

interface SidebarProps {
  isAdmin?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isAdmin = true }) => {
  const pathname = usePathname();

  const adminMenuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Clients', path: '/admin/clients', icon: Users },
    { name: 'Market Watch', path: '/admin/market-watch', icon: LineChart },
    { name: 'Pre-Open Scanner', path: '/admin/scanner', icon: Zap },
    { name: 'Strategies', path: '/admin/strategies', icon: TrendingUp },
    { name: 'Live Trading', path: '/admin/trades', icon: Activity },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Transactions', path: '/admin/payments', icon: CreditCard },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
    { name: 'Support', path: '/admin/support', icon: LifeBuoy },
  ];

  const userMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Subscription Plans', path: '/dashboard/subscription', icon: CreditCard },
    { name: 'Trading Report', path: '/dashboard/reports', icon: FileText },
    { name: 'Payment History', path: '/dashboard/payments', icon: Activity },
    { name: 'Support', path: '/dashboard/support', icon: LifeBuoy },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarBrand}>
        <div className={styles.logoIconContainer}>
          <TrendingUp size={18} color="white" />
        </div>
        <div className={styles.brandText}>GROWFFIY</div>
      </div>
      <nav className={styles.sidebarMenu}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`${styles.sidebarItem} ${
                isActive ? styles.sidebarItemActive : ''
              }`}
            >
              <IconComponent size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className={styles.sidebarFooter}>
        <div className={styles.userAvatar}>
          {isAdmin ? 'AD' : 'CL'}
        </div>
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
              window.location.href = isAdmin ? '/admin/login' : '/login';
            }
          }} 
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', opacity: 0.7 }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
