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
  USER_DASHBOARD: '/dashboard',
  USER_SUBSCRIPTION: '/dashboard/subscription',
  USER_PAYMENTS: '/dashboard/payments',
  USER_REPORTS: '/dashboard/reports',
  USER_SUPPORT: '/dashboard/support',
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
  STRATEGY_CHECK: 60 * 1000,    // 60s — pre-select & entry time check
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
  PRIMARY: '#0ea5e9', // Sky-blue primary (updated to match theme CSS variable --primary)
  SUCCESS: '#10b981', // Emerald green
  DANGER: '#ef4444',  // Red
  WARNING: '#f59e0b', // Amber warning
  INFO: '#3b82f6',    // Sky blue info
  BG_PRIMARY: '#f5f7fb',
  BG_CARD: '#ffffff',
  TEXT_PRIMARY: '#1e293b',
  TEXT_SECONDARY: '#64748b',
  TEXT_MUTED: '#94a3b8',
  SIDEBAR_START: '#0d213a',
  SIDEBAR_END: '#051020',
};
