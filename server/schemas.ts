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

export const submitActivitySchema = z.object({
  score: z.number().int().nonnegative(),
  maxScore: z.number().int().positive(),
  mistakes: z.number().int().nonnegative(),
  durationSec: z.number().int().positive().max(3600),
});
