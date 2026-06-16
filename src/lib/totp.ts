import crypto from 'crypto';

// Decode Base32 string to binary buffer (required for TOTP secret decoding)
function base32Decode(base32: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '');
  const length = clean.length;
  const buffer = Buffer.alloc(Math.floor((length * 5) / 8));
  
  let bits = 0;
  let value = 0;
  let index = 0;

  for (let i = 0; i < length; i++) {
    const val = alphabet.indexOf(clean[i]);
    if (val === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      buffer[index++] = (value >> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return buffer;
}

export function generateTOTP(secret: string): string {
  // Clean secret of spaces (common in manual configurations)
  const cleanSecret = secret.replace(/\s+/g, '');
  const key = base32Decode(cleanSecret);
  
  // Calculate time step (30 seconds)
  const epoch = Math.floor(Date.now() / 1000);
  const timeBytes = Buffer.alloc(8);
  let timeValue = Math.floor(epoch / 30);
  for (let i = 7; i >= 0; i--) {
    timeBytes[i] = timeValue & 0xff;
    timeValue >>= 8;
  }

  // Calculate HMAC-SHA1
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(timeBytes);
  const hmacResult = hmac.digest();

  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code = 
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  // Format code as 6-digit string
  const totp = String(code % 1000000).padStart(6, '0');
  return totp;
}
