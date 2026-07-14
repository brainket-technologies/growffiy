export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_CLIENTS: '/admin/clients',
  ADMIN_MARKET: '/admin/market-watch',
  ADMIN_SCANNER: '/admin/scanner',
  ADMIN_STRATEGIES: '/admin/strategies',
  ADMIN_TRADES: '/admin/trades',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_AUDIT: '/admin/audit-logs',
  USER_DASHBOARD: '/clients',
  USER_SUBSCRIPTION: '/clients/subscription',
  USER_PAYMENTS: '/clients/payments',
  USER_REPORTS: '/clients/reports',
  USER_SUPPORT: '/clients/support',
};

export const API_ENDPOINTS = {
  CLIENTS: '/api/clients',
  TRADES: '/api/trades',
  STOCKS: '/api/stocks',
  DASHBOARD: '/api/admin/dashboard',
  AUDIT_LOGS: '/api/admin/audit-logs',
  TOGGLE_TRADING: '/api/trading/toggle',
  SETTINGS: '/api/admin/settings',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_PROFILE: '/api/auth/profile',
  SUPPORT_TICKETS: '/api/support/tickets',
  SETTINGS_PUBLIC: '/api/settings/public',
  PLANS: '/api/plans',
  PAYMENTS_ORDER: '/api/payments/order',
  PAYMENTS_VERIFY: '/api/payments/verify',
  PAYMENTS_HISTORY: '/api/payments/history',
  CALLBACK_ZERODHA: '/api/callback/zerodha',
  NSE_PRE_OPEN: 'https://www.nseindia.com/api/market-data-pre-open?key=ALL',
  NSE_HOME: 'https://www.nseindia.com/',
  NSE_REFERER: 'https://www.nseindia.com/market-data/pre-open-market-key-indices-all',
  KITE_INSTRUMENTS: 'https://api.kite.trade/instruments/NSE',
  KITE_BASE: 'https://api.kite.trade',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  STAFF: 'staff',
};

export const STAFF_MODULES = [
  'clients',
  'preopen',
  'plans',
  'marketWatch',
  'strategies',
  'reports',
  'trades',
  'staff',
  'support',
] as const;

export type StaffModule = typeof STAFF_MODULES[number];

export interface StaffPermissionDef {
  key: string;   // e.g. 'view', 'edit', 'create', 'export'
  label: string; // display name
}

export interface StaffModuleDef {
  key: StaffModule;
  label: string;
  icon: string;
  permissions: StaffPermissionDef[];
}

