export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  KITE_AUTO_LOGIN_ENABLED: process.env.KITE_AUTO_LOGIN_ENABLED === 'true',
  USE_HTTP_POLLING: process.env.USE_HTTP_POLLING === 'true',
  ZERODHA_API_KEY: process.env.ZERODHA_API_KEY || process.env.KITE_API_KEY || '',
  ZERODHA_ACCESS_TOKEN: process.env.ZERODHA_ACCESS_TOKEN || process.env.KITE_ACCESS_TOKEN || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || '',
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://ws.kite.trade',
} as const;

export type Env = typeof env;
