import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Ensure the secret is 32 bytes long for aes-256-gcm
// In a real app, this should be defined in .env
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'growffi-super-secret-key-32bytes'; 
const SECRET_KEY = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest('base64').substring(0, 32);
const IV_LENGTH = 16;

/**
 * Encrypts plain text into an AES-256-GCM encrypted string format.
 * Format: aes:iv_hex:auth_tag_hex:encrypted_text_hex
 */
export function encryptText(text: string): string {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `aes:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err);
    return text;
  }
}

/**
 * Decrypts an AES-256-GCM encrypted string back to plain text.
 * Expects format: aes:iv_hex:auth_tag_hex:encrypted_text_hex
 * If it doesn't match the format or fails to decrypt, it returns the original string.
 */
export function decryptText(encryptedText: string): string {
  if (!encryptedText || !encryptedText.startsWith('aes:')) {
    return encryptedText;
  }
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 4) return encryptedText;

    const [prefix, ivHex, authTagHex, contentHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(contentHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    return encryptedText;
  }
}
