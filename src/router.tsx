import { api } from '@/api';
import { adminApi } from '@/api-admin';
import { GameFeedbackSync } from '@/components/GameFeedbackSync';
import { Button } from '@/components/ui/Button';
import { ActivityPlayer } from '@/features/ActivityPlayer';
import { AdminActivityEditorPage } from '@/features/admin/AdminActivityEditorPage';
import { AdminAnalyticsPage } from '@/features/admin/AdminAnalyticsPage';
import { AdminAuditPage } from '@/features/admin/AdminAuditPage';
import { AdminBankEditorPage } from '@/features/admin/AdminBankEditorPage';
import { AdminChildDetailPage } from '@/features/admin/AdminChildDetailPage';
import { AdminContentPage } from '@/features/admin/AdminContentPage';
import { AdminImportExportPage } from '@/features/admin/AdminImportExportPage';
import { AdminSettingsPage } from '@/features/admin/AdminSettingsPage';
import { AdminShell } from '@/features/admin/AdminShell';
import { AdminUsersPage } from '@/features/admin/AdminUsersPage';
import { LoginPage as AdminLoginPage } from '@/features/admin/LoginPage';
import { SignupPage as AdminSignupPage } from '@/features/admin/SignupPage';
import { StickerAlbumPage } from '@/features/child/StickerAlbumPage';
import { OnboardingFlowPage } from '@/features/onboarding/OnboardingFlowPage';
import { SuperParentPage } from '@/features/parent/SuperParentPage';
import { PlayWellnessOverlay } from '@/features/wellness/PlayWellnessOverlay';
import { authClient } from '@/lib/auth-client';
import { BRAND_ADMIN, BRAND_APP } from '@/lib/brand';
import {
  type DevicePreferences,
  applyDevicePreferencesToGameFeedback,
} from '@/lib/game-feedback-sync';
import { lastChildIdAtom, parentSessionAtom } from '@/state/atoms';
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useNavigate,
  useRouterState,
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

function AppChrome({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: 'kids' | 'admin';
}) {
  return (
    <div
      className={
        variant === 'admin'
          ? 'min-h-dvh w-full max-w-none'
          : 'mx-auto min-h-dvh w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8'
      }
    >
      {children}
    </div>
  );
}

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith('/admin');

  return (
    <JotaiProvider>
      <GameFeedbackSync />
      <AppChrome variant={isAdmin ? 'admin' : 'kids'}>
        {!isAdmin ? (
          <header className="sticky top-0 z-10 flex items-center justify-between bg-[color:var(--color-canvas)]/95 py-3 backdrop-blur">
            <Link
              to="/"
              className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-primary-600)]"
            >
              {BRAND_APP}
            </Link>
            <Link
              to="/parent"
              className="rounded-full bg-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700"
            >
              Orang tua
            </Link>
          </header>
        ) : null}
        <Outlet />
      </AppChrome>
    </JotaiProvider>
  );
}

/** Sekali per profil anak — arahkan ke tutorial sebelum dashboard/track/play. */
function ensureChildOnboardingGate(opts: {
  location: { pathname: string };
  params: Record<string, string>;
}) {
  const { location, params } = opts;
  const childId = params.childId;
  if (!childId) return;
  if (location.pathname.includes('/onboarding')) return;
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(`onboarding-done-${childId}`)) {
    throw redirect({
      to: '/p/$childId/onboarding',
      params: { childId },
    });
  }
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [, setLast] = useAtom(lastChildIdAtom);
  const [name, setName] = useState('');
  const [avatarKey, setAvatarKey] = useState(AVATARS[0]);
  const [ageMode, setAgeMode] = useState<'TK' | 'SD1'>('TK');
  const [err, setErr] = useState<string | null>(null);

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
      navigate({ to: '/p/$childId', params: { childId: p.id } });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal membuat profil');
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-primary-100 to-amber-50 p-6 text-center sm:p-8">
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-primary-600)] sm:text-3xl">
          Mulai petualangan belajar
        </p>
        <p className="mt-2 text-balance text-lg text-neutral-700 sm:text-xl">
          Isi data di bawah—kami siapkan permainan yang pas untuk usia anak.
        </p>
      </div>

      <div className="rounded-3xl bg-white p-5 shadow-lg ring-1 ring-black/5 sm:p-6">
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

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/p/$childId/onboarding',
  component: OnboardingRoutePage,
});

