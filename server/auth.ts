import { APIError, betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, createAccessControl } from 'better-auth/plugins';
import { allowedBrowserOrigins } from './allowed-origins';
import {
  betterAuthAllowedHosts,
  betterAuthBaseUrlFallback,
} from './better-auth-base-url';
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
  /**
   * Dynamic base URL: ambil host dari request (`x-forwarded-host` saat di belakang proxy).
   * Deploy Netlify → Fly: browser memanggil `https://….netlify.app/api/auth/*`; Fly harus
   * mengenali host Netlify agar cookie/sesi tidak “menempel” ke `*.fly.dev`.
   * Fallback: `BETTER_AUTH_URL` atau localhost dev.
   */
  baseURL: {
    allowedHosts: betterAuthAllowedHosts(),
    fallback: betterAuthBaseUrlFallback(),
  },
  emailAndPassword: {
    enabled: true,
    /** Setelah daftar admin pertama, cookie sesi langsung aktif (tanpa login kedua). */
    autoSignIn: true,
    /**
     * Sign-up email aktif; hook database membatasi ke **satu** akun pertama (`super_admin`).
     * Admin berikutnya dibuat dari panel admin oleh super_admin.
     */
    disableSignUp: false,
  },
  databaseHooks: {
    user: {
      create: {
        /**
         * Hanya untuk **`POST /sign-up/email`** (admin pertama).
         * Pembuatan user lewat **`/admin/create-user`** (panel super_admin) tidak boleh
         * memakai aturan "satu akun" ini — tanpa pengecualian, hook akan selalu menolak
         * setelah user pertama ada.
         */
        before: async (user, ctx) => {
          const path = String(ctx?.path ?? '');
          const isPublicEmailSignUp =
            path.includes('sign-up') && path.includes('email');
          if (!isPublicEmailSignUp) {
            return undefined;
          }

          const existing = await prisma.user.count();
          if (existing > 0) {
            throw APIError.from('FORBIDDEN', {
              message:
                'Pendaftaran admin tertutup. Gunakan masuk dengan akun yang ada / minta super_admin menambahkan Anda.',
              code: 'ADMIN_SIGNUP_CLOSED',
            });
          }
          return {
            data: {
              ...user,
              role: 'super_admin',
            },
          };
        },
      },
    },
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
