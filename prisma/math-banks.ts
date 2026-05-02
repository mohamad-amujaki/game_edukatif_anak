/**
 * Bank soal matematika (≥20 per level/mode) untuk seed — deterministik & unik.
 */

function shuffleDeterministic<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (seed * 31 + i * 17) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fourNumbersIncluding(
  answer: number,
  min: number,
  max: number,
  salt: number,
): number[] {
  const out: number[] = [answer];
  const tryAdd = (x: number) => {
    const c = Math.max(min, Math.min(max, x));
    if (!out.includes(c) && out.length < 4) out.push(c);
  };
  for (const d of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5]) {
    if (out.length >= 4) break;
    tryAdd(answer + d);
  }
  let step = 0;
  while (out.length < 4 && step < 30) {
    tryAdd(min + ((answer + step + salt * 3) % Math.max(1, max - min + 1)));
    step++;
  }
  return shuffleDeterministic(out.slice(0, 4), salt);
}

const BENDA_HITUNG = [
  'apel',
  'bunga',
  'kucing',
  'bebek',
  'ikan',
  'jeruk',
  'pisang',
  'kupu',
] as const;

const LABEL: Record<string, string> = {
  apel: 'apel',
  bunga: 'bunga',
  kucing: 'kucing',
  bebek: 'bebek',
  ikan: 'ikan',
  jeruk: 'jeruk',
  pisang: 'pisang',
  kupu: 'kupu-kupu',
};

/** TK math-1: hitung 1–5 */
export function tkMath1HitungQuestions() {
  const questions: Array<{
    bendaKey: string;
    bendaLabel: string;
    jumlah: number;
    pilihan: number[];
    jawaban: number;
  }> = [];
  let salt = 1;
  for (let jumlah = 1; jumlah <= 5; jumlah++) {
    for (let k = 0; k < 4; k++) {
      const bendaKey = BENDA_HITUNG[(jumlah + k) % BENDA_HITUNG.length];
      questions.push({
        bendaKey,
        bendaLabel: LABEL[bendaKey] ?? bendaKey,
        jumlah,
        jawaban: jumlah,
        pilihan: fourNumbersIncluding(jumlah, 1, 9, salt++),
      });
    }
  }
  return questions;
}

/** TK math-2: hitung 6–10 */
export function tkMath2HitungQuestions() {
  const questions: Array<{
    bendaKey: string;
    bendaLabel: string;
    jumlah: number;
    pilihan: number[];
    jawaban: number;
  }> = [];
  let salt = 100;
  for (let jumlah = 6; jumlah <= 10; jumlah++) {
    for (let k = 0; k < 4; k++) {
      const bendaKey = BENDA_HITUNG[(jumlah + k * 2) % BENDA_HITUNG.length];
      questions.push({
        bendaKey,
        bendaLabel: LABEL[bendaKey] ?? bendaKey,
        jumlah,
        jawaban: jumlah,
        pilihan: fourNumbersIncluding(jumlah, 4, 12, salt++),
      });
    }
  }
  return questions;
}

/** TK math-3: bandingkan lebih banyak */
export function tkMath3BandingQuestions() {
  const questions: Array<{
    mode: 'lebih_banyak';
    kiri: { bendaKey: string; jumlah: number };
    kanan: { bendaKey: string; jumlah: number };
    jawaban: 'kiri' | 'kanan';
  }> = [];
  let salt = 0;
  const pairs: Array<[number, number]> = [];
  for (let a = 1; a <= 8; a++) {
    for (let b = a + 1; b <= 9; b++) {
      pairs.push([a, b]);
    }
  }
  const picks = shuffleDeterministic(pairs, 42).slice(0, 20);
  for (const [lo, hi] of picks) {
    const leftHigher = salt % 2 === 0;
    salt++;
    const sameKey = BENDA_HITUNG[salt % BENDA_HITUNG.length];
    if (leftHigher) {
      questions.push({
        mode: 'lebih_banyak',
        kiri: { bendaKey: sameKey, jumlah: hi },
        kanan: { bendaKey: sameKey, jumlah: lo },
        jawaban: 'kiri',
      });
    } else {
      questions.push({
        mode: 'lebih_banyak',
        kiri: { bendaKey: sameKey, jumlah: lo },
        kanan: { bendaKey: sameKey, jumlah: hi },
        jawaban: 'kanan',
      });
    }
  }
  return questions;
}

