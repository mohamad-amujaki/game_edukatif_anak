import crypto from 'node:crypto';
import { prisma } from './db';

const TTL_MS = 30 * 60 * 1000;

export async function createParentSession(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TTL_MS);
  await prisma.$transaction([
    prisma.parentSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    }),
    prisma.parentSession.create({
      data: { token, expiresAt },
    }),
  ]);
  return token;
}

export async function isParentSessionValid(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const row = await prisma.parentSession.findUnique({
    where: { token },
  });
  const now = new Date();
  if (!row || row.expiresAt < now) {
    if (row) {
      await prisma.parentSession.delete({ where: { token } }).catch(() => {
        /* race */
      });
    }
    return false;
  }
  await prisma.parentSession.update({
    where: { token },
    data: { expiresAt: new Date(Date.now() + TTL_MS) },
  });
  return true;
}

export async function revokeParentSession(token: string): Promise<void> {
  await prisma.parentSession.deleteMany({ where: { token } });
}
