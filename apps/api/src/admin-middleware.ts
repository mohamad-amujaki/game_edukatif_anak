import type { Context, Next } from 'hono';
import { auth } from './auth';

export const requireAdminRole =
  (roles: string[]) => async (c: Context, next: Next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'unauthenticated' }, 401);

    // Better-auth returns user and session
    const role = session.user.role;
    if (!role || !roles.includes(role))
      return c.json({ error: 'forbidden' }, 403);

    c.set('adminUser', session.user);
    c.set('adminSession', session.session);
    await next();
  };