/** SD1 math-1: penjumlahan hingga 10 */
export function sd1Math1TambahQuestions() {
  const pairs: Array<[number, number]> = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      if (a + b <= 10) pairs.push([a, b]);
    }
  }
  const picks = shuffleDeterministic(pairs, 7).slice(0, 20);
  const keys = ['bintang', 'hati', 'apel', 'bola', 'bebek', 'ikan'] as const;
  return picks.map(([a, b], i) => ({
    a,
    b,
    bendaKey: keys[i % keys.length],
    pilihan: fourNumbersIncluding(a + b, 2, 12, 200 + i),
  }));
}

/** SD1 math-2: penjumlahan 11–20 */
export function sd1Math2TambahQuestions() {
  const pairs: Array<[number, number]> = [];
  for (let a = 2; a <= 15; a++) {
    for (let b = 2; b <= 15; b++) {
      const s = a + b;
      if (s >= 11 && s <= 20) pairs.push([a, b]);
    }
  }
  const picks = shuffleDeterministic(pairs, 99).slice(0, 20);
  const keys = ['apel', 'bola', 'jeruk', 'pisang', 'bunga', 'kucing'] as const;
  return picks.map(([a, b], i) => ({
    a,
    b,
    bendaKey: keys[i % keys.length],
    pilihan: fourNumbersIncluding(a + b, 8, 22, 300 + i),
  }));
}

/** SD1 math-3: pengurangan */
export function sd1Math3KurangQuestions() {
  const triples: Array<[number, number, number]> = [];
  for (let a = 6; a <= 15; a++) {
    for (let b = 1; b < a; b++) {
      const diff = a - b;
      if (diff >= 1 && diff <= 12) triples.push([a, b, diff]);
    }
  }
  const picks = shuffleDeterministic(triples, 123).slice(0, 20);
  const keys = ['apel', 'bola', 'bintang', 'hati', 'ikan', 'bebek'] as const;
  return picks.map(([a, b], i) => ({
    a,
    b,
    bendaKey: keys[i % keys.length],
    pilihan: fourNumbersIncluding(a - b, 0, 14, 400 + i),
  }));
}

/** TK math-4: hitung jumlah 11–15 */
export function tkMath4HitungQuestions() {
  const questions: Array<{
    bendaKey: string;
    bendaLabel: string;
    jumlah: number;
    pilihan: number[];
    jawaban: number;
  }> = [];
  let salt = 400;
  for (let jumlah = 11; jumlah <= 15; jumlah++) {
    for (let k = 0; k < 4; k++) {
      const bendaKey = BENDA_HITUNG[(jumlah + k) % BENDA_HITUNG.length];
      questions.push({
        bendaKey,
        bendaLabel: LABEL[bendaKey] ?? bendaKey,
        jumlah,
        jawaban: jumlah,
        pilihan: fourNumbersIncluding(jumlah, 8, 18, salt++),
      });
    }
  }
  return questions;
}