export const STAFF_MODULE_DEFS: StaffModuleDef[] = [
  {
    key: 'clients',
    label: 'Clients',
    icon: 'Users',
    permissions: [
      { key: 'view',       label: 'View' },
      { key: 'viewDetail', label: 'View Detail' },
      { key: 'create',     label: 'Create' },
      { key: 'edit',       label: 'Edit' },
      { key: 'delete',     label: 'Delete' },
      { key: 'export',     label: 'Export' },
      { key: 'kiteLogin',  label: 'Kite Login' },
    ],
  },
  {
    key: 'preopen',
    label: 'Pre-Open',
    icon: 'Search',
    permissions: [
      { key: 'view',        label: 'View' },
      { key: 'dateFilter',  label: 'Date Filter' },
      { key: 'export',      label: 'Export' },
    ],
  },
  {
    key: 'plans',
    label: 'Subscription Plans',
    icon: 'CreditCard',
    permissions: [
      { key: 'view',   label: 'View' },
      { key: 'create', label: 'Create' },
      { key: 'edit',   label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'marketWatch',
    label: 'Live Market',
    icon: 'LineChart',
    permissions: [
      { key: 'liveView',       label: 'Live View' },
      { key: 'historicalView', label: 'Historical View' },
      { key: 'export',         label: 'Export' },
    ],
  },
  {
    key: 'strategies',
    label: 'Strategies',
    icon: 'TrendingUp',
    permissions: [
      { key: 'view',   label: 'View' },
      { key: 'add',    label: 'Add' },
      { key: 'edit',   label: 'Edit' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: 'FileText',
    permissions: [
      { key: 'strategyView',   label: 'Strategy Report — View' },
      { key: 'strategyExport', label: 'Strategy Report — Export' },
      { key: 'clientView',     label: 'Client Report — View' },
      { key: 'clientExport',   label: 'Client Report — Export' },
    ],
  },
  {
    key: 'trades',
    label: 'Trade & Plan Transactions',
    icon: 'Activity',
    permissions: [
      { key: 'tradeView', label: 'Trades — View (your clients only)' },
      { key: 'planView',  label: 'Plan Transactions — View' },
    ],
  },
  {
    key: 'staff',
    label: 'Staff',
    icon: 'UserCog',
    permissions: [
      { key: 'view',   label: 'View' },
      { key: 'add',    label: 'Add' },
      { key: 'edit',   label: 'Edit / Update' },
      { key: 'delete', label: 'Delete' },
    ],
  },
  {
    key: 'support',
    label: 'Support',
    icon: 'LifeBuoy',
    permissions: [
      { key: 'view',   label: 'View (your clients only)' },
      { key: 'update', label: 'Update' },
      { key: 'send',   label: 'Send (your clients only)' },
    ],
  },
];

// A permission record: module + specific permission key + granted boolean
export type StaffModulePermission = {
  module: StaffModule;
  permission: string; // matches StaffPermissionDef.key
  granted: boolean;
};

export const getDefaultPermissions = (): StaffModulePermission[] => {
  const result: StaffModulePermission[] = [];
  for (const def of STAFF_MODULE_DEFS) {
    for (const perm of def.permissions) {
      result.push({ module: def.key, permission: perm.key, granted: false });
    }
  }
  return result;
};

export const TRADING_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  PENDING: 'pending',
};

export const SETTINGS_KEYS = {
  ZERODHA_API_KEY: 'zerodha_api_key',
  ZERODHA_API_SECRET: 'zerodha_api_secret',
  ZERODHA_REDIRECT_URL: 'zerodha_redirect_url',
  ZERODHA_ACCESS_TOKEN: 'zerodha_access_token',
  ZERODHA_STATUS: 'zerodha_status',
  
  RAZORPAY_KEY_ID: 'razorpay_key_id',
  RAZORPAY_KEY_SECRET: 'razorpay_key_secret',
  RAZORPAY_WEBHOOK_SECRET: 'razorpay_webhook_secret',
  RAZORPAY_MODE: 'razorpay_mode', // test, live
  RAZORPAY_STATUS: 'razorpay_status',

  ALGO_PREOPEN_FETCH_TIME: 'algo_preopen_fetch_time',
  ALGO_ENTRY_TIME: 'algo_entry_time',
  ALGO_TOKEN_REFRESH_TIME: 'algo_token_refresh_time',
  ALGO_CHECK_INTERVAL_SEC: 'algo_check_interval_sec',
};

// Scheduler Intervals (in milliseconds)
export const SCHEDULER_INTERVALS = {
  STRATEGY_CHECK: 10 * 1000,    // 10s — pre-select & entry time check (fast trigger for price-sensitive entry)
  TOKEN_REFRESH: 60 * 1000,     // 60s — Kite auto-login refresh
  TRADE_MONITOR: 10 * 1000,     // 10s — open trades monitoring loop
};

export const ORDER_TYPES = {
  MIS: 'MIS',
  CNC: 'CNC',
};

export const TRADE_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
};

// Global Theme Colors for inline SVG and visual style styling
export const THEME_COLORS = {
  PRIMARY: '#1252AB', // Primary Blue
  SUCCESS: '#10b981', // Emerald green
  DANGER: '#ef4444',  // Red
  WARNING: '#f59e0b', // Amber warning
  INFO: '#1E88FF',    // Light Blue Accent
  BG_PRIMARY: '#f5f7fb',
  BG_CARD: '#ffffff',
  TEXT_PRIMARY: '#1e293b',
  TEXT_SECONDARY: '#64748b',
  TEXT_MUTED: '#94a3b8',
  SIDEBAR_START: '#0d213a',
  SIDEBAR_END: '#051020',
};
