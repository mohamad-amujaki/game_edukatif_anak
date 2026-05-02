import type { Context } from 'hono';
import { prisma } from './db';
import { isParentSessionValid } from './parent-session';

function jsonErr(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

/** `undefined` = boleh lanjut; `Response` = kembalikan langsung ke client. */
export async function denyUnlessSuperParent(
  c: Context,
): Promise<Response | undefined> {
  const token = c.req.header('X-Parent-Session');
  if (!isParentSessionValid(token)) {
    return jsonErr('UNAUTHORIZED', 'Butuh sesi orang tua', 401);
  }
  const settings = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });
  if (!settings?.isSuperParent) {
    return jsonErr(
      'FORBIDDEN',
      'Fitur ini hanya untuk super-orang tua (PIN).',
      403,
    );
  }
  return undefined;
}