/** TK math-5 / math-10: bandingkan lebih banyak (bilangan hingga ~18) */
export function tkMathBandingMediumQuestions(seedSalt = 500) {
  const questions: Array<{
    mode: 'lebih_banyak';
    kiri: { bendaKey: string; jumlah: number };
    kanan: { bendaKey: string; jumlah: number };
    jawaban: 'kiri' | 'kanan';
  }> = [];
  let salt = seedSalt;
  const pairs: Array<[number, number]> = [];
  for (let a = 4; a <= 14; a++) {
    for (let b = a + 1; b <= 16; b++) {
      pairs.push([a, b]);
    }
  }
  const picks = shuffleDeterministic(pairs, seedSalt).slice(0, 20);
  for (const [lo, hi] of picks) {
    const leftHigher = salt % 2 === 0;
    salt++;
    const sameKey = BENDA_HITUNG[salt % BENDA_HITUNG.length];
    if (leftHigher) {
      questions.push({
        mode: 'lebih_banyak',
        kiri: { bendaKey: sameKey, jumlah: hi },
        kanan: { bendaKey: sameKey, jumlah: lo },
        jawaban: 'kiri',
      });
    } else {
      questions.push({
        mode: 'lebih_banyak',
        kiri: { bendaKey: sameKey, jumlah: lo },
        kanan: { bendaKey: sameKey, jumlah: hi },
        jawaban: 'kanan',
      });
    }
  }
  return questions;
}

/** TK math-6 / math-8: penjumlahan visual hasil ≤ 10 */
export function tkMathTambahKe10Questions(seedBase = 600) {
  const pairs: Array<[number, number]> = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = 1; b <= 9; b++) {
      if (a + b <= 10) pairs.push([a, b]);
    }
  }
  const picks = shuffleDeterministic(pairs, seedBase).slice(0, 20);
  const keys = ['bintang', 'hati', 'apel', 'bola', 'bebek', 'ikan'] as const;
  return picks.map(([a, b], i) => ({
    a,
    b,
    bendaKey: keys[(i + seedBase) % keys.length],
    pilihan: fourNumbersIncluding(a + b, 2, 12, seedBase + i),
  }));
}

/** TK math-7 / math-9: pengurangan visual sederhana */
export function tkMathKurangSimpleQuestions(seedBase = 700) {
  const triples: Array<[number, number]> = [];
  for (let a = 8; a <= 16; a++) {
    for (let b = 1; b < a; b++) {
      const diff = a - b;
      if (diff >= 1 && diff <= 10) triples.push([a, b]);
    }
  }
  const picks = shuffleDeterministic(triples, seedBase).slice(0, 20);
  const keys = ['apel', 'bola', 'bintang', 'hati', 'ikan', 'bebek'] as const;
  return picks.map(([a, b], i) => ({
    a,
    b,
    bendaKey: keys[(i + seedBase) % keys.length],
    pilihan: fourNumbersIncluding(a - b, 0, 12, seedBase + i),
  }));
}

/** TK math-9: hitung campuran 8–15 */
export function tkMath9HitungQuestions() {
  const questions: Array<{
    bendaKey: string;
    bendaLabel: string;
    jumlah: number;
    pilihan: number[];
    jawaban: number;
  }> = [];
  let salt = 900;
  let idx = 0;
  for (let jumlah = 8; jumlah <= 15; jumlah++) {
    for (let k = 0; k < 4 && idx < 20; k++, idx++) {
      const bendaKey = BENDA_HITUNG[(jumlah + k) % BENDA_HITUNG.length];
      questions.push({
        bendaKey,
        bendaLabel: LABEL[bendaKey] ?? bendaKey,
        jumlah,
        jawaban: jumlah,
        pilihan: fourNumbersIncluding(jumlah, 5, 18, salt++),
      });
    }
  }
  return questions.slice(0, 20);
}

/** SD1 math-4: penjumlahan hasil 15–24 */
export function sd1Math4TambahQuestions() {
  const pairs: Array<[number, number]> = [];
  for (let a = 5; a <= 18; a++) {
    for (let b = 5; b <= 18; b++) {
      const s = a + b;
      if (s >= 15 && s <= 24) pairs.push([a, b]);
    }
  }
  const picks = shuffleDeterministic(pairs, 1400).slice(0, 20);
  const keys = ['apel', 'bola', 'jeruk', 'pisang', 'bunga', 'kucing'] as const;
  return picks.map(([a, b], i) => ({
    a,
    b,
    bendaKey: keys[i % keys.length],
    pilihan: fourNumbersIncluding(a + b, 10, 28, 1400 + i),
  }));
}

