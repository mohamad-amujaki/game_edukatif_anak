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

/**
 * Produksi: satu URL publik (`BETTER_AUTH_URL`).
 * Development: base URL **dinamis** dari host permintaan (via `x-forwarded-host` dari proxy Vite)
 * supaya OAuth Google memakai `redirect_uri` ke port yang sama dengan tab browser (5173 vs 5174).
 * Daftar di Google Console: tambahkan tiap port yang dipakai, mis.
 * `http://localhost:5173/api/auth/callback/google` dan `http://localhost:5174/api/auth/callback/google`.
 */
const devDynamicBaseURL = {
  allowedHosts: [
    'localhost:5173',
    '127.0.0.1:5173',
    'localhost:5174',
    '127.0.0.1:5174',
    'localhost:4173',
    '127.0.0.1:4173',
  ],
  fallback: process.env.BETTER_AUTH_URL?.trim() || 'http://localhost:5173',
  protocol: 'http' as const,
};

const authBaseURL =
  process.env.NODE_ENV === 'production'
    ? process.env.BETTER_AUTH_URL?.trim() || 'http://localhost:5173'
    : devDynamicBaseURL;

export const auth = betterAuth({
  appName,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: authSecret(),
  baseURL: authBaseURL,
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
