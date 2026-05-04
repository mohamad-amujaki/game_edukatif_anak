import { apiBaseURL } from '@/lib/api-base-url';
import { adminClient, twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: apiBaseURL(),
  plugins: [
    twoFactorClient({
      twoFactorPage: '/admin/two-factor',
    }),
    adminClient(),
  ],
});

export const { signIn, signOut, useSession } = authClient;
