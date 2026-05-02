import { api } from '@/api';
import { Button } from '@/components/ui/Button';
import { ActivityPlayer } from '@/features/ActivityPlayer';
import { lastChildIdAtom, parentSessionAtom } from '@/state/atoms';
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from '@tanstack/react-router';
import { Provider as JotaiProvider } from 'jotai';
import { useAtom } from 'jotai/react';
import { useEffect, useState } from 'react';

const AVATARS = [
  'panda',
  'cat',
  'dog',
  'rabbit',
  'lion',
  'frog',
  'bear',
  'fox',
];

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-dvh max-w-lg pb-10">{children}</div>;
}

const rootRoute = createRootRoute({
  component: () => (
    <JotaiProvider>
      <Shell>
        <header className="sticky top-0 z-10 flex items-center justify-between bg-[color:var(--color-canvas)]/95 px-4 py-3 backdrop-blur">
          <Link
            to="/"
            className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-primary-600)]"
          >
            Bimo Belajar
          </Link>
          <Link
            to="/parent"
            className="rounded-full bg-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700"
          >
            Orang tua
          </Link>
        </header>
        <Outlet />
      </Shell>
    </JotaiProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [, setLast] = useAtom(lastChildIdAtom);
  const [profiles, setProfiles] = useState<
    Array<{ id: string; name: string; avatarKey: string; ageMode: string }>
  >([]);
  const [name, setName] = useState('');
  const [avatarKey, setAvatarKey] = useState(AVATARS[0]);
  const [ageMode, setAgeMode] = useState<'TK' | 'SD1'>('TK');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getProfiles()
      .then(setProfiles)
      .catch(() => setErr('Gagal memuat profil'))
      .finally(() => setLoading(false));
  }, []);

  const create = async () => {
    setErr(null);
    try {
      const p = await api.createProfile({
        name: name.trim() || 'Anak',
        avatarKey,
        ageMode,
      });
      setLast(p.id);
      setName('');
      setProfiles(await api.getProfiles());
      navigate({ to: '/p/$childId', params: { childId: p.id } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal membuat profil');
    }
  };

  return (
    <div className="space-y-6 px-4">
      <div className="rounded-3xl bg-primary-100 p-6 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-primary-600)]">
          Halo!
        </p>
        <p className="mt-2 text-lg">
          Pilih profil atau buat baru untuk mulai belajar.
        </p>
      </div>

      {loading ? (
        <p className="text-center">Memuat…</p>
      ) : (
        <div className="grid gap-3">
          {profiles.map((p) => (
            <a
              key={p.id}
              href={`/p/${p.id}`}
              onClick={() => setLast(p.id)}
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5"
            >
              <span className="text-4xl">{emojiAvatar(p.avatarKey)}</span>
              <div>
                <p className="text-xl font-bold">{p.name}</p>
                <p className="text-sm text-neutral-600">
                  {p.ageMode === 'TK' ? 'TK' : 'SD kelas 1'}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="rounded-3xl bg-white p-5 shadow-lg ring-1 ring-black/5">
        <p className="mb-3 font-semibold">Buat profil baru</p>
        <label htmlFor="child-name" className="block text-sm font-medium">
          Nama panggilan
        </label>
        <input
          id="child-name"
          className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-lg"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Lala"
          maxLength={20}
        />
        <p className="mt-3 text-sm font-medium">Avatar</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              className={`rounded-xl border-2 p-2 text-3xl ${avatarKey === a ? 'border-primary-500' : 'border-transparent'}`}
              onClick={() => setAvatarKey(a)}
            >
              {emojiAvatar(a)}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm font-medium">Mode</p>
        <div className="mt-2 flex gap-2">
          <Button
            variant={ageMode === 'TK' ? 'primary' : 'secondary'}
            onClick={() => setAgeMode('TK')}
          >
            TK (4–6 th)
          </Button>
          <Button
            variant={ageMode === 'SD1' ? 'primary' : 'secondary'}
            onClick={() => setAgeMode('SD1')}
          >
            SD kelas 1
          </Button>
        </div>
        {err ? <p className="mt-2 text-red-600">{err}</p> : null}
        <div className="mt-4">
          <Button className="w-full" onClick={create}>
            Simpan & mulai
          </Button>
        </div>
      </div>
    </div>
  );
}

function emojiAvatar(key: string): string {
  const m: Record<string, string> = {
    panda: '🐼',
    cat: '🐱',
    dog: '🐶',
    rabbit: '🐰',
    lion: '🦁',
    frog: '🐸',
    bear: '🐻',
    fox: '🦊',
  };
  return m[key] ?? '🙂';
}

const childRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/p/$childId',
  component: DashboardPage,
});

function DashboardPage() {
  const { childId } = childRoute.useParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDashboard(childId)
      .then(setData)
      .catch(() => setErr('Gagal memuat'));
  }, [childId]);

  if (err) return <p className="p-6 text-center text-red-600">{err}</p>;
  if (!data) return <p className="p-6 text-center">Memuat…</p>;

  const child = data.child as { name: string; avatarKey: string };
  const totalXp = data.totalXp as number;
  const streak = data.streak as { current: number };
  const quests = (data.todayQuests ?? []) as Array<{
    activityId: string;
    activityTitle: string;
    track: string;
  }>;

  return (
    <div className="space-y-5 px-4">
      <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow">
        <span className="text-5xl">{emojiAvatar(child.avatarKey)}</span>
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold">
            {child.name}
          </p>
          <p className="text-neutral-600">
            XP: <strong>{totalXp}</strong> · Streak:{' '}
            <strong>{streak.current}</strong> hari
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={`/p/${childId}/track/literasi`}
          className="rounded-2xl bg-literasi-100 p-4 text-center font-bold shadow-inner"
        >
          Literasi
        </a>
        <a
          href={`/p/${childId}/track/math`}
          className="rounded-2xl bg-math-100 p-4 text-center font-bold shadow-inner"
        >
          Matematika
        </a>
      </div>

      <div>
        <p className="mb-2 font-semibold">Quest hari ini</p>
        <div className="space-y-2">
          {quests.length === 0 ? (
            <p className="text-neutral-600">Semua quest selesai — keren!</p>
          ) : (
            quests.map((q) => (
              <a
                key={q.activityId}
                href={`/p/${childId}/play/${q.activityId}`}
                className="block rounded-2xl bg-white p-4 shadow ring-1 ring-black/5"
              >
                <span className="font-semibold">{q.activityTitle}</span>
                <span className="ml-2 text-sm text-neutral-500">
                  {q.track === 'literasi' ? 'Literasi' : 'Matematika'}
                </span>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const trackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/p/$childId/track/$trackId',
  component: TrackPage,
});

function TrackPage() {
  const { childId, trackId } = trackRoute.useParams();
  const [levels, setLevels] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.getLevels(childId, trackId).then(setLevels);
  }, [childId, trackId]);

  return (
    <div className="space-y-3 px-4">
      <a
        href={`/p/${childId}`}
        className="text-sm font-semibold text-primary-600"
      >
        ← Kembali
      </a>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        {trackId === 'literasi' ? 'Literasi' : 'Matematika'}
      </h1>
      <div className="space-y-2">
        {levels.map((lv) => (
          <div
            key={String(lv.id)}
            className={`rounded-2xl p-4 shadow ${
              lv.isUnlocked ? 'bg-white' : 'bg-neutral-100 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">
                  Level {String(lv.order)} — {String(lv.title)}
                </p>
                <p className="text-sm text-neutral-600">
                  {String(lv.progressPct)}% selesai
                </p>
              </div>
              {lv.isUnlocked ? (
                <a
                  className="rounded-xl bg-primary-500 px-3 py-2 text-sm font-semibold text-white"
                  href={`/p/${childId}/level/${String(lv.id)}`}
                >
                  Buka
                </a>
              ) : (
                <span className="text-sm">Terkunci</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const levelDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/p/$childId/level/$levelId',
  component: LevelDetailPage,
});

function LevelDetailPage() {
  const { childId, levelId } = levelDetailRoute.useParams();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.getLevelDetail(childId, levelId).then(setData);
  }, [childId, levelId]);

  if (!data) return <p className="p-6 text-center">Memuat…</p>;

  const acts =
    (data.activities as Array<{
      id: string;
      title: string;
      bestStars: number;
    }>) ?? [];

  return (
    <div className="space-y-4 px-4">
      <a
        href={`/p/${childId}`}
        className="text-sm font-semibold text-primary-600"
      >
        ← Dashboard
      </a>
      <h1 className="text-2xl font-bold">{String(data.title)}</h1>
      <div className="space-y-2">
        {acts.map((a) => (
          <a
            key={a.id}
            href={`/p/${childId}/play/${a.id}`}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow"
          >
            <span className="font-semibold">{a.title}</span>
            <span className="text-yellow-600">
              {'⭐'.repeat(Math.min(3, a.bestStars))}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/p/$childId/play/$activityId',
  component: PlayPage,
});

function PlayPage() {
  const navigate = useNavigate();
  const { childId, activityId } = playRoute.useParams();
  const [act, setAct] = useState<Awaited<
    ReturnType<typeof api.getActivity>
  > | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    api
      .getActivity(activityId)
      .then(setAct)
      .catch(() => setErr('Tidak dapat memuat aktivitas'));
  }, [activityId]);

  if (err) return <p className="p-6 text-center text-red-600">{err}</p>;
  if (!act) return <p className="p-6 text-center">Memuat permainan…</p>;

  return (
    <div>
      <ActivityPlayer
        key={replayKey}
        activityType={act.type}
        payload={act.payload}
        title={act.title}
        onComplete={async (r) => {
          try {
            const res = await api.submitActivity(childId, activityId, {
              score: r.score,
              maxScore: r.maxScore,
              mistakes: r.mistakes,
              durationSec: r.durationSec,
            });
            setResult(res);
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'Gagal menyimpan');
          }
        }}
      />
      {result ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">
            <p className="font-[family-name:var(--font-display)] text-3xl font-bold text-primary-600">
              Hebat!
            </p>
            <p className="mt-2 text-lg">
              Bintang: {'⭐'.repeat(Number(result.stars ?? 0))}
            </p>
            <p className="text-neutral-600">
              +{String(result.xpEarned ?? 0)} XP
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => {
                  navigate({ to: '/p/$childId', params: { childId } });
                }}
              >
                Ke beranda
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setResult(null);
                  setReplayKey((k) => k + 1);
                }}
              >
                Main lagi
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const parentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/parent',
  component: ParentPage,
});

function ParentPage() {
  const [session, setSession] = useAtom(parentSessionAtom);
  const [pin, setPin] = useState('');
  const [profiles, setProfiles] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [step, setStep] = useState<'gate' | 'setup' | 'app'>('gate');
  const [recoverQ, setRecoverQ] = useState('Siapa nama hewan peliharaanmu?');
  const [recoverA, setRecoverA] = useState('');
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.getProfiles().then(setProfiles);
  }, []);

  const verify = async () => {
    setErr(null);
    try {
      const res = await api.verifyPin(pin);
      setSession(res.sessionToken);
      setStep('app');
      setPin('');
    } catch {
      setErr('PIN salah atau belum diatur. Coba setup PIN baru.');
    }
  };

  const setup = async () => {
    setErr(null);
    try {
      const res = await api.setupPin({
        pin,
        recoveryQuestion: recoverQ,
        recoveryAnswer: recoverA,
      });
      setSession(res.sessionToken);
      setStep('app');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan PIN');
    }
  };

  const loadReport = async (childId: string) => {
    if (!session) return;
    const r = await api.getReport(session, childId);
    setReport(r);
  };

  if (step === 'gate') {
    return (
      <div className="space-y-4 px-4">
        <h1 className="text-2xl font-bold">Area orang tua</h1>
        <p className="text-neutral-600">Masukkan PIN 4 digit.</p>
        <input
          inputMode="numeric"
          className="w-full rounded-xl border px-3 py-3 text-2xl tracking-widest"
          maxLength={4}
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
          }
        />
        {err ? <p className="text-red-600">{err}</p> : null}
        <Button className="w-full" onClick={verify}>
          Masuk
        </Button>
        <button
          type="button"
          className="w-full text-sm text-primary-600"
          onClick={() => setStep('setup')}
        >
          Setup PIN pertama kali
        </button>
        <a href="/" className="block text-center text-sm text-neutral-600">
          Kembali
        </a>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="space-y-3 px-4">
        <h1 className="text-2xl font-bold">Buat PIN</h1>
        <input
          inputMode="numeric"
          placeholder="PIN 4 digit"
          className="w-full rounded-xl border px-3 py-3 text-2xl"
          maxLength={4}
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
          }
        />
        <input
          className="w-full rounded-xl border px-3 py-2"
          value={recoverQ}
          onChange={(e) => setRecoverQ(e.target.value)}
        />
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Jawaban singkat"
          value={recoverA}
          onChange={(e) => setRecoverA(e.target.value)}
        />
        {err ? <p className="text-red-600">{err}</p> : null}
        <Button className="w-full" onClick={setup}>
          Simpan
        </Button>
        <button
          type="button"
          className="text-sm text-primary-600"
          onClick={() => setStep('gate')}
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4">
      <h1 className="text-2xl font-bold">Laporan</h1>
      <p className="text-sm text-neutral-600">
        Sesi aktif. Pilih anak untuk ringkasan.
      </p>
      <div className="space-y-2">
        {profiles.map((p) => (
          <Button
            key={p.id}
            variant="secondary"
            className="w-full"
            onClick={() => loadReport(p.id)}
          >
            {p.name}
          </Button>
        ))}
      </div>
      {report ? (
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="font-bold">Total XP: {String(report.totalXp ?? '')}</p>
          <p className="text-sm text-neutral-600">
            Aktivitas selesai: {String(report.totalActivitiesCompleted ?? '')}
          </p>
        </div>
      ) : null}
      <Button variant="ghost" onClick={() => setSession(null)}>
        Keluar sesi
      </Button>
      <a href="/">Ke beranda anak</a>
    </div>
  );
}

const routeTree = rootRoute.addChildren([
  indexRoute,
  childRoute,
  trackRoute,
  levelDetailRoute,
  playRoute,
  parentRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
