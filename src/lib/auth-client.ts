import { apiBaseURL } from '@/lib/api-base-url';
import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: apiBaseURL(),
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
