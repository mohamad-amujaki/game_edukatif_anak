import { api } from '@/api';
import { GameFeedbackSync } from '@/components/GameFeedbackSync';
import { LocaleSelect } from '@/components/LocaleSelect';
import { MascotLottie } from '@/components/MascotLottie';
import { PwaPrompts } from '@/components/PwaPrompts';
import { Button } from '@/components/ui/Button';
import { HomeLanding } from '@/features/home/HomeLanding';
import { ParentLoginPage } from '@/features/parent-auth/ParentLoginPage';
import { ParentSignupPage } from '@/features/parent-auth/ParentSignupPage';
import { SuperParentPage } from '@/features/parent/SuperParentPage';
import { PlayWellnessOverlay } from '@/features/wellness/PlayWellnessOverlay';
import { authClient } from '@/lib/auth-client';
import { BRAND_APP } from '@/lib/brand';
import {
  type DevicePreferences,
  applyDevicePreferencesToGameFeedback,
} from '@/lib/game-feedback-sync';
import { isStaffAdminRole } from '@/lib/parent-app-roles';
import { parentSessionAtom } from '@/state/atoms';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Suspense, lazy, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const ActivityPlayer = lazy(() =>
  import('@/features/ActivityPlayer').then((m) => ({
    default: m.ActivityPlayer,
  })),
);
const OnboardingFlowPage = lazy(() =>
  import('@/features/onboarding/OnboardingFlowPage').then((m) => ({
    default: m.OnboardingFlowPage,
  })),
);
const StickerAlbumPage = lazy(() =>
  import('@/features/child/StickerAlbumPage').then((m) => ({
    default: m.StickerAlbumPage,
  })),
);
const AdminShell = lazy(() =>
  import('@/features/admin/AdminShell').then((m) => ({
    default: m.AdminShell,
  })),
);
const AdminLoginPage = lazy(() =>
  import('@/features/admin/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const AdminSignupPage = lazy(() =>
  import('@/features/admin/SignupPage').then((m) => ({
    default: m.SignupPage,
  })),
);
const AdminDashboardRoutePage = lazy(
  () => import('@/features/admin/AdminDashboardRoutePage'),
);
const AdminChildrenRoutePage = lazy(
  () => import('@/features/admin/AdminChildrenRoutePage'),
);
const AdminChildDetailPage = lazy(() =>
  import('@/features/admin/AdminChildDetailPage').then((m) => ({
    default: m.AdminChildDetailPage,
  })),
);
const AdminAuditPage = lazy(() =>
  import('@/features/admin/AdminAuditPage').then((m) => ({
    default: m.AdminAuditPage,
  })),
);
const AdminContentPage = lazy(() =>
  import('@/features/admin/AdminContentPage').then((m) => ({
    default: m.AdminContentPage,
  })),
);
const AdminActivityEditorPage = lazy(() =>
  import('@/features/admin/AdminActivityEditorPage').then((m) => ({
    default: m.AdminActivityEditorPage,
  })),
);
const AdminTwoFactorPage = lazy(() =>
  import('@/features/admin/AdminTwoFactorPage').then((m) => ({
    default: m.AdminTwoFactorPage,
  })),
);
const AdminActivityPreviewPage = lazy(() =>
  import('@/features/admin/AdminActivityPreviewPage').then((m) => ({
    default: m.AdminActivityPreviewPage,
  })),
);
const AdminBankEditorPage = lazy(() =>
  import('@/features/admin/AdminBankEditorPage').then((m) => ({
    default: m.AdminBankEditorPage,
  })),
);
const AdminAnalyticsPage = lazy(() =>
  import('@/features/admin/AdminAnalyticsPage').then((m) => ({
    default: m.AdminAnalyticsPage,
  })),
);
const AdminSettingsPage = lazy(() =>
  import('@/features/admin/AdminSettingsPage').then((m) => ({
    default: m.AdminSettingsPage,
  })),
);
const AdminImportExportPage = lazy(() =>
  import('@/features/admin/AdminImportExportPage').then((m) => ({
    default: m.AdminImportExportPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import('@/features/admin/AdminUsersPage').then((m) => ({
    default: m.AdminUsersPage,
  })),
);

function AdminSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-neutral-600">
          Memuat panel…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function KidSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={<p className="p-6 text-center text-neutral-600">Memuat…</p>}
    >
      {children}
    </Suspense>
  );
}

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
  const { t } = useTranslation('common');

  return (
    <JotaiProvider>
      <GameFeedbackSync />
      <PwaPrompts />
      <AppChrome variant={isAdmin ? 'admin' : 'kids'}>
        {!isAdmin ? (
          <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 bg-[color:var(--color-canvas)]/95 py-3 backdrop-blur">
            <Link
              to="/"
              className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-primary-600)]"
            >
              {BRAND_APP}
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <LocaleSelect />
              <Link
                to="/parent"
                className="rounded-full bg-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-700"
              >
                {t('nav.parent')}
              </Link>
            </div>
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

function ParentAuthSignUpStandalone() {
  const navigate = useNavigate();
  return <ParentSignupPage onBack={() => navigate({ to: '/' })} />;
}

function ParentAuthSignInStandalone() {
  const navigate = useNavigate();
  return <ParentLoginPage onBack={() => navigate({ to: '/' })} />;
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomeLanding,
});

const authSignUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/sign-up',
  component: ParentAuthSignUpStandalone,
});

const authSignInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/sign-in',
  component: ParentAuthSignInStandalone,
});

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
  return (
    <KidSuspense>
      <OnboardingFlowPage childId={childId} />
    </KidSuspense>
  );
}

const childRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/p/$childId',
  component: DashboardPage,
  beforeLoad: ensureChildOnboardingGate,
});

function DashboardPage() {
  const { childId } = childRoute.useParams();
  const { data, error, isPending } = useQuery({
    queryKey: ['dashboard', childId],
    queryFn: () => api.getDashboard(childId),
  });

  if (error)
    return <p className="p-6 text-center text-red-600">Gagal memuat</p>;
  if (isPending || !data) return <p className="p-6 text-center">Memuat…</p>;

  const child = data.child as { name: string; avatarKey: string };
  const totalXp = data.totalXp as number;
  const streak = data.streak as { current: number };
  const quests = (data.todayQuests ?? []) as Array<{
    activityId: string;
    activityTitle: string;
    track: string;
  }>;
  const weeklyQuest = data.weeklyQuest as
    | {
        distinctActivitiesThisWeek: number;
        target: number;
        bonusXpClaimedThisWeek: boolean;
      }
    | undefined;

  return (
    <div className="space-y-5 px-4">
      <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow">
        <MascotLottie state="idle" className="h-16 w-16 shrink-0" />
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

      {weeklyQuest ? (
        <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
          <p className="font-semibold">Quest mingguan</p>
          <p className="mt-1 text-sm text-neutral-600">
            Selesaikan {weeklyQuest.target} aktivitas berbeda (≥1★) minggu ini
            untuk +25 XP dan stiker langka.
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-primary-500 transition-[width]"
              style={{
                width: `${Math.min(100, (weeklyQuest.distinctActivitiesThisWeek / weeklyQuest.target) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-sm font-medium text-neutral-800">
            {weeklyQuest.distinctActivitiesThisWeek}/{weeklyQuest.target}{' '}
            aktivitas
            {weeklyQuest.bonusXpClaimedThisWeek ? (
              <span className="ml-2 text-emerald-600">
                · Bonus minggu diambil
              </span>
            ) : null}
          </p>
        </div>
      ) : null}

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
  const { data: levels = [] } = useQuery({
    queryKey: ['levels', childId, trackId],
    queryFn: () => api.getLevels(childId, trackId),
  });

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
  const { data, isPending } = useQuery({
    queryKey: ['levelDetail', childId, levelId],
    queryFn: () => api.getLevelDetail(childId, levelId),
  });

  if (isPending || !data) return <p className="p-6 text-center">Memuat…</p>;

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
  return (
    <KidSuspense>
      <StickerAlbumPage childId={childId} />
    </KidSuspense>
  );
}

function PlayPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { childId, activityId } = playRoute.useParams();
  const {
    data: act,
    error: loadErr,
    isPending: actPending,
  } = useQuery({
    queryKey: ['activity', activityId, childId],
    queryFn: () => api.getActivity(activityId, childId),
  });

  const { data: wellness } = useQuery({
    queryKey: ['devicePreferences'],
    queryFn: () => api.getDevicePreferences(),
    staleTime: 120_000,
    retry: 1,
  });

  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState(0);

  const overlayPrefs: DevicePreferences | null =
    wellness ??
    ({
      dailyTimeCapMinutes: 30,
      breakReminderMinutes: 15,
      sfxEnabled: true,
      musicEnabled: true,
      reduceMotion: false,
    } as DevicePreferences);

  if (loadErr)
    return (
      <p className="p-6 text-center text-red-600">
        Tidak dapat memuat aktivitas
      </p>
    );
  if (actPending || !act)
    return <p className="p-6 text-center">Memuat permainan…</p>;

  return (
    <div>
      <PlayWellnessOverlay
        childId={childId}
        dailyCapMinutes={overlayPrefs.dailyTimeCapMinutes}
        breakReminderMinutes={overlayPrefs.breakReminderMinutes}
      />
      {err ? (
        <p className="px-4 py-2 text-center text-sm text-red-600">{err}</p>
      ) : null}
      <KidSuspense>
        <ActivityPlayer
          key={replayKey}
          activityType={act.type}
          payload={act.payload}
          title={act.title}
          voiceOver={act.voiceOverKeys}
          mathQuestionCount={act.sessionQuestionCount}
          onComplete={async (r) => {
            try {
              const res = await api.submitActivity(childId, activityId, {
                score: r.score,
                maxScore: r.maxScore,
                mistakes: r.mistakes,
                durationSec: r.durationSec,
              });
              setErr(null);
              setResult(res);
              void queryClient.invalidateQueries({
                queryKey: ['dashboard', childId],
              });
              void queryClient.invalidateQueries({
                queryKey: ['levels', childId],
              });
              void queryClient.invalidateQueries({
                queryKey: ['stickers', childId],
              });
            } catch (e) {
              setErr(e instanceof Error ? e.message : 'Gagal menyimpan');
            }
          }}
        />
      </KidSuspense>
      {result ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl">
            <MascotLottie
              state="celebrate"
              className="mx-auto mb-2 h-24 w-24"
            />
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
                  setErr(null);
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
  const queryClient = useQueryClient();
  const [session, setSession] = useAtom(parentSessionAtom);
  const { data: accountSession } = authClient.useSession();
  const parentAccountLoggedIn = Boolean(
    accountSession?.user && !isStaffAdminRole(accountSession.user.role),
  );
  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [step, setStep] = useState<
    'gate' | 'setup' | 'app' | 'forgot' | 'forgot-new'
  >('gate');
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => api.getProfiles(),
    enabled: step === 'app',
  });
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [recoverQ, setRecoverQ] = useState('Siapa nama hewan peliharaanmu?');
  const [recoverA, setRecoverA] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');
  const [forgotQuestion, setForgotQuestion] = useState('');
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const [forgotPin, setForgotPin] = useState('');
  const [forgotRecoverQ, setForgotRecoverQ] = useState(
    'Siapa nama hewan peliharaanmu?',
  );
  const [forgotRecoverA, setForgotRecoverA] = useState('');
  const [parentEmailDraft, setParentEmailDraft] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pinIsSet, setPinIsSet] = useState<boolean | null>(null);
  const [isSuperParent, setIsSuperParent] = useState(false);
  const [parentSettings, setParentSettings] = useState<{
    dailyTimeCapMinutes: number;
    breakReminderMinutes: number;
    musicEnabled: boolean;
    sfxEnabled: boolean;
    reduceMotion: boolean;
    parentEmailMasked: string | null;
    weeklyEmailOptIn: boolean;
  } | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [parentDashboard, setParentDashboard] = useState<{
    totalChildren: number;
    activeChildren7d: number;
    retention7dPct: number;
    totalActivitiesCompleted: number;
    totalPlayMinutes: number;
    averageStars: number;
    levelCompletionPct: number;
    perTrack: Array<{ track: 'literasi' | 'math'; averageStars: number }>;
    childSummaries: Array<{
      id: string;
      name: string;
      ageMode: string;
      createdAt: string;
      totalXp: number;
      totalActivitiesCompleted: number;
      totalPlayMinutes: number;
      averageStars: number;
      active7d: boolean;
      levelCompletionPct: number;
    }>;
  } | null>(null);

  useEffect(() => {
    if (step !== 'gate') return;
    api
      .getPinStatus()
      .then((s) => setPinIsSet(s.pinIsSet))
      .catch(() => setPinIsSet(false));
  }, [step]);

  useEffect(() => {
    if (step !== 'forgot') return;
    setErr(null);
    setForgotAnswer('');
    void api
      .getRecoveryQuestion()
      .then((d) => setForgotQuestion(d.question))
      .catch(() => {
        setForgotQuestion('');
        setErr('Pemulihan tidak tersedia (PIN belum diatur).');
      });
  }, [step]);

  useEffect(() => {
    if (parentAccountLoggedIn && step === 'gate') {
      setStep('app');
    }
  }, [parentAccountLoggedIn, step]);

  useEffect(() => {
    if (!session) {
      if (!parentAccountLoggedIn) {
        setIsSuperParent(false);
        setParentSettings(null);
        setParentDashboard(null);
        return;
      }
    }
    const token = session ?? null;
    void api
      .getParentSettings(token)
      .then((s) => {
        setIsSuperParent(s.isSuperParent);
        setParentSettings({
          dailyTimeCapMinutes: s.dailyTimeCapMinutes,
          breakReminderMinutes: s.breakReminderMinutes,
          musicEnabled: s.musicEnabled,
          sfxEnabled: s.sfxEnabled,
          reduceMotion: s.reduceMotion,
          parentEmailMasked: s.parentEmailMasked,
          weeklyEmailOptIn: s.weeklyEmailOptIn,
        });
        applyDevicePreferencesToGameFeedback({
          dailyTimeCapMinutes: s.dailyTimeCapMinutes,
          breakReminderMinutes: s.breakReminderMinutes,
          sfxEnabled: s.sfxEnabled,
          musicEnabled: s.musicEnabled,
          reduceMotion: s.reduceMotion,
        });
        setParentEmailDraft('');
      })
      .catch(() => {
        setIsSuperParent(false);
        setParentSettings(null);
      });

    void api
      .getParentDashboard(token)
      .then((d) => {
        setParentDashboard(d);
      })
      .catch(() => {
        // Tetap tampilkan blok dashboard agar user tahu state-nya.
        setParentDashboard({
          totalChildren: 0,
          activeChildren7d: 0,
          retention7dPct: 0,
          totalActivitiesCompleted: 0,
          totalPlayMinutes: 0,
          averageStars: 0,
          levelCompletionPct: 0,
          perTrack: [],
          childSummaries: [],
        });
      });
  }, [session, parentAccountLoggedIn]);

  const verify = async () => {
    setErr(null);
    try {
      const res = await api.verifyPin(pin);
      setSession(res.sessionToken);
      setStep('app');
      setPin('');
      setCurrentPin('');
    } catch {
      setErr('PIN salah atau belum diatur. Coba setup PIN baru.');
    }
  };

  const setup = async () => {
    setErr(null);
    try {
      const res =
        pinIsSet === true
          ? await api.changePin({
              currentPin,
              pin,
              recoveryQuestion: recoverQ,
              recoveryAnswer: recoverA,
            })
          : await api.setupPin({
              pin,
              recoveryQuestion: recoverQ,
              recoveryAnswer: recoverA,
            });
      setSession(res.sessionToken);
      setStep('app');
      setPin('');
      setCurrentPin('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan PIN');
    }
  };

  const loadReport = async (childId: string) => {
    if (!session && !parentAccountLoggedIn) return;
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
        {pinIsSet ? (
          <button
            type="button"
            className="w-full text-sm text-neutral-600 underline"
            onClick={() => {
              setErr(null);
              setStep('forgot');
            }}
          >
            Lupa PIN?
          </button>
        ) : null}
        <button
          type="button"
          className="w-full text-sm text-primary-600"
          disabled={pinIsSet === null}
          onClick={() => setStep('setup')}
        >
          {pinIsSet === null
            ? 'Memuat…'
            : pinIsSet
              ? 'Ubah PIN'
              : 'Setup PIN pertama kali'}
        </button>
        <a href="/" className="block text-center text-sm text-neutral-600">
          Kembali
        </a>
      </div>
    );
  }

  if (step === 'forgot') {
    return (
      <div className="space-y-4 px-4">
        <h1 className="text-2xl font-bold">Pemulihan PIN</h1>
        <p className="text-sm text-neutral-600">
          Jawab pertanyaan pemulihan yang Anda pilih saat mengatur PIN.
        </p>
        {forgotQuestion ? (
          <p className="rounded-xl bg-neutral-100 p-3 text-lg font-medium">
            {forgotQuestion}
          </p>
        ) : null}
        <label htmlFor="parent-forgot-answer" className="sr-only">
          Jawaban pemulihan
        </label>
        <input
          id="parent-forgot-answer"
          className="w-full rounded-xl border px-3 py-3"
          placeholder="Jawaban Anda"
          value={forgotAnswer}
          onChange={(e) => setForgotAnswer(e.target.value)}
        />
        {err ? <p className="text-red-600">{err}</p> : null}
        <Button
          className="w-full"
          disabled={!forgotQuestion || forgotAnswer.trim().length < 2}
          onClick={async () => {
            setErr(null);
            try {
              const res = await api.verifyRecoveryAnswer(forgotAnswer.trim());
              setRecoveryToken(res.recoveryToken);
              setStep('forgot-new');
              setForgotPin('');
            } catch (e) {
              setErr(e instanceof Error ? e.message : 'Jawaban tidak cocok');
            }
          }}
        >
          Lanjut
        </Button>
        <button
          type="button"
          className="text-sm text-primary-600"
          onClick={() => {
            setStep('gate');
            setForgotAnswer('');
            setErr(null);
          }}
        >
          Batal
        </button>
      </div>
    );
  }

  if (step === 'forgot-new') {
    return (
      <div className="space-y-3 px-4">
        <h1 className="text-2xl font-bold">PIN baru</h1>
        <p className="text-sm text-neutral-600">
          Token pemulihan aktif ~15 menit. Atur PIN baru dan pertanyaan
          pemulihan.
        </p>
        <label htmlFor="parent-forgot-pin" className="sr-only">
          PIN baru
        </label>
        <input
          id="parent-forgot-pin"
          inputMode="numeric"
          placeholder="PIN baru (4 digit)"
          className="w-full rounded-xl border px-3 py-3 text-2xl tracking-widest"
          maxLength={4}
          value={forgotPin}
          onChange={(e) =>
            setForgotPin(e.target.value.replace(/\D/g, '').slice(0, 4))
          }
        />
        <input
          className="w-full rounded-xl border px-3 py-2"
          value={forgotRecoverQ}
          onChange={(e) => setForgotRecoverQ(e.target.value)}
        />
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Jawaban singkat pemulihan"
          value={forgotRecoverA}
          onChange={(e) => setForgotRecoverA(e.target.value)}
        />
        {err ? <p className="text-red-600">{err}</p> : null}
        <Button
          className="w-full"
          disabled={
            forgotPin.length !== 4 ||
            forgotRecoverQ.trim().length < 3 ||
            forgotRecoverA.trim().length < 2 ||
            !recoveryToken
          }
          onClick={async () => {
            if (!recoveryToken) return;
            setErr(null);
            try {
              const res = await api.resetPinWithRecovery({
                recoveryToken,
                pin: forgotPin,
                recoveryQuestion: forgotRecoverQ.trim(),
                recoveryAnswer: forgotRecoverA.trim(),
              });
              setSession(res.sessionToken);
              setRecoveryToken(null);
              setStep('app');
              setForgotPin('');
              setForgotRecoverA('');
            } catch (e) {
              setErr(e instanceof Error ? e.message : 'Gagal menyimpan PIN');
            }
          }}
        >
          Simpan PIN baru
        </Button>
        <button
          type="button"
          className="text-sm text-primary-600"
          onClick={() => {
            setStep('forgot');
            setRecoveryToken(null);
            setErr(null);
          }}
        >
          Kembali
        </button>
      </div>
    );
  }

  if (step === 'setup') {
    const title = pinIsSet ? 'Ubah PIN' : 'Buat PIN';
    return (
      <div className="space-y-3 px-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        {pinIsSet ? (
          <p className="text-sm text-neutral-600">
            Masukkan PIN lalu tentukan PIN baru dan pemulihan akun.
          </p>
        ) : null}
        {pinIsSet ? (
          <>
            <label htmlFor="parent-pin-current" className="sr-only">
              PIN saat ini
            </label>
            <input
              id="parent-pin-current"
              inputMode="numeric"
              autoComplete="off"
              placeholder="PIN saat ini (4 digit)"
              className="w-full rounded-xl border px-3 py-3 text-2xl tracking-widest"
              maxLength={4}
              value={currentPin}
              onChange={(e) =>
                setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
            />
          </>
        ) : null}
        <label htmlFor="parent-pin-new" className="sr-only">
          {pinIsSet ? 'PIN baru' : 'PIN 4 digit'}
        </label>
        <input
          id="parent-pin-new"
          inputMode="numeric"
          placeholder={pinIsSet ? 'PIN baru (4 digit)' : 'PIN 4 digit'}
          className="w-full rounded-xl border px-3 py-3 text-2xl tracking-widest"
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
          onClick={() => {
            setStep('gate');
            setPin('');
            setCurrentPin('');
            setErr(null);
          }}
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
      {parentDashboard ? (
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow">
          <p className="font-bold">Dashboard Orang Tua</p>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div className="rounded-xl bg-neutral-50 px-3 py-2">
              <p className="text-neutral-500">Anak terdaftar</p>
              <p className="font-semibold">{parentDashboard.totalChildren}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2">
              <p className="text-neutral-500">Aktif 7 hari</p>
              <p className="font-semibold">
                {parentDashboard.activeChildren7d}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2">
              <p className="text-neutral-500">Retensi 7 hari</p>
              <p className="font-semibold">{parentDashboard.retention7dPct}%</p>
            </div>
            <div className="rounded-xl bg-neutral-50 px-3 py-2">
              <p className="text-neutral-500">Waktu bermain</p>
              <p className="font-semibold">
                {parentDashboard.totalPlayMinutes} menit
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-primary-50 px-3 py-2">
              <p className="text-primary-700">Aktivitas selesai</p>
              <p className="font-semibold">
                {parentDashboard.totalActivitiesCompleted}
              </p>
            </div>
            <div className="rounded-xl bg-primary-50 px-3 py-2">
              <p className="text-primary-700">Rata-rata bintang</p>
              <p className="font-semibold">{parentDashboard.averageStars}★</p>
            </div>
            <div className="rounded-xl bg-primary-50 px-3 py-2">
              <p className="text-primary-700">Penyelesaian level</p>
              <p className="font-semibold">
                {parentDashboard.levelCompletionPct}%
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-neutral-50 px-3 py-2 text-sm">
            <p className="font-medium">Analisis jalur belajar</p>
            <p className="text-neutral-600">
              {parentDashboard.perTrack
                .map(
                  (t) =>
                    `${t.track === 'literasi' ? 'Literasi' : 'Matematika'}: ${t.averageStars}★`,
                )
                .join(' · ')}
            </p>
          </div>
        </div>
      ) : null}

      {parentDashboard && parentDashboard.childSummaries.length > 0 ? (
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow">
          <p className="font-bold">Manajemen Anak</p>
          <div className="space-y-2">
            {parentDashboard.childSummaries.map((child) => (
              <div
                key={child.id}
                className="rounded-xl bg-neutral-50 px-3 py-2 text-sm"
              >
                <p className="font-semibold">
                  {child.name} · {child.ageMode}
                </p>
                <p className="text-neutral-600">
                  XP {child.totalXp} · aktivitas{' '}
                  {child.totalActivitiesCompleted} · {child.totalPlayMinutes}{' '}
                  menit · {child.averageStars}★ · level{' '}
                  {child.levelCompletionPct}% ·{' '}
                  {child.active7d ? 'aktif 7 hari' : 'belum aktif 7 hari'}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-500">
            Pilih tombol nama anak di atas untuk membuka laporan detail per
            anak.
          </p>
        </div>
      ) : null}
      {report ? (
        <div className="space-y-3">
          <div className="rounded-2xl bg-white p-4 shadow">
            <p className="font-bold">
              {String((report.child as { name?: string })?.name ?? 'Anak')}
            </p>
            <p className="mt-1 font-semibold">
              Total XP: {String(report.totalXp ?? '')}
            </p>
            <p className="text-sm text-neutral-600">
              Aktivitas selesai (≥1★):{' '}
              {String(report.totalActivitiesCompleted ?? '')}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow">
            <p className="font-bold">Literasi vs matematika</p>
            <div className="mt-2 space-y-2">
              {(
                (report.perTrack as Array<{
                  track: string;
                  levelsMastered: number;
                  activitiesCompleted: number;
                  averageStars: number;
                }>) ?? []
              ).map((row) => (
                <div
                  key={row.track}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-neutral-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium">
                    {row.track === 'literasi' ? 'Literasi' : 'Matematika'}
                  </span>
                  <span className="text-neutral-700">
                    ⌀ {row.averageStars}★ · {row.activitiesCompleted} aktivitas
                    · level sempurna: {row.levelsMastered}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-neutral-600">
              Bandingkan rata-rata bintang: jalur dengan nilai lebih rendah
              biasanya perlu latihan tambahan.
            </p>
          </div>

          {(
            (report.replayRecommendations as Array<{
              activityId: string;
              title: string;
              track: string;
              bestStars: number;
            }>) ?? []
          ).length > 0 ? (
            <div className="rounded-2xl bg-white p-4 shadow">
              <p className="font-bold">Sarankan dimainkan ulang</p>
              <p className="text-xs text-neutral-600">
                Berdasarkan bintang terendah (fokus perbaikan).
              </p>
              <ul className="mt-2 space-y-2">
                {(
                  (report.replayRecommendations as Array<{
                    activityId: string;
                    title: string;
                    track: string;
                    bestStars: number;
                  }>) ?? []
                ).map((r) => {
                  const cid = (report.child as { id: string }).id;
                  return (
                    <li key={r.activityId}>
                      <a
                        className="block rounded-xl bg-primary-50 px-3 py-2 text-sm font-medium text-primary-900 ring-1 ring-primary-100"
                        href={`/p/${cid}/play/${r.activityId}`}
                      >
                        {r.title}
                        <span className="ml-2 text-xs font-normal text-neutral-600">
                          {r.track === 'literasi' ? 'Literasi' : 'Math'} ·{' '}
                          {r.bestStars}★
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
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
            <span className="text-neutral-700">Email ringkasan mingguan</span>
            {parentSettings.parentEmailMasked ? (
              <span className="mt-0.5 block text-xs text-neutral-500">
                Tersimpan: {parentSettings.parentEmailMasked}
              </span>
            ) : null}
            <input
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-xl border px-3 py-2"
              placeholder="nama@email.com"
              value={parentEmailDraft}
              onChange={(e) => setParentEmailDraft(e.target.value)}
            />
          </label>
          {parentSettings.parentEmailMasked ? (
            <button
              type="button"
              className="text-xs font-medium text-red-700 underline"
              onClick={async () => {
                if (!session && !parentAccountLoggedIn) return;
                setErr(null);
                try {
                  await api.patchParentSettings(session, {
                    parentEmail: null,
                    weeklyEmailOptIn: false,
                  });
                  setParentSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          parentEmailMasked: null,
                          weeklyEmailOptIn: false,
                        }
                      : prev,
                  );
                  setParentEmailDraft('');
                } catch {
                  setErr('Gagal menghapus email');
                }
              }}
            >
              Hapus email tersimpan
            </button>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={parentSettings.weeklyEmailOptIn}
              onChange={(e) =>
                setParentSettings((prev) =>
                  prev ? { ...prev, weeklyEmailOptIn: e.target.checked } : prev,
                )
              }
            />
            Kirim ringkasan mingguan (perlu RESEND di server + cron)
          </label>
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
              if ((!session && !parentAccountLoggedIn) || !parentSettings)
                return;
              setSettingsSaved(false);
              try {
                const saved = await api.patchParentSettings(session, {
                  dailyTimeCapMinutes: parentSettings.dailyTimeCapMinutes,
                  breakReminderMinutes: parentSettings.breakReminderMinutes,
                  sfxEnabled: parentSettings.sfxEnabled,
                  musicEnabled: parentSettings.musicEnabled,
                  reduceMotion: parentSettings.reduceMotion,
                  weeklyEmailOptIn: parentSettings.weeklyEmailOptIn,
                  ...(parentEmailDraft.trim()
                    ? { parentEmail: parentEmailDraft.trim() }
                    : {}),
                });
                setParentSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        dailyTimeCapMinutes: saved.dailyTimeCapMinutes,
                        breakReminderMinutes: saved.breakReminderMinutes,
                        musicEnabled: saved.musicEnabled,
                        sfxEnabled: saved.sfxEnabled,
                        reduceMotion: saved.reduceMotion,
                        parentEmailMasked: saved.parentEmailMasked,
                        weeklyEmailOptIn: saved.weeklyEmailOptIn,
                      }
                    : prev,
                );
                setParentEmailDraft('');
                applyDevicePreferencesToGameFeedback({
                  dailyTimeCapMinutes: saved.dailyTimeCapMinutes,
                  breakReminderMinutes: saved.breakReminderMinutes,
                  sfxEnabled: saved.sfxEnabled,
                  musicEnabled: saved.musicEnabled,
                  reduceMotion: saved.reduceMotion,
                });
                void queryClient.invalidateQueries({
                  queryKey: ['devicePreferences'],
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

function AdminShellRoute() {
  return (
    <AdminSuspense>
      <AdminShell />
    </AdminSuspense>
  );
}

function AdminLoginShell() {
  return (
    <AdminSuspense>
      <AdminLoginPage />
    </AdminSuspense>
  );
}

function AdminSignupShell() {
  return (
    <AdminSuspense>
      <AdminSignupPage />
    </AdminSuspense>
  );
}

function AdminDashboardShell() {
  return (
    <AdminSuspense>
      <AdminDashboardRoutePage />
    </AdminSuspense>
  );
}

function AdminChildrenShell() {
  return (
    <AdminSuspense>
      <AdminChildrenRoutePage />
    </AdminSuspense>
  );
}

function AdminAuditShell() {
  return (
    <AdminSuspense>
      <AdminAuditPage />
    </AdminSuspense>
  );
}

function AdminContentShell() {
  return (
    <AdminSuspense>
      <AdminContentPage />
    </AdminSuspense>
  );
}

function AdminAnalyticsShell() {
  return (
    <AdminSuspense>
      <AdminAnalyticsPage />
    </AdminSuspense>
  );
}

function AdminSettingsShell() {
  return (
    <AdminSuspense>
      <AdminSettingsPage />
    </AdminSuspense>
  );
}

function AdminImportExportShell() {
  return (
    <AdminSuspense>
      <AdminImportExportPage />
    </AdminSuspense>
  );
}

function AdminUsersShell() {
  return (
    <AdminSuspense>
      <AdminUsersPage />
    </AdminSuspense>
  );
}

const adminRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: AdminShellRoute,
  beforeLoad: async ({ location }) => {
    // Only redirect to login if not already on login page
    const session = await authClient.getSession();
    if (
      !session &&
      location.pathname !== '/admin/login' &&
      location.pathname !== '/admin/signup' &&
      location.pathname !== '/admin/two-factor'
    ) {
      throw redirect({ to: '/admin/login' });
    }
  },
});

const adminLoginRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/login',
  component: AdminLoginShell,
});

const adminSignupRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/signup',
  component: AdminSignupShell,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/',
  component: AdminDashboardShell,
});

const adminChildrenRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/children',
  component: AdminChildrenShell,
});

const adminChildDetailRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/children/$childId',
  component: AdminChildDetailShell,
});

function AdminChildDetailShell() {
  const { childId } = adminChildDetailRoute.useParams();
  return (
    <AdminSuspense>
      <AdminChildDetailPage childId={childId} />
    </AdminSuspense>
  );
}

const adminAuditRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/audit',
  component: AdminAuditShell,
});

const adminContentRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/content',
  component: AdminContentShell,
});

const adminActivityDetailRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/content/activities/$activityId',
  component: AdminActivityDetailShell,
});

function AdminActivityDetailShell() {
  const { activityId } = adminActivityDetailRoute.useParams();
  return (
    <AdminSuspense>
      <AdminActivityEditorPage activityId={activityId} />
    </AdminSuspense>
  );
}

const adminBankRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/banks/$activityId',
  component: AdminBankShell,
});

function AdminBankShell() {
  const { activityId } = adminBankRoute.useParams();
  return (
    <AdminSuspense>
      <AdminBankEditorPage activityId={activityId} />
    </AdminSuspense>
  );
}

function AdminTwoFactorShell() {
  return (
    <AdminSuspense>
      <AdminTwoFactorPage />
    </AdminSuspense>
  );
}

const adminActivityPreviewRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/activities/$activityId/preview',
  component: AdminActivityPreviewShell,
});

function AdminActivityPreviewShell() {
  const { activityId } = adminActivityPreviewRoute.useParams();
  return (
    <AdminSuspense>
      <AdminActivityPreviewPage activityId={activityId} />
    </AdminSuspense>
  );
}

const adminTwoFactorRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/two-factor',
  component: AdminTwoFactorShell,
});

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/analytics',
  component: AdminAnalyticsShell,
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/settings',
  component: AdminSettingsShell,
});

const adminImportExportRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/import-export',
  component: AdminImportExportShell,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRootRoute,
  path: '/users',
  component: AdminUsersShell,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  authSignUpRoute,
  authSignInRoute,
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
    adminTwoFactorRoute,
    adminChildrenRoute,
    adminChildDetailRoute,
    adminAuditRoute,
    adminContentRoute,
    adminActivityDetailRoute,
    adminActivityPreviewRoute,
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
