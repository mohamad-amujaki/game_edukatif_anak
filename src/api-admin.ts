/** RPC admin via `hcApi` — sama-origin + cookie better-auth (lihat `src/lib/hono-client.ts`). */

import { hcApi } from '@/lib/hono-client';

async function parseAdminResponse(res: Response): Promise<unknown> {
  const raw = await res.text();
  const json = (
    raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
  ) as Record<string, unknown>;
  if (!res.ok) {
    const err = json.error;
    const msg =
      typeof err === 'string'
        ? err
        : err &&
            typeof err === 'object' &&
            'message' in err &&
            typeof (err as { message: unknown }).message === 'string'
          ? (err as { message: string }).message
          : res.statusText;
    const e = new Error(msg) as Error & {
      status?: number;
      details?: unknown;
    };
    e.status = res.status;
    if ('details' in json) e.details = json.details;
    throw e;
  }
  return json;
}

export type AdminLevelCompletionRow = {
  levelId: string;
  title: string;
  track: string;
  ageMode: string;
  order: number;
  mastered: number;
  eligibleChildren: number;
  masteredPct: number;
};

export type AdminAvgStarsActivityRow = {
  activityId: string;
  title: string;
  avgStars: number;
  attempts: number;
};

/** Bundle metrik MVP — selaras dengan `AdminAnalyticsBundle` di server */
export type AdminAnalyticsOverview = {
  totalAnak: number;
  totalSessions: number;
  dauToday: number;
  mau30d: number;
  retentionD1Pct: number | null;
  retentionD7Pct: number | null;
  retentionCohortD1: number;
  retentionCohortD7: number;
  totalPlayTimeMinutes: number;
  avgStarsGlobal: number;
  levelCompletion: AdminLevelCompletionRow[];
  avgStarsByActivity: AdminAvgStarsActivityRow[];
};

export type AdminOverviewResponse = AdminAnalyticsOverview & {
  _cached?: boolean;
};

