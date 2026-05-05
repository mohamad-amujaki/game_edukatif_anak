import { isParentSessionValid } from '../../parent-session';

export function jsonErr(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

export async function parentGuard(
  sessionToken: string | undefined,
): Promise<boolean> {
  return isParentSessionValid(sessionToken);
}
