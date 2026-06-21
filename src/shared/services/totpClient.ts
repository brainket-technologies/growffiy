'use client';

function base32Decode(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '');
  const length = clean.length;
  const buffer = new Uint8Array(Math.floor((length * 5) / 8));
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

export async function generateClientTOTP(secret: string): Promise<string> {
  const cleanSecret = secret.replace(/\s+/g, '');
  const keyBytes = base32Decode(cleanSecret);
  let timeValue = Math.floor(Math.floor(Date.now() / 1000) / 30);
  const timeBytes = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    timeBytes[i] = timeValue & 0xff;
    timeValue >>= 8;
  }
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyBytes as any, { name: 'HMAC', hash: 'SHA-1' },
    false, ['sign']
  );
  const hmacResult = await crypto.subtle.sign('HMAC', cryptoKey, timeBytes);
  const hmacArray = new Uint8Array(hmacResult);
  const offset = hmacArray[hmacArray.length - 1] & 0xf;
  const code =
    ((hmacArray[offset] & 0x7f) << 24) |
    ((hmacArray[offset + 1] & 0xff) << 16) |
    ((hmacArray[offset + 2] & 0xff) << 8) |
    (hmacArray[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, '0');
}

export function getTOTPCountdown(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}
