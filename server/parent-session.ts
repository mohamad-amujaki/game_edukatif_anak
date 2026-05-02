import crypto from 'node:crypto';

const tokens = new Map<string, number>(); // token -> expiresAt ms

const TTL_MS = 30 * 60 * 1000;

export function createParentSession(): string {
  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, Date.now() + TTL_MS);
  return token;
}

export function isParentSessionValid(token: string | undefined): boolean {
  if (!token) return false;
  const exp = tokens.get(token);
  if (!exp || Date.now() > exp) {
    tokens.delete(token);
    return false;
  }
  tokens.set(token, Date.now() + TTL_MS); // slide expiry
  return true;
}

export function revokeParentSession(token: string): void {
  tokens.delete(token);
}
