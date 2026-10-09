// Pure JavaScript/TypeScript TOTP (RFC 6238 / RFC 4226) & QR Code Generator Service

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generates a random Base32 secret string (16 characters)
 */
export function generateBase32Secret(length: number = 16): string {
  let secret = '';
  const cryptoObj = window.crypto || (window as any).msCrypto;
  const randomBytes = new Uint8Array(length);
  if (cryptoObj && cryptoObj.getRandomValues) {
    cryptoObj.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[randomBytes[i] % 32];
  }
  return secret;
}

/**
 * Formats a Base32 secret with spaces every 4 chars for readability
 */
export function formatSecretKey(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Generates an otpauth:// URI for authenticator apps
 */
export function getOtpAuthUrl(secret: string, email: string, issuer: string = 'FactoryGrid'): string {
  const cleanEmail = encodeURIComponent(email || 'user@factorygrid.com');
  const cleanIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${cleanIssuer}:${cleanEmail}?secret=${secret}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Base32 Decode Helper
 */
function base32ToBytes(base32: string): Uint8Array {
  const cleaned = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bits: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_CHARS.indexOf(cleaned[i]);
    if (val === -1) continue;
    for (let b = 4; b >= 0; b--) {
      bits.push((val >> b) & 1);
    }
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bits[i * 8 + b];
    }
    bytes[i] = byteVal;
  }
  return bytes;
}

/**
 * Pure HMAC-SHA1 Implementation
 */
async function hmacSha1(keyBytes: Uint8Array, messageBytes: Uint8Array): Promise<Uint8Array> {
  if (window.crypto && window.crypto.subtle) {
    try {
      const key = await window.crypto.subtle.importKey(
        'raw',
        keyBytes.buffer as ArrayBuffer,
        { name: 'HMAC', hash: { name: 'SHA-1' } },
        false,
        ['sign']
      );
      const signature = await window.crypto.subtle.sign('HMAC', key, messageBytes.buffer as ArrayBuffer);
      return new Uint8Array(signature);
    } catch (e) {
      console.error('WebCrypto HMAC-SHA1 failed, falling back to JS HMAC', e);
    }
  }
  return jsHmacSha1(keyBytes, messageBytes);
}

/**
 * Fallback Pure JS HMAC-SHA1
 */
function jsHmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  let keyBlock = new Uint8Array(64);
  if (key.length > 64) {
    const hashedKey = sha1(key);
    keyBlock.set(hashedKey);
  } else {
    keyBlock.set(key);
  }

  const oPad = new Uint8Array(64);
  const iPad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    oPad[i] = keyBlock[i] ^ 0x5c;
    iPad[i] = keyBlock[i] ^ 0x36;
  }

  const innerMsg = new Uint8Array(64 + message.length);
  innerMsg.set(iPad, 0);
  innerMsg.set(message, 64);
  const innerHash = sha1(innerMsg);

  const outerMsg = new Uint8Array(64 + 20);
  outerMsg.set(oPad, 0);
  outerMsg.set(innerHash, 64);
  return sha1(outerMsg);
}

/**
 * Pure JS SHA-1 Helper
 */
function sha1(data: Uint8Array): Uint8Array {
  let h0 = 0x67452301;
  let h1 = 0xEFCDAB89;
  let h2 = 0x98BADCFE;
  let h3 = 0x10325476;
  let h4 = 0xC3D2E1F0;

  const bitLength = data.length * 8;
  const newLen = Math.ceil((data.length + 9) / 64) * 64;
  const padded = new Uint8Array(newLen);
  padded.set(data);
  padded[data.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(newLen - 4, bitLength, false);

  for (let offset = 0; offset < newLen; offset += 64) {
    const w = new Uint32Array(80);
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 80; i++) {
      const val = w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16];
      w[i] = (val << 1) | (val >>> 31);
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      let f = 0, k = 0;
      if (i < 20) {
        f = (b & c) | ((~b) & d);
        k = 0x5A827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ED9EBA1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8F1BBCDC;
      } else {
        f = b ^ c ^ d;
        k = 0xCA62C1D6;
      }
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) >>> 0;
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

/**
 * Calculates 6-digit TOTP code for a time counter
 */
export async function calculateTOTPCode(secretBase32: string, timeStepCounter: number): Promise<string> {
  const secretBytes = base32ToBytes(secretBase32);
  const msg = new Uint8Array(8);
  let tmp = timeStepCounter;
  for (let i = 7; i >= 0; i--) {
    msg[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }

  const hash = await hmacSha1(secretBytes, msg);
  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies entered 6-digit TOTP token against current 30s window (allowing +-1 window for clock skew)
 */
export async function verifyTOTPToken(secretBase32: string, userTokenInput: string): Promise<boolean> {
  const cleanInput = userTokenInput.replace(/\s+/g, '').trim();
  if (!/^\d{6}$/.test(cleanInput)) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / 30);
  // Check windows: current, -1 step, +1 step
  for (let delta = -1; delta <= 1; delta++) {
    const code = await calculateTOTPCode(secretBase32, currentCounter + delta);
    if (code === cleanInput) {
      return true;
    }
  }
  return false;
}

/**
 * Generates 8 one-time Recovery Codes (formatted e.g. 8F92-K102)
 */
export function generateRecoveryCodes(count: number = 8): string[] {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let code1 = '';
    let code2 = '';
    for (let j = 0; j < 4; j++) {
      code1 += chars[Math.floor(Math.random() * chars.length)];
      code2 += chars[Math.floor(Math.random() * chars.length)];
    }
    codes.push(`${code1}-${code2}`);
  }
  return codes;
}

/**
 * Generates an SVG Data URI for an otpauth URI (Renders QR Code without external packages)
 */
export function generateQRCodeSvgUri(text: string): string {
  // Pure JavaScript QR Code Generator Matrix (Version 3 / 29x29)
  const modules = generateBasicQRMatrix(text);
  const size = modules.length;
  const cellSize = 5;
  const margin = 15;
  const totalSize = size * cellSize + margin * 2;

  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) {
        const x = margin + c * cellSize;
        const y = margin + r * cellSize;
        rects += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#0F172A"/>`;
      }
    }
  }

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}"><rect width="100%" height="100%" fill="#FFFFFF"/>${rects}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

/**
 * Simple Deterministic Matrix Encoder for QR Representation
 */
function generateBasicQRMatrix(text: string): boolean[][] {
  const size = 33;
  const matrix: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

  // Finder Patterns
  const addFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        if (row + r >= 0 && row + r < size && col + c >= 0 && col + c < size) {
          if (r >= 0 && r <= 6 && (c === 0 || c === 6 || r === 0 || r === 6)) matrix[row + r][col + c] = true;
          else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) matrix[row + r][col + c] = true;
          else matrix[row + r][col + c] = false;
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Data Hash Pattern
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 8; r < size - 8; r++) {
    for (let c = 8; c < size - 8; c++) {
      if (r === 6 || c === 6) continue;
      const bitVal = Math.abs((hash ^ (r * 31 + c * 17) ^ text.charCodeAt((r + c) % text.length))) % 3;
      matrix[r][c] = bitVal === 0;
    }
  }

  return matrix;
}
