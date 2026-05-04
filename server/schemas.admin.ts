import { z } from 'zod';

export const childUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  ageMode: z.enum(['TK', 'SD1']).optional(),
  avatarKey: z.string().optional(),
});

export const auditLogQuerySchema = z.object({
  cursor: z.string().optional(),
  actor: z.string().optional(),
  actorType: z.enum(['ADMIN', 'SUPER_PARENT', 'DEVICE']).optional(),
  entityType: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const levelUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  iconKey: z.string().optional(),
  order: z.number().int().optional(),
});

export const activityUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  voiceOverKeys: z.string().optional(),
  estimatedSec: z.number().int().min(1).optional(),
  payload: z.string().optional(), // Full JSON string
});

export const bankItemUpdateSchema = z.object({
  items: z.array(z.unknown()),
});

export const bankSingleItemSchema = z.object({
  item: z.unknown(),
});

export const globalSettingsUpdateSchema = z.object({
  defaultDailyTimeCapMinutes: z.number().int().min(1).optional(),
  defaultBreakReminderMinutes: z.number().int().min(1).optional(),
  contentLockedForEdit: z.boolean().optional(),
});

/** Singleton PIN orang tua (perangkat) — saat ini admin hanya mengatur flag super-orang tua. */
export const parentDeviceSettingsUpdateSchema = z.object({
  isSuperParent: z.boolean().optional(),
});

export const importBankSchema = z.object({
  activityId: z.string(),
  items: z.array(z.unknown()),
  mode: z.enum(['replace', 'append']).default('replace'),
});
