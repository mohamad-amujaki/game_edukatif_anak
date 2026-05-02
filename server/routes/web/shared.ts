import { isParentSessionValid } from '../../parent-session';

export function jsonErr(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

export function parentGuard(sessionToken: string | undefined): boolean {
  return isParentSessionValid(sessionToken);
}
