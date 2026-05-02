/**
 * Bootstrap admin pertama (tanpa sesi admin).
 * Membuat baris `User` + `Account` (credential) dengan hash sama seperti better-auth.
 *
 * Usage:
 *   pnpm admin:create -- --email admin@example.com --password 'SecurePass1!'
 */
import { randomUUID } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
import { prisma } from '../server/db.ts';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

async function main() {
  const email = arg('--email');
  const password = arg('--password');
  const name = arg('--name') ?? email?.split('@')[0] ?? 'Admin';

  if (!email || !password) {
    console.error(
      'Usage: pnpm admin:create -- --email you@example.com --password "..." [--name "Display Name"]',
    );
    process.exit(1);
  }

  const count = await prisma.user.count();
  if (count > 0) {
    console.error(
      'Database already has auth users. Refusing bootstrap (hapus user dari DB atau gunakan panel admin nanti).',
    );
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase();
  const userId = randomUUID();
  const accountId = randomUUID();
  const hashed = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        id: userId,
        name,
        email: normalizedEmail,
        emailVerified: false,
        role: 'super_admin',
        banned: false,
        banReason: null,
        banExpires: null,
      },
    }),
    prisma.account.create({
      data: {
        id: accountId,
        accountId: userId,
        providerId: 'credential',
        userId,
        password: hashed,
      },
    }),
  ]);

  console.log(
    `Created super_admin: ${normalizedEmail} (id=${userId}). Login via /admin/login (POST /api/auth/sign-in/email).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
