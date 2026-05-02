const BASE = '';

export type ApiError = { code: string; message: string };

async function parse<T>(res: Response): Promise<T> {
  const json = (await res.json()) as { data?: T; error?: ApiError };
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? res.statusText);
  }
  return json.data as T;
}

export const api = {
  getProfiles: async () => {
    const res = await fetch(`${BASE}/api/profiles`);
    return parse<
      Array<{
        id: string;
        name: string;
        avatarKey: string;
        ageMode: string;
        createdAt: string;
      }>
    >(res);
  },

  createProfile: async (body: {
    name: string;
    avatarKey: string;
    ageMode: 'TK' | 'SD1';
  }) => {
    const res = await fetch(`${BASE}/api/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return parse<{
      id: string;
      name: string;
      avatarKey: string;
      ageMode: string;
      createdAt: string;
    }>(res);
  },

  getDashboard: async (childId: string) => {
    const res = await fetch(`${BASE}/api/profiles/${childId}/dashboard`);
    return parse<Record<string, unknown>>(res);
  },

  getLevels: async (childId: string, track?: string) => {
    const q = track ? `?track=${track}` : '';
    const res = await fetch(`${BASE}/api/profiles/${childId}/levels${q}`);
    return parse<Array<Record<string, unknown>>>(res);
  },

  getLevelDetail: async (childId: string, levelId: string) => {
    const res = await fetch(
      `${BASE}/api/profiles/${childId}/levels/${levelId}`,
    );
    return parse<Record<string, unknown>>(res);
  },

  getActivity: async (activityId: string) => {
    const res = await fetch(`${BASE}/api/activities/${activityId}`);
    return parse<{
      id: string;
      type: string;
      title: string;
      estimatedSec: number;
      payload: unknown;
      voiceOverKeys: { instruksi: string };
      level: { id: string; title: string; track: string };
    }>(res);
  },

  submitActivity: async (
    childId: string,
    activityId: string,
    body: {
      score: number;
      maxScore: number;
      mistakes: number;
      durationSec: number;
    },
  ) => {
    const res = await fetch(
      `${BASE}/api/profiles/${childId}/activities/${activityId}/submit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    return parse<Record<string, unknown>>(res);
  },

  setupPin: async (body: {
    pin: string;
    recoveryQuestion: string;
    recoveryAnswer: string;
  }) => {
    const res = await fetch(`${BASE}/api/parent/setup-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return parse<{ ok: true; sessionToken: string; expiresAt: string }>(res);
  },

  verifyPin: async (pin: string) => {
    const res = await fetch(`${BASE}/api/parent/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    return parse<{ sessionToken: string; expiresAt: string }>(res);
  },

  getParentSettings: async (token: string) => {
    const res = await fetch(`${BASE}/api/parent/settings`, {
      headers: { 'X-Parent-Session': token },
    });
    return parse<Record<string, unknown>>(res);
  },

  getReport: async (token: string, childId: string) => {
    const res = await fetch(`${BASE}/api/parent/report/${childId}`, {
      headers: { 'X-Parent-Session': token },
    });
    return parse<Record<string, unknown>>(res);
  },

  deleteProfile: async (token: string, id: string) => {
    return fetch(`${BASE}/api/profiles/${id}`, {
      method: 'DELETE',
      headers: { 'X-Parent-Session': token },
    });
  },
};
