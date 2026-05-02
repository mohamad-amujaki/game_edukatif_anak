/** Jumlah soal per sesi dari bank besar (PRD §3.5: 5–8). */
export const MATH_SESSION_QUESTION_COUNT = 6;

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Ambil subset acak dari bank soal untuk satu putaran permainan. */
export function pickSessionQuestions<T>(
  bank: T[],
  count = MATH_SESSION_QUESTION_COUNT,
): T[] {
  if (bank.length === 0) return [];
  const shuffled = shuffle(bank);
  const n = Math.min(Math.max(1, count), shuffled.length);
  return shuffled.slice(0, n);
}
