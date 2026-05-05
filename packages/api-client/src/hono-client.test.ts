import { describe, expect, it } from 'vitest';
import { unwrapData } from './hono-client';

describe('unwrapData', () => {
  it('returns data on 2xx JSON with data key', async () => {
    const res = new Response(JSON.stringify({ data: { hello: 'world' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    await expect(unwrapData<{ hello: string }>(res)).resolves.toEqual({
      hello: 'world',
    });
  });

  it('throws with error message when response has error', async () => {
    const res = new Response(JSON.stringify({ error: { message: 'nope' } }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
    await expect(unwrapData(res)).rejects.toThrow('nope');
  });

  it('throws hint when body is HTML', async () => {
    const res = new Response('<!DOCTYPE html><html>', { status: 200 });
    await expect(unwrapData(res)).rejects.toThrow(/HTML/i);
  });

  it('throws when JSON is malformed', async () => {
    const res = new Response('not-json', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    await expect(unwrapData(res)).rejects.toThrow(/bukan JSON/);
  });
});