function OnboardingRoutePage() {
  const { childId } = onboardingRoute.useParams();
  return <OnboardingFlowPage childId={childId} />;
}

const childRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/p/$childId',
  component: DashboardPage,
  beforeLoad: ensureChildOnboardingGate,
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

      <Link
        to="/p/$childId/stickers"
        params={{ childId }}
        className="block rounded-2xl bg-amber-50 p-4 text-center font-bold text-amber-900 shadow-inner ring-1 ring-amber-200"
      >
        Album stiker
      </Link>

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
  beforeLoad: ensureChildOnboardingGate,
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
  beforeLoad: ensureChildOnboardingGate,
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
  beforeLoad: ensureChildOnboardingGate,
});

const stickerAlbumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/p/$childId/stickers',
  component: StickerAlbumRoutePage,
  beforeLoad: ensureChildOnboardingGate,
});

function StickerAlbumRoutePage() {
  const { childId } = stickerAlbumRoute.useParams();
  return <StickerAlbumPage childId={childId} />;
}

function PlayPage() {
  const navigate = useNavigate();
  const { childId, activityId } = playRoute.useParams();
  const [act, setAct] = useState<Awaited<
    ReturnType<typeof api.getActivity>
  > | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState(0);
  const [wellness, setWellness] = useState<DevicePreferences | null>(null);

  useEffect(() => {
    api
      .getActivity(activityId)
      .then(setAct)
      .catch(() => setErr('Tidak dapat memuat aktivitas'));
  }, [activityId]);

  useEffect(() => {
    api
      .getDevicePreferences()
      .then(setWellness)
      .catch(() =>
        setWellness({
          dailyTimeCapMinutes: 30,
          breakReminderMinutes: 15,
          sfxEnabled: true,
          musicEnabled: true,
          reduceMotion: false,
        }),
      );
  }, []);

  if (err) return <p className="p-6 text-center text-red-600">{err}</p>;
  if (!act) return <p className="p-6 text-center">Memuat permainan…</p>;

  return (
    <div>
      {wellness ? (
        <PlayWellnessOverlay
          childId={childId}
          dailyCapMinutes={wellness.dailyTimeCapMinutes}
          breakReminderMinutes={wellness.breakReminderMinutes}
        />
      ) : null}
      <ActivityPlayer
        key={replayKey}
        activityType={act.type}
        payload={act.payload}
        title={act.title}
        instructionText={act.voiceOverKeys?.instruksi}
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

const parentSuperRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/parent/super',
  component: SuperParentPage,
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
  const [isSuperParent, setIsSuperParent] = useState(false);
  const [parentSettings, setParentSettings] = useState<{
    dailyTimeCapMinutes: number;
    breakReminderMinutes: number;
    musicEnabled: boolean;
    sfxEnabled: boolean;
    reduceMotion: boolean;
  } | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    api.getProfiles().then(setProfiles);
  }, []);

  useEffect(() => {
    if (!session) {
      setIsSuperParent(false);
      setParentSettings(null);
      return;
    }
    api
      .getParentSettings(session)
      .then((s) => {
        setIsSuperParent(s.isSuperParent);
        setParentSettings({
          dailyTimeCapMinutes: s.dailyTimeCapMinutes,
          breakReminderMinutes: s.breakReminderMinutes,
          musicEnabled: s.musicEnabled,
          sfxEnabled: s.sfxEnabled,
          reduceMotion: s.reduceMotion,
        });
      })
      .catch(() => {
        setIsSuperParent(false);
        setParentSettings(null);
      });
  }, [session]);

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

      {parentSettings ? (
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow">
          <p className="font-bold">Pengaturan perangkat</p>
          <p className="text-xs text-neutral-600">
            Batas waktu & pengingat istirahat berlaku saat anak bermain (sesi
            terpasang).
          </p>
          <label className="block text-sm">
            <span className="text-neutral-700">
              Batas main harian: {parentSettings.dailyTimeCapMinutes} menit
            </span>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              className="mt-1 w-full"
              value={parentSettings.dailyTimeCapMinutes}
              onChange={(e) =>
                setParentSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        dailyTimeCapMinutes: Number(e.target.value),
                      }
                    : prev,
                )
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-neutral-700">
              Pengingat istirahat tiap: {parentSettings.breakReminderMinutes}{' '}
              menit
            </span>
            <input
              type="range"
              min={5}
              max={45}
              step={5}
              className="mt-1 w-full"
              value={parentSettings.breakReminderMinutes}
              onChange={(e) =>
                setParentSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        breakReminderMinutes: Number(e.target.value),
                      }
                    : prev,
                )
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={parentSettings.musicEnabled}
              onChange={(e) =>
                setParentSettings((prev) =>
                  prev ? { ...prev, musicEnabled: e.target.checked } : prev,
                )
              }
            />
            Musik latar
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={parentSettings.sfxEnabled}
              onChange={(e) =>
                setParentSettings((prev) =>
                  prev ? { ...prev, sfxEnabled: e.target.checked } : prev,
                )
              }
            />
            Efek suara (jawaban benar/salah)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={parentSettings.reduceMotion}
              onChange={(e) =>
                setParentSettings((prev) =>
                  prev ? { ...prev, reduceMotion: e.target.checked } : prev,
                )
              }
            />
            Kurangi animasi (motion reduce)
          </label>
          <Button
            className="w-full"
            onClick={async () => {
              if (!session || !parentSettings) return;
              setSettingsSaved(false);
              try {
                await api.patchParentSettings(session, parentSettings);
                applyDevicePreferencesToGameFeedback({
                  dailyTimeCapMinutes: parentSettings.dailyTimeCapMinutes,
                  breakReminderMinutes: parentSettings.breakReminderMinutes,
                  sfxEnabled: parentSettings.sfxEnabled,
                  musicEnabled: parentSettings.musicEnabled,
                  reduceMotion: parentSettings.reduceMotion,
                });
                setSettingsSaved(true);
              } catch {
                setErr('Gagal menyimpan pengaturan');
              }
            }}
          >
            Simpan pengaturan
          </Button>
          {settingsSaved ? (
            <p className="text-center text-sm text-green-700">Tersimpan.</p>
          ) : null}
        </div>
      ) : null}

      <Button variant="ghost" onClick={() => setSession(null)}>
        Keluar sesi
      </Button>
      {isSuperParent ? (
        <Link
          to="/parent/super"
          className="block w-full rounded-xl border border-primary-200 bg-primary-50 py-3 text-center text-sm font-semibold text-primary-800"
        >
          Mode super-orang tua — kelola profil anak
        </Link>
      ) : null}
      <a href="/">Ke beranda anak</a>
    </div>
  );
}

