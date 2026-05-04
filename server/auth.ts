import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, createAccessControl, twoFactor } from 'better-auth/plugins';
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

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

const appName =
  process.env.BETTER_AUTH_APP_NAME?.trim() || 'Game Edukatif — Admin';

export const auth = betterAuth({
  appName,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: authSecret(),
  /**
   * Di Fly + Netlify proxy: **`BETTER_AUTH_URL` harus URL yang dipakai browser**, mis.
   * `https://game-edukatif-anak.netlify.app` (tanpa slash akhir). Konfigurasi `baseURL`
   * dinamis (allowedHosts) pernah memunculkan 500 di production; string statis + header
   * `x-forwarded-host` yang di-inject di `auth-proxy-headers.ts` lebih stabil.
   */
  baseURL: process.env.BETTER_AUTH_URL?.trim() || 'http://localhost:5173',
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    /** Orang tua (app utama); admin panel memakai CLI `pnpm admin:create` atau undangan dari super_admin. */
    disableSignUp: false,
  },
  ...(googleClientId &&
    googleClientSecret && {
      socialProviders: {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      },
    }),
  plugins: [
    twoFactor({
      issuer: appName,
    }),
    admin({
      ac,
      roles: {
        super_admin: roleSuperAdmin,
        content_editor: roleContentEditor,
        analyst: roleAnalyst,
      },
      /** Pendaftar publik (email/Google) menjadi orang tua aplikasi bermain — bukan staf panel. */
      defaultRole: 'parent',
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
