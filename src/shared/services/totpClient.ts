'use client';

function base32Decode(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/[\s\-]+/g, '').replace(/=+$/, '');
  if (!clean) throw new Error('Empty base32 string');
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

function jsSha1(data: Uint8Array): Uint8Array {
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const len = data.length;
  const bitLen = len * 8;
  const paddedLen = Math.ceil((len + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(data);
  padded[len] = 0x80;

  const view = new DataView(padded.buffer);
  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  view.setUint32(paddedLen - 8, highBits, false);
  view.setUint32(paddedLen - 4, lowBits, false);

  const w = new Uint32Array(80);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 80; i++) {
      const n = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      w[i] = (n << 1) | (n >>> 31);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let i = 0; i < 80; i++) {
      let f = 0;
      let k = 0;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const result = new Uint8Array(20);
  const resView = new DataView(result.buffer);
  resView.setUint32(0, h0, false);
  resView.setUint32(4, h1, false);
  resView.setUint32(8, h2, false);
  resView.setUint32(12, h3, false);
  resView.setUint32(16, h4, false);
  return result;
}

function jsHmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let keyBuffer = key;
  if (keyBuffer.length > blockSize) {
    keyBuffer = jsSha1(keyBuffer);
  }
  if (keyBuffer.length < blockSize) {
    const paddedKey = new Uint8Array(blockSize);
    paddedKey.set(keyBuffer);
    keyBuffer = paddedKey;
  }

  const oPad = new Uint8Array(blockSize);
  const iPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oPad[i] = keyBuffer[i] ^ 0x5c;
    iPad[i] = keyBuffer[i] ^ 0x36;
  }

  const innerMsg = new Uint8Array(blockSize + message.length);
  innerMsg.set(iPad);
  innerMsg.set(message, blockSize);
  const innerHash = jsSha1(innerMsg);

  const outerMsg = new Uint8Array(blockSize + innerHash.length);
  outerMsg.set(oPad);
  outerMsg.set(innerHash, blockSize);
  return jsSha1(outerMsg);
}

export async function generateClientTOTP(secret: string): Promise<string> {
  const cleanSecret = secret.replace(/[\s\-]+/g, '');
  if (!cleanSecret) return '------';
  try {
    const keyBytes = base32Decode(cleanSecret);
    let timeValue = Math.floor(Math.floor(Date.now() / 1000) / 30);
    const timeBytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      timeBytes[i] = timeValue & 0xff;
      timeValue = Math.floor(timeValue / 256);
    }

    let hmacArray: Uint8Array;
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const cryptoKey = await window.crypto.subtle.importKey(
          'raw', keyBytes as any, { name: 'HMAC', hash: 'SHA-1' },
          false, ['sign']
        );
        const hmacResult = await window.crypto.subtle.sign('HMAC', cryptoKey, timeBytes);
        hmacArray = new Uint8Array(hmacResult);
      } catch {
        hmacArray = jsHmacSha1(keyBytes, timeBytes);
      }
    } else {
      hmacArray = jsHmacSha1(keyBytes, timeBytes);
    }

    const offset = hmacArray[hmacArray.length - 1] & 0xf;
    const code =
      ((hmacArray[offset] & 0x7f) << 24) |
      ((hmacArray[offset + 1] & 0xff) << 16) |
      ((hmacArray[offset + 2] & 0xff) << 8) |
      (hmacArray[offset + 3] & 0xff);
    return String(code % 1000000).padStart(6, '0');
  } catch {
    return '------';
  }
}

export function getTOTPCountdown(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

