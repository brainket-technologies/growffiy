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
  PanelLeftClose,
  PanelLeft,
  BarChart3,
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAppViewModel } from '../../viewmodels/AppContext';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../../core/constants';

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
      { name: 'Subscription Plans', path: '/admin/plans', icon: CreditCard },
    ],
  },
  {
    label: 'Trade',
    items: [
      { name: 'Live Market', path: '/admin/market-watch', icon: LineChart },
      { name: 'Pre-Open', path: '/admin/scanner', icon: Search },
      { name: 'Strategies', path: '/admin/strategies', icon: TrendingUp },
    ],
  },
  {
    label: 'Reports',
    items: [
      { name: 'Strategy Report', path: '/admin/reports/strategy', icon: FileText },
      { name: 'Client Report', path: '/admin/reports/client', icon: FileText },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { name: 'Plan Txns', path: '/admin/payments/subscriptions', icon: CreditCard },
      { name: 'Trade Txns', path: '/admin/payments/trades', icon: Activity },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'App Settings', path: '/admin/settings', icon: Settings },
      { name: 'App Logs', path: '/admin/audit-logs', icon: ShieldCheck },
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
      { name: 'Live Trade', path: '/clients/trades', icon: TrendingUp },
      { name: 'Report', path: '/clients/reports', icon: BarChart3 },
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

const isPathActive = (itemPath: string | undefined, currentPath: string) => {
  if (!itemPath) return false;
  return currentPath === itemPath || (
    itemPath !== '/' &&
    itemPath !== '/admin' &&
    itemPath !== '/clients' &&
    currentPath.startsWith(`${itemPath}/`)
  );
};

const SidebarMenuItem: React.FC<SidebarItemProps> = ({ item, pathname, isOpen, onToggle, onNavigate, searchQuery }) => {
  const IconComponent = item.icon;

  if (item.isGroup) {
    const hasActiveSub = item.subItems?.some((sub) => isPathActive(sub.path, pathname));
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
            const isSubActive = isPathActive(sub.path, pathname);
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

  const isActive = isPathActive(item.path, pathname);
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
  const { clients = [], activeUser } = useAppViewModel();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [isDark, setIsDark] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [strategiesCount, setStrategiesCount] = useState(0);
  const [brandLogo, setBrandLogo] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandTitle, setBrandTitle] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedLogo = localStorage.getItem('growffiy_brand_logo');
    const storedName = localStorage.getItem('growffiy_brand_name');
    const storedTitle = localStorage.getItem('growffiy_brand_title');
    if (storedLogo) setBrandLogo(storedLogo);
    if (storedName) setBrandName(storedName);
    if (storedTitle) { setBrandTitle(storedTitle); document.title = storedTitle; }

    const fetchBranding = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.SETTINGS);
        if (res.success && res.settings) {
          const logo = res.settings.app_logo || '';
          const name = res.settings.app_name || 'Growffiy';
          const title = res.settings.app_title || 'Growffiy — Algo Trading Terminal';
          const desc = res.settings.meta_description || '';
          const keywords = res.settings.meta_keywords || '';
          const gaId = res.settings.google_analytics_id || '';
          const footerText = res.settings.footer_text || '';
          setBrandLogo(logo); setBrandName(name); setBrandTitle(title);
          document.title = title;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) metaDesc.setAttribute('content', desc);
          const metaKw = document.querySelector('meta[name="keywords"]');
          if (metaKw) metaKw.setAttribute('content', keywords);
          localStorage.setItem('growffiy_brand_logo', logo);
          localStorage.setItem('growffiy_brand_name', name);
          localStorage.setItem('growffiy_brand_title', title);
          localStorage.setItem('growffiy_meta_description', desc);
          localStorage.setItem('growffiy_meta_keywords', keywords);
          localStorage.setItem('growffiy_footer_text', footerText);
          injectGA(gaId);
        }
      } catch { }
    };

    const injectGA = (gaId: string) => {
      if (!gaId || document.getElementById('growffiy-ga')) return;
      const script = document.createElement('script');
      script.id = 'growffiy-ga';
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);
      const inline = document.createElement('script');
      inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
      document.head.appendChild(inline);
    };
    fetchBranding();

    const handleBrandingUpdate = () => fetchBranding();
    window.addEventListener('branding-updated', handleBrandingUpdate);
    return () => window.removeEventListener('branding-updated', handleBrandingUpdate);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('growffiy_theme');
      const prefersDark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(prefersDark);
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      const savedCollapse = localStorage.getItem('growffiy_sidebar_collapsed');
      const isCollapsed = savedCollapse === 'true';
      setCollapsed(isCollapsed);
      document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '64px' : '260px');
    }
  }, []);

  const toggleTheme = useCallback((dark: boolean) => {
    setIsDark(dark);
    const theme = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('growffiy_theme', theme);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('growffiy_logged_in_user_name');
      const storedId = localStorage.getItem('growffiy_logged_in_user_id');
      setUserName(storedName || (isAdmin ? 'Admin' : 'Client'));
      setUserId(storedId || '');
    }
  }, [isAdmin]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const url = isAdmin
          ? '/api/support/tickets?all=true'
          : `/api/support/tickets?userId=${userId}`;
        if (isAdmin || userId) {
          const res = await fetch(url);
          const data = await res.json();
          if (data.success && data.tickets) {
            const count = data.tickets.filter((t: any) => t.status === 'open').length;
            setOpenTicketsCount(count);
          }
        }

        if (isAdmin) {
          const stratRes = await fetch('/api/admin/strategies');
          const stratData = await stratRes.json();
          if (stratData.success && stratData.strategies) {
            setStrategiesCount(stratData.strategies.length);
          }
        }
      } catch (err) {
        console.error('Failed to fetch counts in sidebar:', err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 15000);
    return () => clearInterval(interval);
  }, [isAdmin, userId]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const rawGroups = isAdmin ? adminGroups : userGroups;
    const initialState: Record<string, boolean> = {};
    rawGroups.forEach((g) => {
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
    if (collapsed) return;
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('growffiy_sidebar_collapsed', String(next));
        document.documentElement.style.setProperty('--sidebar-width', next ? '64px' : '260px');
      }
      return next;
    });
  }, []);

  const handleNavigate = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('growffiy_logged_in_user_id');
      localStorage.removeItem('growffiy_logged_in_user_role');
      localStorage.removeItem('growffiy_logged_in_user_name');
      window.location.href = isAdmin ? '/admin/login' : '/vendor/login';
    }
  }, [isAdmin]);

  const groups = React.useMemo(() => {
    const rawGroups = isAdmin ? adminGroups : userGroups;

    // For client users, filter based on product type
    // Check product type FIRST before showing any UI - don't show then hide
    let filteredGroups = rawGroups;
    if (!isAdmin && activeUser?.client?.productType) {
      const productTypeName = activeUser.client.productType.name.toLowerCase();
      const isAlgoProduct = productTypeName.includes('algo');

      if (!isAlgoProduct) {
        // Remove Trading group items (Live Trade, Report) for non-algo products
        filteredGroups = rawGroups.map((group) => ({
          ...group,
          items: group.label === 'Trading'
            ? []
            : group.items.filter((item) => {
              if (item.name === 'Live Trade') return false;
              if (item.name === 'Report') return false;
              return true;
            })
        })).filter((group) => group.items.length > 0);
      }
    } else if (!isAdmin && !activeUser?.client?.productType) {
      // If product type is not loaded yet, show minimal UI to avoid flash
      // Only show Dashboard and Subscription Plans until product type is confirmed
      filteredGroups = rawGroups.map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          // Only show safe items that don't depend on product type
          if (item.name === 'Dashboard') return true;
          if (item.name === 'Subscription Plans') return true;
          if (item.name === 'Payment History') return true;
          if (item.name === 'Support') return true;
          return false;
        })
      })).filter((group) => group.items.length > 0);
    }

    return filteredGroups.map((group) => ({
      ...group,
      items: group.items.map((item) => {
        if (item.name === 'Clients') {
          return { ...item, badge: clients.length };
        }
        if (item.name === 'Strategies') {
          return { ...item, badge: strategiesCount };
        }
        if (item.name === 'Support') {
          return { ...item, badge: openTicketsCount };
        }
        return item;
      }),
    }));
  }, [isAdmin, clients.length, strategiesCount, openTicketsCount, activeUser]);

  const userEmail = typeof window !== 'undefined' ? (localStorage.getItem('growffiy_logged_in_user_email') || activeUser?.email || '') : (activeUser?.email || '');
  const userInitial = userName.charAt(0).toUpperCase();

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
        className={`${styles.sidebar} ${isMobile && sidebarOpen ? styles.sidebarOpen : ''} ${collapsed ? styles.collapsed : ''}`}
      >
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandLogo}>
            {brandLogo ? <img src={brandLogo} alt={brandName} /> : <img src="/logo.png" alt={brandName} style={{ filter: 'brightness(0) invert(1)' }} />}
          </div>
          <span className={styles.brandText}>{brandName.toUpperCase()}</span>
          {!isMobile && (
            <button
              onClick={toggleCollapsed}
              className={styles.collapseBtn}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            </button>
          )}
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
