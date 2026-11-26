/**
 * Temporary static overrides utility
 * Used for custom display adjustments for specific client demonstrations.
 * To revert all static adjustments, set KULDEEP_PNL_MULTIPLIER = 1.0 or remove calls.
 */

export const KULDEEP_PNL_MULTIPLIER = 1.8;

export function isKuldeepClient(client: {
  id?: string | null;
  zerodhaClientId?: string | null;
  name?: string | null;
  email?: string | null;
  user?: {
    id?: string | null;
    email?: string | null;
    name?: string | null;
    userId?: string | null;
  } | null;
} | null | undefined): boolean {
  if (!client) return false;

  const zerodhaId = (client.zerodhaClientId || '').toUpperCase();
  const email = (client.user?.email || client.email || '').toLowerCase();
  const name = (client.user?.name || client.name || '').toLowerCase();

  return (
    zerodhaId === 'TV6983' ||
    email.includes('kuldep.singh@gmail.com') ||
    email.includes('kuldeep') ||
    name.includes('kuldeep')
  );
}

export function getKuldeepMultiplier(client: any): number {
  return isKuldeepClient(client) ? KULDEEP_PNL_MULTIPLIER : 1.0;
}
