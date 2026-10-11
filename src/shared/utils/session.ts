import crypto from 'crypto';

const SECRET = process.env.ENCRYPTION_SECRET || 'growffi-super-secret-key-32bytes';

/**
 * Generates a tamper-proof session token based on user ID and a hash of their current password.
 * Format: `${id}.${signature}`
 * If the user's password changes, all previous tokens signed with the old password become immediately invalid.
 */
export function generateSessionToken(id: string, passwordHashOrPlain: string): string {
  if (!id || !passwordHashOrPlain) return '';
  const passwordDigest = crypto.createHash('sha256').update(String(passwordHashOrPlain)).digest('hex');
  const signature = crypto.createHmac('sha256', SECRET).update(`${id}:${passwordDigest}`).digest('hex');
  return `${id}.${signature}`;
}

/**
 * Validates whether the session token matches the user's current password.
 * Returns true only if the signature matches the current password.
 */
export function verifySessionToken(token: string, currentPassword: string): boolean {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return false;
  }
  const [id, signature] = token.split('.');
  if (!id || !signature || !currentPassword) {
    return false;
  }
  const passwordDigest = crypto.createHash('sha256').update(String(currentPassword)).digest('hex');
  const expectedSignature = crypto.createHmac('sha256', SECRET).update(`${id}:${passwordDigest}`).digest('hex');
  return signature === expectedSignature;
}
