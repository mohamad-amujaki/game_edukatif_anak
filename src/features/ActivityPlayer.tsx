import { Button } from '@/components/ui/Button';
import { emojiForKey } from '@/lib/emoji-map';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type HurufPayload = {
  instruction: string;
  pairs: Array<{ huruf: string; gambarKey: string; gambarLabel: string }>;
  shuffle?: boolean;
};

type SusunPayload = {
  instruction: string;
  questions: Array<{
    gambarKey: string;
    gambarLabel: string;
    targetKata: string;
    sukuKataKepingan: string[];
  }>;
};

type BacaPayload = {
  instruction: string;
  questions: Array<{
    kalimat: string;
    audioKey: string;
    gambarBenar: string;
    gambarSalah: string[];
  }>;
};

type HitungPayload = {
  instruction: string;
  questions: Array<{
    bendaKey: string;
    bendaLabel: string;
    jumlah: number;
    pilihan: number[];
    jawaban: number;
  }>;
};

type BandingPayload = {
  instruction: string;
  questions: Array<{
    mode: 'lebih_banyak' | 'lebih_sedikit';
    kiri: { bendaKey: string; jumlah: number };
    kanan: { bendaKey: string; jumlah: number };
    jawaban: 'kiri' | 'kanan';
  }>;
};

type TambahPayload = {
  instruction: string;
  questions: Array<{
    a: number;
    b: number;
    bendaKey: string;
    pilihan: number[];
  }>;
};

type KurangPayload = {
  instruction: string;
  questions: Array<{
    a: number;
    b: number;
    bendaKey: string;
    pilihan: number[];
  }>;
};

export type ActivityPayload =
  | { type: 'HURUF_GAMBAR_MATCHING'; data: HurufPayload }
  | { type: 'SUSUN_SUKU_KATA'; data: SusunPayload }
  | { type: 'BACA_KALIMAT_PENDEK'; data: BacaPayload }
  | { type: 'HITUNG_BENDA'; data: HitungPayload }
  | { type: 'BANDINGKAN_LEBIH_KURANG'; data: BandingPayload }
  | { type: 'PENJUMLAHAN_VISUAL'; data: TambahPayload }
  | { type: 'PENGURANGAN_VISUAL'; data: KurangPayload };

