import { createHash, randomBytes } from 'node:crypto';

const pepper = () => process.env.PIN_HASH_PEPPER ?? '';

export function hashRecoveryToken(token: string): string {
  return createHash('sha256')
    .update(pepper(), 'utf8')
    .update(token, 'utf8')
    .digest('hex');
}

export function newRecoveryToken(): string {
  return randomBytes(32).toString('hex');
}
