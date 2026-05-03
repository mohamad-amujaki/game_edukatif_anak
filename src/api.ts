import type { DevicePreferences } from '@/lib/game-feedback-sync';
import { hcApi, unwrapData } from '@/lib/hono-client';

export type ApiError = { code: string; message: string };

export type ProfileRow = {
  id: string;
  name: string;
  avatarKey: string;
  ageMode: string;
  createdAt: string;
};

export const api = {
  getProfiles: async () =>
    unwrapData<Array<ProfileRow>>(await hcApi.api.profiles.$get()),

  createProfile: async (body: {
    name: string;
    avatarKey: string;
    ageMode: 'TK' | 'SD1';
  }) => unwrapData<ProfileRow>(await hcApi.api.profiles.$post({ json: body })),

  patchProfileSelf: async (
    id: string,
    body: Partial<{ name: string; avatarKey: string; ageMode: 'TK' | 'SD1' }>,
  ) =>
    unwrapData<ProfileRow>(
      await hcApi.api.profiles[':id'].self.$patch({
        param: { id },
        json: body,
      }),
    ),

  getDashboard: async (childId: string) =>
    unwrapData<Record<string, unknown>>(
      await hcApi.api.profiles[':id'].dashboard.$get({
        param: { id: childId },
      }),
    ),

  /** Preferensi perangkat (singleton) — tidak memerlukan profil anak. */
  getDevicePreferences: async () =>
    unwrapData<DevicePreferences>(await hcApi.api.device.preferences.$get()),

  getWellness: async (childId: string) =>
    unwrapData<DevicePreferences>(
      await hcApi.api.profiles[':id'].wellness.$get({ param: { id: childId } }),
    ),

  getStickers: async (childId: string) =>
    unwrapData<
      Array<{
        id: string;
        name: string;
        imagePath: string;
        rarity: string;
        theme: string;
        earnedAt: string;
      }>
    >(
      await hcApi.api.profiles[':id'].stickers.$get({ param: { id: childId } }),
    ),

  getLevels: async (childId: string, track?: string) =>
    unwrapData<Array<Record<string, unknown>>>(
      await hcApi.api.profiles[':childId'].levels.$get({
        param: { childId },
        ...(track ? { query: { track } } : {}),
      }),
    ),

  getLevelDetail: async (childId: string, levelId: string) =>
    unwrapData<Record<string, unknown>>(
      await hcApi.api.profiles[':childId'].levels[':levelId'].$get({
        param: { childId, levelId },
      }),
    ),

  getActivity: async (activityId: string) =>
    unwrapData<{
      id: string;
      type: string;
      title: string;
      estimatedSec: number;
      payload: unknown;
      voiceOverKeys: { instruksi: string };
      level: { id: string; title: string; track: string };
    }>(
      await hcApi.api.activities[':id'].$get({
        param: { id: activityId },
      }),
    ),

  submitActivity: async (
    childId: string,
    activityId: string,
    body: {
      score: number;
      maxScore: number;
      mistakes: number;
      durationSec: number;
    },
  ) =>
    unwrapData<Record<string, unknown>>(
      await hcApi.api.profiles[':childId'].activities[
        ':activityId'
      ].submit.$post({
        param: { childId, activityId },
        json: body,
      }),
    ),

  setupPin: async (body: {
    pin: string;
    recoveryQuestion: string;
    recoveryAnswer: string;
  }) =>
    unwrapData<{ ok: true; sessionToken: string; expiresAt: string }>(
      await hcApi.api.parent['setup-pin'].$post({
        json: body,
      }),
    ),

  getPinStatus: async () =>
    unwrapData<{ pinIsSet: boolean }>(
      await hcApi.api.parent['pin-status'].$get(),
    ),

  changePin: async (body: {
    currentPin: string;
    pin: string;
    recoveryQuestion: string;
    recoveryAnswer: string;
  }) =>
    unwrapData<{ ok: true; sessionToken: string; expiresAt: string }>(
      await hcApi.api.parent['change-pin'].$post({
        json: body,
      }),
    ),

  verifyPin: async (pin: string) =>
    unwrapData<{ sessionToken: string; expiresAt: string }>(
      await hcApi.api.parent['verify-pin'].$post({
        json: { pin },
      }),
    ),

  getParentSettings: async (token: string) =>
    unwrapData<{
      dailyTimeCapMinutes: number;
      breakReminderMinutes: number;
      musicEnabled: boolean;
      sfxEnabled: boolean;
      reduceMotion: boolean;
      isSuperParent: boolean;
    }>(
      await hcApi.api.parent.settings.$get({
        header: { 'X-Parent-Session': token },
      }),
    ),

  patchParentSettings: async (
    token: string,
    body: Partial<{
      dailyTimeCapMinutes: number;
      breakReminderMinutes: number;
      musicEnabled: boolean;
      sfxEnabled: boolean;
      reduceMotion: boolean;
    }>,
  ) =>
    unwrapData<{
      dailyTimeCapMinutes: number;
      breakReminderMinutes: number;
      musicEnabled: boolean;
      sfxEnabled: boolean;
      reduceMotion: boolean;
    }>(
      await hcApi.api.parent.settings.$put({
        header: { 'X-Parent-Session': token },
        json: body,
      }),
    ),

  patchProfileAsSuperParent: async (
    token: string,
    id: string,
    body: Partial<{ name: string; avatarKey: string; ageMode: 'TK' | 'SD1' }>,
  ) =>
    unwrapData<ProfileRow>(
      await hcApi.api.profiles[':id'].$patch({
        param: { id },
        header: { 'X-Parent-Session': token },
        json: body,
      }),
    ),

  resetProgressAsSuperParent: async (token: string, childId: string) =>
    unwrapData<{ ok: true }>(
      await hcApi.api.parent.super['reset-progress'][':childId'].$post({
        param: { childId },
        header: { 'X-Parent-Session': token },
      }),
    ),

  getReport: async (token: string, childId: string) =>
    unwrapData<Record<string, unknown>>(
      await hcApi.api.parent.report[':childId'].$get({
        param: { childId },
        header: { 'X-Parent-Session': token },
      }),
    ),

  deleteProfile: async (token: string, id: string) =>
    hcApi.api.profiles[':id'].$delete({
      param: { id },
      header: { 'X-Parent-Session': token },
    }),
};