// === Admin Routes ===

function AdminDashboardPage() {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof adminApi.getOverview>
  > | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getOverview()
      .then(setData)
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : 'Gagal memuat ringkasan'),
      );
  }, []);

  const r1 =
    data?.retentionD1Pct == null
      ? '—'
      : `${data.retentionD1Pct}% · n=${data.retentionCohortD1}`;
  const r7 =
    data?.retentionD7Pct == null
      ? '—'
      : `${data.retentionD7Pct}% · n=${data.retentionCohortD7}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="mt-1 text-neutral-600">
          Lima metrik utama MVP + ringkasan pengguna.
        </p>
        {data?._cached ? (
          <p className="mt-1 text-xs text-neutral-400">
            Angka dari cache (≤5 menit).
          </p>
        ) : null}
      </div>
      {err ? <p className="text-red-600 text-sm">{err}</p> : null}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Metrik utama (PRD §7)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <DashCard label="DAU (hari ini)" value={data?.dauToday} />
          <DashCard label="MAU (30 hari)" value={data?.mau30d} />
          <DashCard label="Retensi D1" value={r1} />
          <DashCard label="Retensi D7" value={r7} />
          <DashCard
            label="Total waktu main"
            value={
              data != null ? `${data.totalPlayTimeMinutes} menit` : undefined
            }
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Ringkasan
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DashCard label="Total anak" value={data?.totalAnak} />
          <DashCard label="Total sesi main" value={data?.totalSessions} />
          <DashCard
            label="Rata-rata bintang (global)"
            value={data?.avgStarsGlobal}
          />
        </div>
      </section>

      <p className="text-sm text-neutral-500">
        Tabel penyelesaian level & bintang per aktivitas ada di halaman{' '}
        <Link
          to="/admin/analytics"
          className="font-medium text-primary-600 hover:underline"
        >
          Analytics
        </Link>
        .
      </p>
      <p className="italic text-neutral-500">
        Selamat datang di {BRAND_ADMIN}.
      </p>
    </div>
  );
}

function DashCard({
  label,
  value,
}: {
  label: string;
  value: string | number | undefined;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tabular-nums">
        {value === undefined ? '…' : String(value)}
      </p>
    </div>
  );
}

function AdminChildrenPage() {
  const [rows, setRows] = useState<
    Awaited<ReturnType<typeof adminApi.getChildren>>
  >([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getChildren()
      .then(setRows)
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : 'Gagal memuat daftar anak'),
      );
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manajemen Anak</h1>
      <p className="text-neutral-600">
        Daftar profil anak di perangkat ini (sumber:{' '}
        <code className="rounded bg-neutral-100 px-1">
          GET /api/admin/children
        </code>
        ).
      </p>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Mode</th>
              <th className="px-4 py-3 font-semibold">Avatar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-neutral-50">
                <td className="px-4 py-3">
                  <Link
                    to="/admin/children/$childId"
                    params={{ childId: p.id }}
                    className="font-medium text-primary-600 hover:underline"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.ageMode}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.avatarKey}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!err && rows.length === 0 ? (
          <p className="px-4 py-6 text-center text-neutral-400">
            Belum ada profil anak.
          </p>
        ) : null}
      </div>
    </div>
  );
}

const adminRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminShell,
  beforeLoad: async ({ location }) => {
    // Only redirect to login if not already on login page
    const session = await authClient.getSession();
    if (
      !session &&
      location.pathname !== '/admin/login' &&
      location.pathname !== '/admin/signup'
    ) {
      throw redirect({ to: '/admin/login' });
    }
  },
});

const adminLoginRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/login',
  component: AdminLoginPage,
});

const adminSignupRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/signup',
  component: AdminSignupPage,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/',
  component: AdminDashboardPage,
});

const adminChildrenRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/children',
  component: AdminChildrenPage,
});

const adminChildDetailRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/children/$childId',
  component: AdminChildDetailShell,
});

function AdminChildDetailShell() {
  const { childId } = adminChildDetailRoute.useParams();
  return <AdminChildDetailPage childId={childId} />;
}

const adminAuditRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/audit',
  component: AdminAuditPage,
});

const adminContentRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/content',
  component: AdminContentPage,
});

const adminActivityDetailRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/content/activities/$activityId',
  component: AdminActivityDetailShell,
});

function AdminActivityDetailShell() {
  const { activityId } = adminActivityDetailRoute.useParams();
  return <AdminActivityEditorPage activityId={activityId} />;
}

const adminBankRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/banks/$activityId',
  component: AdminBankShell,
});

function AdminBankShell() {
  const { activityId } = adminBankRoute.useParams();
  return <AdminBankEditorPage activityId={activityId} />;
}

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/analytics',
  component: AdminAnalyticsPage,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/settings',
  component: AdminSettingsPage,
});

const adminImportExportRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/import-export',
  component: AdminImportExportPage,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/users',
  component: AdminUsersPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  onboardingRoute,
  childRoute,
  trackRoute,
  levelDetailRoute,
  playRoute,
  stickerAlbumRoute,
  parentRoute,
  parentSuperRoute,
  adminRootRoute.addChildren([
    adminIndexRoute,
    adminLoginRoute,
    adminSignupRoute,
    adminChildrenRoute,
    adminChildDetailRoute,
    adminAuditRoute,
    adminContentRoute,
    adminActivityDetailRoute,
    adminBankRoute,
    adminAnalyticsRoute,
    adminSettingsRoute,
    adminImportExportRoute,
    adminUsersRoute,
  ]),
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