type Props = {
  activityType: string;
  payload: unknown;
  title: string;
  instructionAudio?: string;
  onComplete: (result: {
    mistakes: number;
    score: number;
    maxScore: number;
    durationSec: number;
  }) => void;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ActivityPlayer({
  activityType,
  payload,
  title,
  onComplete,
}: Props) {
  const started = useRef(Date.now());
  const wrapped = useMemo(() => {
    const p = payload as Record<string, unknown>;
    return { type: activityType, data: p } as ActivityPayload;
  }, [activityType, payload]);

  const finish = useCallback(
    (mistakes: number, score: number, maxScore: number) => {
      const durationSec = Math.max(
        1,
        Math.round((Date.now() - started.current) / 1000),
      );
      onComplete({ mistakes, score, maxScore, durationSec });
    },
    [onComplete],
  );

  switch (wrapped.type) {
    case 'HURUF_GAMBAR_MATCHING':
      return (
        <HurufGambar
          title={title}
          data={wrapped.data}
          onDone={(m, s, mx) => finish(m, s, mx)}
        />
      );
    case 'SUSUN_SUKU_KATA':
      return (
        <SusunSukuKata
          title={title}
          data={wrapped.data}
          onDone={(m, s, mx) => finish(m, s, mx)}
        />
      );
    case 'BACA_KALIMAT_PENDEK':
      return (
        <BacaKalimat
          title={title}
          data={wrapped.data}
          onDone={(m, s, mx) => finish(m, s, mx)}
        />
      );
    case 'HITUNG_BENDA':
      return (
        <HitungBenda
          title={title}
          data={wrapped.data}
          onDone={(m, s, mx) => finish(m, s, mx)}
        />
      );
    case 'BANDINGKAN_LEBIH_KURANG':
      return (
        <Bandingkan
          title={title}
          data={wrapped.data}
          onDone={(m, s, mx) => finish(m, s, mx)}
        />
      );
    case 'PENJUMLAHAN_VISUAL':
      return (
        <Penjumlahan
          title={title}
          data={wrapped.data}
          onDone={(m, s, mx) => finish(m, s, mx)}
        />
      );
    case 'PENGURANGAN_VISUAL':
      return (
        <Pengurangan
          title={title}
          data={wrapped.data}
          onDone={(m, s, mx) => finish(m, s, mx)}
        />
      );
    default:
      return (
        <p className="p-6 text-center text-lg">
          Jenis aktivitas belum didukung: {activityType}
        </p>
      );
  }
}

function HurufGambar({
  title,
  data,
  onDone,
}: {
  title: string;
  data: HurufPayload;
  onDone: (mistakes: number, score: number, maxScore: number) => void;
}) {
  const pairs = data.shuffle !== false ? shuffle(data.pairs) : data.pairs;
  const [idx, setIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [letters, setLetters] = useState<string[]>(() =>
    shuffle(pairs.map((p) => p.huruf)),
  );
  const current = pairs[idx];

  const handleLetter = (h: string) => {
    if (!current) return;
    if (h === current.huruf) {
      if (idx + 1 >= pairs.length) {
        const maxScore = pairs.length * 10;
        const score = (pairs.length - mistakes) * 10;
        onDone(mistakes, score, maxScore);
      } else {
        setLetters(shuffle(pairs.map((p) => p.huruf)));
        setIdx(idx + 1);
      }
    } else {
      setMistakes((m) => m + 1);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center">
        {title}
      </h2>
      <p className="text-center text-lg">{data.instruction}</p>
      <div className="flex justify-center">
        <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-literasi-100 text-7xl shadow-inner">
          {emojiForKey(current?.gambarKey ?? '')}
        </div>
      </div>
      <p className="text-center text-xl">{current?.gambarLabel}</p>
      <p className="text-center text-sm text-neutral-600">
        Pilih huruf yang sesuai dengan gambar.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {letters.map((h) => (
          <Button
            key={`${idx}-${h}`}
            variant="secondary"
            className="h-16 w-16 text-2xl"
            onClick={() => handleLetter(h)}
          >
            {h}
          </Button>
        ))}
      </div>
      <p className="text-center">
        Soal {idx + 1}/{pairs.length} · Salah: {mistakes}
      </p>
    </div>
  );
}

function SusunSukuKata({
  title,
  data,
  onDone,
}: {
  title: string;
  data: SusunPayload;
  onDone: (mistakes: number, score: number, maxScore: number) => void;
}) {
  const [qIdx, setQIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const q = data.questions[qIdx];
  const [slots, setSlots] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);

  useEffect(() => {
    const nq = data.questions[qIdx];
    const n = nq.targetKata.split(/\s+/).filter(Boolean).length;
    setSlots(Array(n).fill(''));
    setAvailable(shuffle([...nq.sukuKataKepingan]));
  }, [qIdx, data]);

  const placeChip = (chip: string) => {
    const idxChip = available.indexOf(chip);
    if (idxChip === -1) return;
    const empty = slots.findIndex((s) => s === '');
    if (empty === -1) return;

    const nextAvail = [...available];
    nextAvail.splice(idxChip, 1);
    setAvailable(nextAvail);

    const next = [...slots];
    next[empty] = chip;
    setSlots(next);

    if (next.every((s) => s !== '') && next.join(' ') === q.targetKata) {
      if (qIdx + 1 >= data.questions.length) {
        const maxScore = data.questions.length * 10;
        const score = (data.questions.length - mistakes) * 10;
        onDone(mistakes, score, maxScore);
      } else {
        setQIdx((i) => i + 1);
      }
    } else if (next.every((s) => s !== '') && next.join(' ') !== q.targetKata) {
      setMistakes((m) => m + 1);
      const n = q.targetKata.split(/\s+/).filter(Boolean).length;
      setSlots(Array(n).fill(''));
      setAvailable(shuffle([...q.sukuKataKepingan]));
    }
  };

  const removeSlot = (i: number) => {
    const chip = slots[i];
    if (!chip) return;
    const next = [...slots];
    next[i] = '';
    setSlots(next);
    setAvailable((av) => [...av, chip]);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center">
        {title}
      </h2>
      <p className="text-center text-lg">{data.instruction}</p>
      <div className="flex justify-center text-8xl">
        {emojiForKey(q.gambarKey)}
      </div>
      <p className="text-center text-xl font-semibold">{q.gambarLabel}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {slots.map((s, i) => (
          <button
            type="button"
            key={`slot-${i}-${s}`}
            className="flex h-16 min-w-[4.5rem] items-center justify-center rounded-xl border-2 border-dashed border-literasi-500 bg-white text-xl font-bold"
            onClick={() => s && removeSlot(i)}
          >
            {s || '—'}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {available.map((chip, i) => (
          <Button
            key={`${chip}-${i}`}
            variant="secondary"
            className="text-lg"
            onClick={() => placeChip(chip)}
          >
            {chip}
          </Button>
        ))}
      </div>
      <p className="text-center text-sm">
        Soal {qIdx + 1}/{data.questions.length} · Salah: {mistakes}
      </p>
    </div>
  );
}

function BacaKalimat({
  title,
  data,
  onDone,
}: {
  title: string;
  data: BacaPayload;
  onDone: (mistakes: number, score: number, maxScore: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const q = data.questions[idx];
  const [opts, setOpts] = useState<string[]>(() =>
    shuffle([q.gambarBenar, ...q.gambarSalah]),
  );

  useEffect(() => {
    const nq = data.questions[idx];
    setOpts(shuffle([nq.gambarBenar, ...nq.gambarSalah]));
  }, [idx, data.questions]);

  const pick = (key: string) => {
    const ok = key === q.gambarBenar;
    if (ok) {
      if (idx + 1 >= data.questions.length) {
        const maxScore = data.questions.length * 10;
        const score = (data.questions.length - mistakes) * 10;
        onDone(mistakes, score, maxScore);
      } else setIdx(idx + 1);
    } else setMistakes((m) => m + 1);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center">
        {title}
      </h2>
      <p className="text-center text-xl font-semibold">{q.kalimat}</p>
      <div className="grid grid-cols-3 gap-3">
        {opts.map((k) => (
          <button
            type="button"
            key={k}
            className="flex aspect-square flex-col items-center justify-center rounded-2xl bg-literasi-100 p-2 text-6xl shadow"
            onClick={() => pick(k)}
          >
            {emojiForKey(k)}
            <span className="mt-1 text-sm">{k}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-sm">
        Soal {idx + 1}/{data.questions.length} · Salah: {mistakes}
      </p>
    </div>
  );
}

function HitungBenda({
  title,
  data,
  onDone,
}: {
  title: string;
  data: HitungPayload;
  onDone: (mistakes: number, score: number, maxScore: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const q = data.questions[idx];

  const pick = (n: number) => {
    if (n === q.jawaban) {
      if (idx + 1 >= data.questions.length) {
        const maxScore = data.questions.length * 10;
        const score = (data.questions.length - mistakes) * 10;
        onDone(mistakes, score, maxScore);
      } else setIdx(idx + 1);
    } else setMistakes((m) => m + 1);
  };

  const icons = Array.from({ length: q.jumlah }, (_, i) => (
    <span key={i} className="text-5xl">
      {emojiForKey(q.bendaKey)}
    </span>
  ));

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center">
        {title}
      </h2>
      <p className="text-center text-lg">{data.instruction}</p>
      <div className="flex flex-wrap justify-center gap-2">{icons}</div>
      <div className="grid grid-cols-2 gap-3">
        {q.pilihan.map((n) => (
          <Button
            key={n}
            className="text-2xl"
            variant="secondary"
            onClick={() => pick(n)}
          >
            {n}
          </Button>
        ))}
      </div>
      <p className="text-center text-sm">
        Soal {idx + 1}/{data.questions.length} · Salah: {mistakes}
      </p>
    </div>
  );
}

function Bandingkan({
  title,
  data,
  onDone,
}: {
  title: string;
  data: BandingPayload;
  onDone: (mistakes: number, score: number, maxScore: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const q = data.questions[idx];

  const answer = (side: 'kiri' | 'kanan') => {
    if (side === q.jawaban) {
      if (idx + 1 >= data.questions.length) {
        const maxScore = data.questions.length * 10;
        const score = (data.questions.length - mistakes) * 10;
        onDone(mistakes, score, maxScore);
      } else setIdx(idx + 1);
    } else setMistakes((m) => m + 1);
  };

  const renderGroup = (side: 'kiri' | 'kanan') => {
    const g = side === 'kiri' ? q.kiri : q.kanan;
    return (
      <div className="flex flex-wrap justify-center gap-1">
        {Array.from({ length: g.jumlah }, (_, i) => (
          <span key={i} className="text-5xl">
            {emojiForKey(g.bendaKey)}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center">
        {title}
      </h2>
      <p className="text-center text-lg">{data.instruction}</p>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className="rounded-3xl bg-math-100 p-4 shadow-inner"
          onClick={() => answer('kiri')}
        >
          {renderGroup('kiri')}
        </button>
        <button
          type="button"
          className="rounded-3xl bg-literasi-100 p-4 shadow-inner"
          onClick={() => answer('kanan')}
        >
          {renderGroup('kanan')}
        </button>
      </div>
      <p className="text-center text-sm">
        Soal {idx + 1}/{data.questions.length} · Salah: {mistakes}
      </p>
    </div>
  );
}

function Penjumlahan({
  title,
  data,
  onDone,
}: {
  title: string;
  data: TambahPayload;
  onDone: (mistakes: number, score: number, maxScore: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const q = data.questions[idx];
  const jawaban = q.a + q.b;

  const pick = (n: number) => {
    if (n === jawaban) {
      if (idx + 1 >= data.questions.length) {
        const maxScore = data.questions.length * 10;
        const score = (data.questions.length - mistakes) * 10;
        onDone(mistakes, score, maxScore);
      } else setIdx(idx + 1);
    } else setMistakes((m) => m + 1);
  };

  const left = Array.from({ length: q.a }, (_, i) => (
    <span key={`a-${i}`} className="text-5xl">
      {emojiForKey(q.bendaKey)}
    </span>
  ));
  const right = Array.from({ length: q.b }, (_, i) => (
    <span key={`b-${i}`} className="text-5xl">
      {emojiForKey(q.bendaKey)}
    </span>
  ));

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center">
        {title}
      </h2>
      <p className="text-center text-lg">{data.instruction}</p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-5xl">
        <span>{left}</span>
        <span>+</span>
        <span>{right}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {q.pilihan.map((n) => (
          <Button
            key={n}
            variant="secondary"
            className="text-2xl"
            onClick={() => pick(n)}
          >
            {n}
          </Button>
        ))}
      </div>
      <p className="text-center text-sm">
        Soal {idx + 1}/{data.questions.length} · Salah: {mistakes}
      </p>
    </div>
  );
}

function Pengurangan({
  title,
  data,
  onDone,
}: {
  title: string;
  data: KurangPayload;
  onDone: (mistakes: number, score: number, maxScore: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const q = data.questions[idx];
  const jawaban = q.a - q.b;

  const pick = (n: number) => {
    if (n === jawaban) {
      if (idx + 1 >= data.questions.length) {
        const maxScore = data.questions.length * 10;
        const score = (data.questions.length - mistakes) * 10;
        onDone(mistakes, score, maxScore);
      } else setIdx(idx + 1);
    } else setMistakes((m) => m + 1);
  };

  const all = Array.from({ length: q.a }, (_, i) => (
    <span
      key={i}
      className={`text-5xl ${i >= q.a - q.b ? 'opacity-25 line-through' : ''}`}
    >
      {emojiForKey(q.bendaKey)}
    </span>
  ));

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center">
        {title}
      </h2>
      <p className="text-center text-lg">{data.instruction}</p>
      <div className="flex flex-wrap justify-center gap-2">{all}</div>
      <div className="grid grid-cols-2 gap-3">
        {q.pilihan.map((n) => (
          <Button
            key={n}
            variant="secondary"
            className="text-2xl"
            onClick={() => pick(n)}
          >
            {n}
          </Button>
        ))}
      </div>
      <p className="text-center text-sm">
        Soal {idx + 1}/{data.questions.length} · Salah: {mistakes}
      </p>
    </div>
  );
}