export type AdminChildRow = {
  id: string;
  name: string;
  avatarKey: string;
  ageMode: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminActivitySummary = {
  id: string;
  title: string;
  type: string;
  order: number;
  estimatedSec: number;
};

export type AdminLevelRow = {
  id: string;
  track: string;
  ageMode: string;
  order: number;
  title: string;
  description: string;
  iconKey: string;
  activities: AdminActivitySummary[];
  _count: { activities: number };
};

export type AdminActivityDetail = {
  id: string;
  levelId: string;
  type: string;
  order: number;
  title: string;
  payload: string;
  voiceOverKeys: string;
  estimatedSec: number;
  level: {
    id: string;
    title: string;
    track: string;
    ageMode: string;
    order: number;
  };
};

export const adminApi = {
  async getOverview(): Promise<AdminOverviewResponse> {
    const json = (await parseAdminResponse(
      await hcApi.api.admin.analytics.overview.$get(),
    )) as {
      data: AdminAnalyticsOverview;
      cached?: boolean;
    };
    return { ...json.data, _cached: json.cached };
  },

  async getChildren(): Promise<AdminChildRow[]> {
    const json = (await parseAdminResponse(
      await hcApi.api.admin.children.$get(),
    )) as {
      data: AdminChildRow[];
    };
    return json.data;
  },

  async getLevels(): Promise<AdminLevelRow[]> {
    const json = (await parseAdminResponse(
      await hcApi.api.admin.levels.$get(),
    )) as {
      data: AdminLevelRow[];
    };
    return json.data;
  },

  async getActivity(id: string): Promise<AdminActivityDetail> {
    const json = (await parseAdminResponse(
      await hcApi.api.admin.activities[':id'].$get({ param: { id } }),
    )) as {
      data: AdminActivityDetail;
    };
    return json.data;
  },

  async patchActivity(
    id: string,
    body: Partial<{
      title: string;
      voiceOverKeys: string;
      estimatedSec: number;
      payload: string;
    }>,
  ): Promise<AdminActivityDetail> {
    const json = (await parseAdminResponse(
      await hcApi.api.admin.activities[':id'].$patch({
        param: { id },
        json: body,
      }),
    )) as { data: AdminActivityDetail };
    return json.data;
  },

  async getBank(activityId: string): Promise<{
    items: unknown[];
    activityType: string;
  }> {
    const json = (await parseAdminResponse(
      await hcApi.api.admin.activities[':id'].bank.$get({
        param: { id: activityId },
      }),
    )) as { data: unknown[]; activityType: string };
    return { items: json.data, activityType: json.activityType };
  },

  async putBank(activityId: string, items: unknown[]): Promise<void> {
    await parseAdminResponse(
      await hcApi.api.admin.activities[':id'].bank.$put({
        param: { id: activityId },
        json: { items },
      }),
    );
  },

  async postBankItem(
    activityId: string,
    item: unknown,
  ): Promise<{ ok: boolean; index: number }> {
    return (await parseAdminResponse(
      await hcApi.api.admin.activities[':id'].bank.items.$post({
        param: { id: activityId },
        json: { item },
      }),
    )) as { ok: boolean; index: number };
  },

  async patchBankItem(
    activityId: string,
    idx: number,
    item: unknown,
  ): Promise<void> {
    await parseAdminResponse(
      await hcApi.api.admin.activities[':id'].bank.items[':idx'].$patch({
        param: { id: activityId, idx: String(idx) },
        json: { item },
      }),
    );
  },

  async deleteBankItem(activityId: string, idx: number): Promise<void> {
    await parseAdminResponse(
      await hcApi.api.admin.activities[':id'].bank.items[':idx'].$delete({
        param: { id: activityId, idx: String(idx) },
      }),
    );
  },

  async getChild(id: string): Promise<
    AdminChildRow & {
      _count: { playSessions: number; progress: number };
    }
  > {
    const json = (await parseAdminResponse(
      await hcApi.api.admin.children[':id'].$get({ param: { id } }),
    )) as {
      data: AdminChildRow & {
        _count: { playSessions: number; progress: number };
      };
    };
    return json.data;
  },

  async patchChild(
    id: string,
    body: Partial<{ name: string; ageMode: 'TK' | 'SD1'; avatarKey: string }>,
  ): Promise<AdminChildRow> {
    const json = (await parseAdminResponse(
      await hcApi.api.admin.children[':id'].$patch({
        param: { id },
        json: body,
      }),
    )) as { data: AdminChildRow };
    return json.data;
  },

  async deleteChild(id: string): Promise<void> {
    await parseAdminResponse(
      await hcApi.api.admin.children[':id'].$delete({ param: { id } }),
    );
  },

  async resetChildProgress(id: string): Promise<void> {
    await parseAdminResponse(
      await hcApi.api.admin.children[':id']['reset-progress'].$post({
        param: { id },
      }),
    );
  },

  async getSettings(): Promise<{
    id: string;
    defaultDailyTimeCapMinutes: number;
    defaultBreakReminderMinutes: number;
    contentLockedForEdit: boolean;
    updatedAt?: string;
  }> {
    const json = (await parseAdminResponse(
      await hcApi.api.admin.settings.$get(),
    )) as {
      data: {
        id: string;
        defaultDailyTimeCapMinutes: number;
        defaultBreakReminderMinutes: number;
        contentLockedForEdit: boolean;
        updatedAt?: string;
      };
    };
    return json.data;
  },

  async patchSettings(
    body: Partial<{
      defaultDailyTimeCapMinutes: number;
      defaultBreakReminderMinutes: number;
      contentLockedForEdit: boolean;
    }>,
  ): Promise<unknown> {
    const json = (await parseAdminResponse(
      await hcApi.api.admin.settings.$patch({
        json: body,
      }),
    )) as { data: unknown };
    return json.data;
  },

  async getParentDeviceSettings(): Promise<{ isSuperParent: boolean }> {
    const json = (await parseAdminResponse(
      await hcApi.api.admin['parent-settings'].$get(),
    )) as {
      data: { isSuperParent: boolean };
    };
    return json.data;
  },

  async patchParentDeviceSettings(body: {
    isSuperParent?: boolean;
  }): Promise<{ isSuperParent: boolean }> {
    const json = (await parseAdminResponse(
      await hcApi.api.admin['parent-settings'].$patch({
        json: body,
      }),
    )) as { data: { isSuperParent: boolean } };
    return json.data;
  },

  async getAuditLog(query?: {
    actor?: string;
    actorType?: 'ADMIN' | 'SUPER_PARENT';
    entityType?: string;
    from?: string;
    to?: string;
  }): Promise<AdminAuditRow[]> {
    const q: Record<string, string> = {};
    if (query?.actor) q.actor = query.actor;
    if (query?.actorType) q.actorType = query.actorType;
    if (query?.entityType) q.entityType = query.entityType;
    if (query?.from) q.from = query.from;
    if (query?.to) q.to = query.to;
    const json = (await parseAdminResponse(
      await hcApi.api.admin['audit-log'].$get({
        ...(Object.keys(q).length > 0 ? { query: q } : {}),
      }),
    )) as { data: AdminAuditRow[] };
    return json.data;
  },

  async importBank(body: {
    activityId: string;
    items: unknown[];
    mode: 'replace' | 'append';
  }): Promise<void> {
    await parseAdminResponse(
      await hcApi.api.admin.import.bank.$post({
        json: body,
      }),
    );
  },

  async getExportBank(activityId: string): Promise<{
    activity: { id: string; type: string; title: string };
    items: unknown[];
    exportedAt: string;
  }> {
    return (await parseAdminResponse(
      await hcApi.api.admin.export.bank[':id'].$get({
        param: { id: activityId },
      }),
    )) as {
      activity: { id: string; type: string; title: string };
      items: unknown[];
      exportedAt: string;
    };
  },

  async getExportAll(): Promise<unknown> {
    return parseAdminResponse(await hcApi.api.admin.export.all.$get());
  },
};

export type AdminAuditRow = {
  id: string;
  actorType: string;
  actorId: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: string | null;
  afterJson: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};
