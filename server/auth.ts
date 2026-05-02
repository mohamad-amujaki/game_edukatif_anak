import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, createAccessControl } from 'better-auth/plugins';
import { allowedBrowserOrigins } from './allowed-origins';
import { prisma } from './db';

function authSecret(): string {
  const s = process.env.BETTER_AUTH_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'BETTER_AUTH_SECRET must be set and at least 32 characters in production',
    );
  }
  // Local dev only — replace in .env for anything beyond localhost.
  return 'local-dev-better-auth-secret-key-min-32-chars';
}

/** Permissions matrix for the admin plugin (`hasPermission`); `/api/admin/*` uses separate middleware. */
const ac = createAccessControl({
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'impersonate-admins',
    'delete',
    'set-password',
    'get',
    'update',
  ],
  session: ['list', 'revoke', 'delete'],
});

const roleSuperAdmin = ac.newRole({
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'impersonate-admins',
    'delete',
    'set-password',
    'get',
    'update',
  ],
  session: ['list', 'revoke', 'delete'],
});

const roleContentEditor = ac.newRole({
  user: ['list', 'get'],
  session: [],
});

const roleAnalyst = ac.newRole({
  user: ['list', 'get'],
  session: [],
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: authSecret(),
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    /** Hanya bootstrap lewat `pnpm admin:create` — bukan pendaftaran publik. */
    disableSignUp: true,
  },
  plugins: [
    admin({
      ac,
      roles: {
        super_admin: roleSuperAdmin,
        content_editor: roleContentEditor,
        analyst: roleAnalyst,
      },
      defaultRole: 'analyst',
      adminRoles: ['super_admin', 'content_editor', 'analyst'],
      bannedUserMessage: 'Anda telah diblokir dari panel admin.',
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
  trustedOrigins: allowedBrowserOrigins(),
});
