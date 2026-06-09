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
