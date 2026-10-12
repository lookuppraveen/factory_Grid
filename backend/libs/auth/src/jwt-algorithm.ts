export type JwtHmacAlgorithm = 'HS256' | 'HS384' | 'HS512';

/**
 * Picks the HMAC algorithm from the secret's length, as the Java service (JJWT) did,
 * so tokens stay compatible: 64+ bytes HS512, 48+ HS384, 32+ HS256.
 */
export function jwtAlgorithmFor(secret: string): JwtHmacAlgorithm {
  const bytes = Buffer.byteLength(secret, 'utf8');
  if (bytes < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long.');
  }
  if (bytes >= 64) return 'HS512';
  if (bytes >= 48) return 'HS384';
  return 'HS256';
}
