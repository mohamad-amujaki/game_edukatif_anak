import type { ActivityType } from '@prisma/client';
import { z } from 'zod';

export type BankValidationError = {
  index: number;
  path: string[];
  message: string;
};

const hurufPairItem = z.object({
  huruf: z.string().min(1),
  gambarKey: z.string().min(1),
  gambarLabel: z.string(),
});

const susunItem = z.object({
  gambarKey: z.string().min(1),
  gambarLabel: z.string(),
  targetKata: z.string().min(1),
  sukuKataKepingan: z.array(z.string()).min(2),
});

const bacaItem = z.object({
  kalimat: z.string().min(1),
  audioKey: z.string().min(1),
  gambarBenar: z.string().min(1),
  gambarSalah: z.array(z.string()).min(1),
});

const hitungItem = z.object({
  bendaKey: z.string().min(1),
  bendaLabel: z.string(),
  jumlah: z.number().int().min(0),
  pilihan: z.array(z.number()).min(2),
  jawaban: z.number().int(),
});

const bandingItem = z.object({
  mode: z.enum(['lebih_banyak', 'lebih_sedikit']),
  kiri: z.object({
    bendaKey: z.string().min(1),
    jumlah: z.number().int().min(0),
  }),
  kanan: z.object({
    bendaKey: z.string().min(1),
    jumlah: z.number().int().min(0),
  }),
  jawaban: z.enum(['kiri', 'kanan']),
});

const tambahItem = z
  .object({
    a: z.number().int().min(0),
    b: z.number().int().min(0),
    bendaKey: z.string().min(1),
    pilihan: z.array(z.number()).min(2),
  })
  .superRefine((q, ctx) => {
    const jawaban = q.a + q.b;
    if (!q.pilihan.includes(jawaban)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `pilihan harus memuat jawaban (${jawaban} = a + b)`,
      });
    }
  });

const kurangItem = z
  .object({
    a: z.number().int().min(0),
    b: z.number().int().min(0),
    bendaKey: z.string().min(1),
    pilihan: z.array(z.number()).min(2),
  })
  .superRefine((q, ctx) => {
    const jawaban = q.a - q.b;
    if (!q.pilihan.includes(jawaban)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `pilihan harus memuat jawaban (${jawaban} = a - b)`,
      });
    }
  });

function flattenIssue(index: number, err: z.ZodIssue): BankValidationError[] {
  const path = err.path.map(String);
  return [{ index, path, message: err.message }];
}

function validateEach<T>(
  items: unknown[],
  schema: z.ZodType<T>,
): BankValidationError[] {
  const errors: BankValidationError[] = [];
  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    const r = schema.safeParse(raw);
    if (!r.success) {
      for (const issue of r.error.issues) {
        errors.push(...flattenIssue(i, issue));
      }
    }
  }
  return errors;
}

/**
 * Validasi array item bank sesuai `ActivityType` (selaras dengan payload di seed & ActivityPlayer).
 */
export function validateBankItems(
  activityType: ActivityType,
  items: unknown[],
):
  | { ok: true; items: unknown[] }
  | { ok: false; errors: BankValidationError[] } {
  if (!Array.isArray(items)) {
    return {
      ok: false,
      errors: [
        {
          index: 0,
          path: [],
          message: 'items harus berupa array',
        },
      ],
    };
  }

  let errors: BankValidationError[] = [];

  switch (activityType) {
    case 'HURUF_GAMBAR_MATCHING':
      errors = validateEach(items, hurufPairItem);
      break;
    case 'SUSUN_SUKU_KATA':
      errors = validateEach(items, susunItem);
      break;
    case 'BACA_KALIMAT_PENDEK':
      errors = validateEach(items, bacaItem);
      break;
    case 'HITUNG_BENDA':
      errors = validateEach(items, hitungItem);
      break;
    case 'BANDINGKAN_LEBIH_KURANG':
      errors = validateEach(items, bandingItem);
      break;
    case 'PENJUMLAHAN_VISUAL':
      errors = validateEach(items, tambahItem);
      break;
    case 'PENGURANGAN_VISUAL':
      errors = validateEach(items, kurangItem);
      break;
    default:
      return {
        ok: false,
        errors: [
          {
            index: 0,
            path: [],
            message: `ActivityType tidak dikenal: ${String(activityType)}`,
          },
        ],
      };
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, items };
}

function usesMatchingOrSusunBranch(activityType: ActivityType): boolean {
  const t = String(activityType);
  return t.includes('MATCHING') || t.includes('SUSUN');
}

/**
 * Ambil salinan array bank dari payload + key penyimpanan (`pairs` vs `questions`).
 */
export function getBankSlice(
  payload: Record<string, unknown>,
  activityType: ActivityType,
): { storageKey: 'pairs' | 'questions'; items: unknown[] } {
  if (usesMatchingOrSusunBranch(activityType)) {
    if (Array.isArray(payload.pairs)) {
      return { storageKey: 'pairs', items: [...payload.pairs] };
    }
    if (Array.isArray(payload.questions)) {
      return { storageKey: 'questions', items: [...payload.questions] };
    }
    return { storageKey: 'pairs', items: [] };
  }
  const q = payload.questions;
  return {
    storageKey: 'questions',
    items: Array.isArray(q) ? [...q] : [],
  };
}
