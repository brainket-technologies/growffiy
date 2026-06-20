'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  LineChart,
  Activity,
  FileText,
  CreditCard,
  Settings,
  ShieldCheck,
  LifeBuoy,
  TrendingUp,
  LogOut,
  ChevronRight,
  Search,
  Menu,
  X,
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  isAdmin?: boolean;
}

interface MenuItem {
  name: string;
  path?: string;
  icon?: React.ComponentType<{ size?: number }>;
  isGroup?: boolean;
  badge?: number;
  subItems?: { name: string; path: string; badge?: number }[];
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const adminGroups: MenuGroup[] = [
  {
    label: 'Main Menu',
    items: [
      { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Clients', path: '/admin/clients', icon: Users, badge: 12 },
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
    ],
  },
  {
    label: 'Reports',
    items: [
      { name: 'Reports', path: '/admin/reports', icon: FileText },
      { name: 'Subscription Plans', path: '/admin/plans', icon: CreditCard },
      { name: 'Transactions', path: '/admin/payments', icon: CreditCard },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Settings', path: '/admin/settings', icon: Settings },
      { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
      { name: 'Support', path: '/admin/support', icon: LifeBuoy, badge: 3 },
    ],
  },
];

const userGroups: MenuGroup[] = [
  {
    label: 'Main Menu',
    items: [
      { name: 'Dashboard', path: '/clients', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Trading',
    items: [
      {
        name: 'Market',
        isGroup: true,
        icon: LineChart,
        subItems: [
          { name: 'Pre-Open', path: '/clients/scanner' },
          { name: 'Live Market', path: '/clients/market' },
        ],
      },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Subscription Plans', path: '/clients/subscription', icon: CreditCard },
      { name: 'Payment History', path: '/clients/payments', icon: Activity },
      { name: 'Support', path: '/clients/support', icon: LifeBuoy, badge: 1 },
    ],
  },
];

interface SidebarItemProps {
  item: MenuItem;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  searchQuery: string;
}

const SidebarMenuItem: React.FC<SidebarItemProps> = ({ item, pathname, isOpen, onToggle, onNavigate, searchQuery }) => {
  const IconComponent = item.icon;

  if (item.isGroup) {
    const hasActiveSub = item.subItems?.some((sub) => pathname === sub.path);
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subItems?.some((sub) => sub.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return null;

    return (
      <div className={styles.itemWrapper}>
        <button
          onClick={onToggle}
          className={`${styles.menuItem} ${hasActiveSub ? styles.menuItemActive : ''}`}
        >
          {IconComponent && (
            <span className={styles.menuIcon}>
              <IconComponent size={18} />
            </span>
          )}
          <span className={styles.menuLabel}>{item.name}</span>
          <ChevronRight size={14} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
        </button>
        <div
          className={styles.subItems}
          style={{
            maxHeight: isOpen ? (item.subItems?.length || 0) * 40 : 0,
            opacity: isOpen ? 1 : 0,
          }}
        >
          {item.subItems?.map((sub) => {
            const isSubActive = pathname === sub.path;
            const matchesSub = searchQuery === '' ||
              sub.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSub) return null;

            return (
              <Link
                key={sub.name}
                href={sub.path}
                onClick={onNavigate}
                className={`${styles.subItem} ${isSubActive ? styles.subItemActive : ''}`}
              >
                <span className={styles.subItemDot} />
                <span style={{ flex: 1 }}>{sub.name}</span>
                {sub.badge && sub.badge > 0 ? (
                  <span className={styles.badge}>{sub.badge}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  if (!IconComponent) return null;

  const isActive = pathname === item.path;
  const matches = searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase());
  if (!matches) return null;

  return (
    <div className={styles.itemWrapper}>
      <Link
        href={item.path!}
        onClick={onNavigate}
        className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
      >
        <span className={styles.menuIcon}>
          <IconComponent size={18} />
        </span>
        <span className={styles.menuLabel}>{item.name}</span>
        {item.badge && item.badge > 0 ? (
          <span className={styles.badge}>{item.badge}</span>
        ) : null}
      </Link>
    </div>
  );
};

const SidebarGroup: React.FC<{
  group: MenuGroup;
  pathname: string;
  openGroups: Record<string, boolean>;
  onToggleGroup: (name: string) => void;
  onNavigate: () => void;
  searchQuery: string;
}> = ({ group, pathname, openGroups, onToggleGroup, onNavigate, searchQuery }) => {
  const hasVisibleItems = group.items.some((item) => {
    if (searchQuery === '') return true;
    if (item.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    if (item.subItems?.some((sub) => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))) return true;
    return false;
  });

  if (!hasVisibleItems) return null;

  return (
    <div>
      <div className={styles.groupLabel}>{group.label}</div>
      {group.items.map((item) => (
        <SidebarMenuItem
          key={item.name}
          item={item}
          pathname={pathname}
          isOpen={!!openGroups[item.name]}
          onToggle={() => onToggleGroup(item.name)}
          onNavigate={onNavigate}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ isAdmin = true }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('growffiy_theme');
      const prefersDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(prefersDark);
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = useCallback((dark: boolean) => {
    setIsDark(dark);
    const theme = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('growffiy_theme', theme);
  }, []);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('growffiy_logged_in_user_name');
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      setUserName(storedName || (isAdmin ? 'Admin' : 'Client'));
      setUserId(storedId || '');
    }
  }, [isAdmin]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const groups = isAdmin ? adminGroups : userGroups;
    const initialState: Record<string, boolean> = {};
    groups.forEach((g) => {
      g.items.forEach((item) => {
        if (item.isGroup) {
          const hasActive = item.subItems?.some((sub) => pathname === sub.path);
          initialState[item.name] = !!hasActive;
        }
      });
    });
    setOpenGroups(initialState);
  }, [pathname, isAdmin]);

  const handleToggleGroup = useCallback((name: string) => {
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const handleNavigate = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('growffiy_logged_in_user_id');
      localStorage.removeItem('growffiy_logged_in_user_role');
      localStorage.removeItem('growffiy_logged_in_user_name');
      window.location.href = isAdmin ? '/admin/login' : '/websites/login';
    }
  }, [isAdmin]);

  const groups = isAdmin ? adminGroups : userGroups;
  const userInitial = userName.charAt(0).toUpperCase();
  const userEmail = userId ? `${userId}@growffiy.com` : (isAdmin ? 'admin@growffiy.com' : 'client@growffiy.com');

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
      {isMobile && (
        <button
          className={styles.toggleBtn}
          onClick={() => setSidebarOpen((p) => !p)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}
      <aside
        className={`${styles.sidebar} ${isMobile && sidebarOpen ? styles.sidebarOpen : ''}`}
      >
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            <img src="/logo.png" alt="Growffiy" />
          </div>
          <span className={styles.brandText}>GROWFFIY</span>
        </div>

        {/* Search */}
        <div className={styles.searchWrapper} style={{ position: 'relative' }}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Menu */}
        <nav className={styles.menuContainer}>
          {groups.map((group) => (
            <SidebarGroup
              key={group.label}
              group={group}
              pathname={pathname}
              openGroups={openGroups}
              onToggleGroup={handleToggleGroup}
              onNavigate={handleNavigate}
              searchQuery={searchQuery}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          {/* Profile */}
          <div className={styles.profile}>
            <div className={styles.avatar}>{userInitial}</div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{userName}</div>
              <div className={styles.profileEmail}>{userEmail}</div>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
