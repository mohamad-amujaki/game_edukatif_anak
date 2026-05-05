import { z } from 'zod';

export const ageModeSchema = z.enum(['TK', 'SD1']);
export const trackSchema = z.enum(['literasi', 'math']);

export const childNameSchema = z.string().min(1).max(20);

export const createProfileSchema = z.object({
  name: childNameSchema,
  avatarKey: z.string().min(1).max(64),
  ageMode: ageModeSchema,
});

export const updateProfileSchema = z.object({
  name: childNameSchema.optional(),
  avatarKey: z.string().optional(),
  ageMode: ageModeSchema.optional(),
});

export const pinSchema = z.string().regex(/^\d{4}$/);

export const setupPinSchema = z.object({
  pin: pinSchema,
  recoveryQuestion: z.string().min(3).max(100),
  recoveryAnswer: z.string().min(2).max(50),
});

export const verifyPinSchema = z.object({
  pin: pinSchema,
});

export const changePinSchema = z.object({
  currentPin: pinSchema,
  pin: pinSchema,
  recoveryQuestion: z.string().min(3).max(100),
  recoveryAnswer: z.string().min(2).max(50),
});

export const verifyRecoverySchema = z.object({
  recoveryAnswer: z.string().min(2).max(50),
});

export const resetPinRecoverySchema = z.object({
  recoveryToken: z.string().min(32).max(128),
  pin: pinSchema,
  recoveryQuestion: z.string().min(3).max(100),
  recoveryAnswer: z.string().min(2).max(50),
});

const emailOrEmpty = z.union([
  z.string().email().max(254),
  z.literal(''),
  z.null(),
]);

export const parentSettingsPatchSchema = z
  .object({
    dailyTimeCapMinutes: z.number().int().min(10).max(120).optional(),
    breakReminderMinutes: z.number().int().min(5).max(45).optional(),
    musicEnabled: z.boolean().optional(),
    sfxEnabled: z.boolean().optional(),
    reduceMotion: z.boolean().optional(),
    parentEmail: emailOrEmpty.optional(),
    weeklyEmailOptIn: z.boolean().optional(),
  })
  .strict();

export const submitActivitySchema = z.object({
  score: z.number().int().nonnegative(),
  maxScore: z.number().int().positive(),
  mistakes: z.number().int().nonnegative(),
  durationSec: z.number().int().positive().max(3600),
});

/** JSON pada `activityDefinition.voiceOverKeys`. */
export const activityVoiceOverSchema = z.object({
  instruksi: z.string().min(1),
  /** Beberapa opsi pemutaran acak untuk jawaban benar. */
  correct: z.array(z.string().min(1)).optional(),
  wrong: z.array(z.string().min(1)).optional(),
  completion: z.string().min(1).optional(),
  /** Variasi bilingual (arah §8.4): opsional. */
  instruksiEn: z.string().min(1).optional(),
  completionHint: z.string().min(1).optional(),
});

export type ActivityVoiceOverPayload = z.infer<typeof activityVoiceOverSchema>;