/** SD1 math-5: pengurangan (a hingga 25) */
export function sd1Math5KurangQuestions() {
  const triples: Array<[number, number]> = [];
  for (let a = 12; a <= 25; a++) {
    for (let b = 3; b < a; b++) {
      const diff = a - b;
      if (diff >= 2 && diff <= 18) triples.push([a, b]);
    }
  }
  const picks = shuffleDeterministic(triples, 1500).slice(0, 20);
  const keys = ['apel', 'bola', 'bintang', 'hati', 'ikan', 'bebek'] as const;
  return picks.map(([a, b], i) => ({
    a,
    b,
    bendaKey: keys[i % keys.length],
    pilihan: fourNumbersIncluding(a - b, 0, 20, 1500 + i),
  }));
}

/** SD1 math-6: hitung benda hingga 18 */
export function sd1Math6HitungQuestions() {
  const questions: Array<{
    bendaKey: string;
    bendaLabel: string;
    jumlah: number;
    pilihan: number[];
    jawaban: number;
  }> = [];
  let salt = 1600;
  for (let jumlah = 11; jumlah <= 18; jumlah++) {
    for (let k = 0; k < 3 && questions.length < 20; k++) {
      const bendaKey = BENDA_HITUNG[(jumlah + k) % BENDA_HITUNG.length];
      questions.push({
        bendaKey,
        bendaLabel: LABEL[bendaKey] ?? bendaKey,
        jumlah,
        jawaban: jumlah,
        pilihan: fourNumbersIncluding(jumlah, 8, 22, salt++),
      });
    }
  }
  return questions.slice(0, 20);
}

/** SD1 math-7: bandingkan jumlah lebih besar */
export function sd1Math7BandingQuestions() {
  return tkMathBandingMediumQuestions(1700);
}

/** SD1 math-8: penjumlahan hasil 18–35 */
export function sd1Math8TambahQuestions() {
  const pairs: Array<[number, number]> = [];
  for (let a = 8; a <= 22; a++) {
    for (let b = 8; b <= 22; b++) {
      const s = a + b;
      if (s >= 18 && s <= 35) pairs.push([a, b]);
    }
  }
  const picks = shuffleDeterministic(pairs, 1800).slice(0, 20);
  const keys = ['apel', 'bola', 'jeruk', 'pisang', 'bunga', 'kucing'] as const;
  return picks.map(([a, b], i) => ({
    a,
    b,
    bendaKey: keys[i % keys.length],
    pilihan: fourNumbersIncluding(a + b, 14, 40, 1800 + i),
  }));
}

/** SD1 math-9: pengurangan (bilangan lebih besar) */
export function sd1Math9KurangQuestions() {
  const triples: Array<[number, number]> = [];
  for (let a = 18; a <= 35; a++) {
    for (let b = 5; b < a; b++) {
      const diff = a - b;
      if (diff >= 3 && diff <= 22) triples.push([a, b]);
    }
  }
  const picks = shuffleDeterministic(triples, 1900).slice(0, 20);
  const keys = ['apel', 'bola', 'bintang', 'hati', 'ikan', 'bebek'] as const;
  return picks.map(([a, b], i) => ({
    a,
    b,
    bendaKey: keys[i % keys.length],
    pilihan: fourNumbersIncluding(a - b, 0, 28, 1900 + i),
  }));
}

/** SD1 math-10: penjumlahan hasil 25–50 (operand moderat) */
export function sd1Math10TambahQuestions() {
  const pairs: Array<[number, number]> = [];
  for (let a = 12; a <= 35; a++) {
    for (let b = 12; b <= 35; b++) {
      const s = a + b;
      if (s >= 25 && s <= 50) pairs.push([a, b]);
    }
  }
  const picks = shuffleDeterministic(pairs, 2000).slice(0, 20);
  const keys = ['apel', 'bola', 'jeruk', 'pisang', 'bunga', 'kucing'] as const;
  return picks.map(([a, b], i) => ({
    a,
    b,
    bendaKey: keys[i % keys.length],
    pilihan: fourNumbersIncluding(a + b, 20, 55, 2000 + i),
  }));
}
