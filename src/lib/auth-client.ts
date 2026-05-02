import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

/** Same-origin + proxy `/api` di dev; jangan pakai `/` — Better Auth menolaknya. */
function authBaseURL(): string {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) return fromEnv;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://localhost:5173';
}

export const authClient = createAuthClient({
  baseURL: authBaseURL(),
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
