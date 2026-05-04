/**
 * Memvalidasi bank soal generator (minimal panjang array) dan payload aktivitas seed.
 * Acuan: docs/recommendations.md §8.2 — dipanggil dari `pnpm run bank:validate` & CI.
 */

import { extendedLevelsSeed } from '../prisma/extended-levels-seed';
import * as literasiBanks from '../prisma/literasi-banks';
import * as literasiExt from '../prisma/literasi-extended-banks';
import * as mathBanks from '../prisma/math-banks';

const MIN_QUESTIONS = 20;
const MIN_PAIRS = 20;

function assertMinLength(name: string, rows: unknown[], min: number) {
  if (rows.length < min) {
    throw new Error(`${name}: perlu ≥${min} entri, dapat ${rows.length}`);
  }
}

function validateExportedBanks(
  mod: Record<string, unknown>,
  moduleLabel: string,
) {
  for (const [name, exp] of Object.entries(mod)) {
    if (typeof exp !== 'function') continue;
    const fn = exp as (...a: unknown[]) => unknown;
    if (fn.length > 0) continue;
    let out: unknown;
    try {
      out = fn();
    } catch (e) {
      throw new Error(
        `${moduleLabel}.${name}(): gagal menjalankan — ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    if (!Array.isArray(out)) continue;
    if (name.toLowerCase().includes('pairs') || name.includes('Pairs')) {
      assertMinLength(`${moduleLabel}.${name}`, out, MIN_PAIRS);
    } else {
      assertMinLength(`${moduleLabel}.${name}`, out, MIN_QUESTIONS);
    }
  }
}

function validateExtendedSeedPayloads() {
  const rows = extendedLevelsSeed();
  for (const L of rows) {
    const p = L.activity.payload as Record<string, unknown>;
    if (Array.isArray(p.questions)) {
      assertMinLength(`level=${L.id} questions`, p.questions, MIN_QUESTIONS);
    } else if (Array.isArray(p.pairs)) {
      assertMinLength(`level=${L.id} pairs`, p.pairs, MIN_PAIRS);
    } else {
      throw new Error(
        `level=${L.id} (${L.activity.type}): tidak ada array questions atau pairs`,
      );
    }
  }
}

function main() {
  validateExportedBanks(mathBanks, 'math-banks');
  validateExportedBanks(literasiBanks, 'literasi-banks');
  validateExportedBanks(literasiExt, 'literasi-extended-banks');
  validateExtendedSeedPayloads();
  console.log('bank:validate OK — semua bank & extended seed lolos.');
}

main();
