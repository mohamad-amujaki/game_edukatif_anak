import { type ProfileRow, api } from '@/api';
import { Button } from '@/components/ui/Button';
import { BRAND_APP } from '@/lib/brand';
import { lastChildIdAtom, parentSessionAtom } from '@/state/atoms';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import confetti from 'canvas-confetti';
import { useAtom } from 'jotai/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const AVATARS = [
  'panda',
  'cat',
  'dog',
  'rabbit',
  'lion',
  'frog',
  'bear',
  'fox',
] as const;

const LS_VISITS = 'main-ceria-home-visits';
const MAX_PROFILES = 4;

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

function ageLabel(mode: string): string {
  return mode === 'SD1' ? 'SD kelas 1' : 'TK';
}

export function HomeLanding() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [, setLast] = useAtom(lastChildIdAtom);
  const [parentSession] = useAtom(parentSessionAtom);
  const [name, setName] = useState('');
  const [avatarKey, setAvatarKey] = useState<string>(AVATARS[0]);
  const [ageMode, setAgeMode] = useState<'TK' | 'SD1'>('TK');
  const [err, setErr] = useState<string | null>(null);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const { data: profilesRaw, isPending: loadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => api.getProfiles(),
    retry: 1,
  });
  const profiles: ProfileRow[] = profilesRaw ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewProfile, setShowNewProfile] = useState(false);
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState<string>(AVATARS[0]);
  const [editMode, setEditMode] = useState<'TK' | 'SD1'>('TK');
  const [editErr, setEditErr] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const editDialogRef = useRef<HTMLDialogElement>(null);

  const refreshProfiles = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['profiles'] });
  }, [queryClient]);

  useEffect(() => {
    try {
      const n = Number(localStorage.getItem(LS_VISITS) ?? '0') + 1;
      localStorage.setItem(LS_VISITS, String(n));
      setVisitCount(n);
    } catch {
      setVisitCount(1);
    }
  }, []);

  useEffect(() => {
    setSelectedId((prev) => {
      if (prev && profiles.some((r) => r.id === prev)) return prev;
      return profiles[0]?.id ?? null;
    });
    if (profiles.length === 0) {
      setShowNewProfile(true);
    }
  }, [profiles]);

  const readinessPct = useMemo(() => {
    let pct = 40;
    if (name.trim().length >= 1) pct += 30;
    if (name.trim().length >= 2) pct += 30;
    return Math.min(100, pct);
  }, [name]);

  const openEdit = (p: ProfileRow) => {
    setEditing(p);
    setEditName(p.name);
    setEditAvatar(p.avatarKey);
    setEditMode(p.ageMode === 'SD1' ? 'SD1' : 'TK');
    setEditErr(null);
  };

  const closeEdit = useCallback(() => {
    setEditing(null);
    setEditErr(null);
  }, []);

  useEffect(() => {
    if (!editing) return;
    const el = editDialogRef.current;
    if (!el) return;

    const onDialogClose = () => {
      closeEdit();
    };
    el.addEventListener('close', onDialogClose);
    el.showModal();
    window.requestAnimationFrame(() => {
      document.getElementById('edit-name')?.focus?.();
    });
    return () => {
      el.removeEventListener('close', onDialogClose);
      el.close();
    };
  }, [editing, closeEdit]);

  const saveEdit = async () => {
    if (!editing) return;
    setEditErr(null);
    setSavingEdit(true);
    try {
      const updated = await api.patchProfileSelf(
        editing.id,
        {
          name: editName.trim() || editing.name,
          avatarKey: editAvatar,
          ageMode: editMode,
        },
        { parentSessionToken: parentSession },
      );
      await refreshProfiles();
      if (selectedId === editing.id) setLast(updated.id);
      closeEdit();
    } catch (e) {
      setEditErr(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setSavingEdit(false);
    }
  };

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
      await refreshProfiles();
      setSelectedId(p.id);
      setShowNewProfile(false);
      confetti({
        particleCount: 96,
        spread: 72,
        origin: { y: 0.72 },
        scalar: 1.05,
        ticks: 120,
      });
      setTimeout(() => {
        navigate({ to: '/p/$childId', params: { childId: p.id } });
      }, 380);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal membuat profil');
    }
  };

  const continuePlay = () => {
    if (!selectedId) return;
    setLast(selectedId);
    navigate({ to: '/p/$childId', params: { childId: selectedId } });
  };

  const canAddProfile = profiles.length < MAX_PROFILES;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-100 via-amber-50 to-math-100 p-6 text-center shadow-inner ring-1 ring-primary-200/60 sm:p-8">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-700 shadow-sm">
          <span aria-hidden>🎯</span> {BRAND_APP}
        </p>
        <p className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-primary-600)] sm:text-3xl">
          {t('home.heroTitle')}
        </p>
        <p className="mt-2 text-balance text-lg text-neutral-700 sm:text-xl">
          {t('home.heroSubtitle')}
        </p>
        {visitCount !== null && visitCount > 1 ? (
          <p className="mt-3 text-sm font-medium text-primary-800">
            {t('home.welcomeBack', { count: visitCount })}{' '}
            <span aria-hidden>✨</span>
          </p>
        ) : null}
      </div>

      <section aria-labelledby="players-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2
            id="players-heading"
            className="font-[family-name:var(--font-display)] text-xl font-bold text-neutral-900 sm:text-2xl"
          >
            {t('home.whoPlays')}
          </h2>
          {loadingProfiles ? (
            <span className="text-sm text-neutral-400">Memuat…</span>
          ) : (
            <span className="text-sm font-medium text-neutral-500">
              {profiles.length}/{MAX_PROFILES} pemain
            </span>
          )}
        </div>

        {loadingProfiles ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[4/3] animate-pulse rounded-3xl bg-neutral-200/80"
              />
            ))}
          </div>
        ) : profiles.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {profiles.map((p) => {
                const selected = selectedId === p.id;
                return (
                  <div key={p.id} className="relative flex flex-col">
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={`group flex w-full flex-col items-center rounded-3xl border-2 px-3 pb-3 pt-4 text-center transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 ${
                        selected
                          ? 'border-primary-500 bg-white shadow-lg shadow-primary-500/15 ring-2 ring-primary-200'
                          : 'border-transparent bg-white/90 shadow-md ring-1 ring-black/5 hover:border-primary-200 hover:shadow-lg'
                      }`}
                    >
                      <span
                        className={`text-5xl transition-transform duration-200 ${selected ? 'scale-110' : 'group-hover:scale-105'}`}
                        aria-hidden
                      >
                        {emojiAvatar(p.avatarKey)}
                      </span>
                      <span className="mt-2 line-clamp-2 w-full font-bold text-neutral-900">
                        {p.name}
                      </span>
                      <span className="mt-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600">
                        {ageLabel(p.ageMode)}
                      </span>
                      {selected ? (
                        <span className="mt-2 text-xs font-bold uppercase tracking-wide text-primary-600">
                          Dipilih
                        </span>
                      ) : (
                        <span className="mt-2 text-xs text-neutral-400 opacity-0 transition group-hover:opacity-100">
                          Tap untuk pilih
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(p);
                      }}
                    >
                      Ubah
                    </button>
                  </div>
                );
              })}

              {canAddProfile ? (
                <button
                  type="button"
                  onClick={() => setShowNewProfile(true)}
                  className="flex min-h-[11rem] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary-300/70 bg-primary-50/50 px-3 py-4 text-center transition hover:border-primary-400 hover:bg-primary-50"
                >
                  <span className="text-4xl text-primary-500" aria-hidden>
                    +
                  </span>
                  <span className="mt-2 text-sm font-bold text-primary-800">
                    {t('home.addPlayer')}
                  </span>
                  <span className="mt-1 text-xs text-primary-700/80">
                    {t('home.addPlayerCaption', { max: MAX_PROFILES })}
                  </span>
                </button>
              ) : null}
            </div>

            <div className="mt-6">
              <Button
                className="w-full py-4 text-xl shadow-lg"
                disabled={!selectedId}
                onClick={continuePlay}
              >
                {t('home.continuePlay')}
              </Button>
              <p className="mt-2 text-center text-xs text-neutral-500">
                {t('home.continueHint')}
              </p>
            </div>
          </>
        ) : (
          <p className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 ring-1 ring-amber-200">
            Belum ada pemain — buat profil pertama di bawah.
          </p>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-200/80 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl" aria-hidden>
            ⭐
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            XP & bintang
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            Raih bintang tiap aktivitas
          </p>
        </div>
        <div className="rounded-2xl border border-orange-200/80 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl" aria-hidden>
            🔥
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Streak
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            Main rutin, tetap semangat
          </p>
        </div>
        <div className="rounded-2xl border border-violet-200/80 bg-white p-4 text-center shadow-sm">
          <p className="text-2xl" aria-hidden>
            🎨
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Album stiker
          </p>
          <p className="mt-1 text-sm text-neutral-700">
            Kumpulkan stiker istimewa
          </p>
        </div>
      </div>

      {(profiles.length === 0 || showNewProfile) && canAddProfile ? (
        <div className="space-y-4 rounded-3xl bg-white p-5 shadow-xl ring-1 ring-black/5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-800">
              {profiles.length === 0 ? 'Buat pemain pertama' : 'Profil baru'}
            </span>
            {profiles.length > 0 ? (
              <button
                type="button"
                className="text-sm font-semibold text-neutral-500 hover:text-neutral-800"
                onClick={() => setShowNewProfile(false)}
              >
                Tutup
              </button>
            ) : null}
          </div>

          <div className="rounded-2xl border border-neutral-100 bg-neutral-50/80 p-4">
            <div className="flex items-center justify-between gap-2 text-sm font-semibold text-neutral-800">
              <span>Kesiapan karakter</span>
              <span className="tabular-nums text-primary-600">
                {readinessPct}%
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-neutral-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-400 to-math-500 transition-[width] duration-500 ease-out"
                style={{ width: `${readinessPct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              Isi nama panggilan untuk melengkapi bar progres.
            </p>
          </div>

          <div>
            <label htmlFor="child-name" className="block text-sm font-medium">
              Nama panggilan
            </label>
            <input
              id="child-name"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-3 text-lg outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Lala"
              maxLength={20}
              autoComplete="nickname"
            />
          </div>
          <div>
            <p className="text-sm font-medium">Avatar</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  type="button"
                  key={a}
                  className={`rounded-xl border-2 p-2 text-3xl transition hover:scale-105 active:scale-95 ${avatarKey === a ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent hover:border-primary-200'}`}
                  onClick={() => setAvatarKey(a)}
                  aria-pressed={avatarKey === a}
                  aria-label={`Pilih avatar ${a}`}
                >
                  {emojiAvatar(a)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Mode</p>
            <div className="mt-2 flex flex-wrap gap-2">
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
          </div>
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <Button className="w-full shadow-md" onClick={() => void create()}>
            Simpan & mulai petualangan
          </Button>
        </div>
      ) : null}

      {editing ? (
        <dialog
          ref={editDialogRef}
          className="fixed inset-0 z-50 m-0 flex h-full max-h-none w-full max-w-none items-end justify-center border-0 bg-black/45 p-4 backdrop:bg-transparent sm:items-center sm:p-6"
          aria-labelledby="edit-profile-title"
        >
          <div className="max-h-[min(90dvh,540px)] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-neutral-100 bg-white px-5 py-4">
              <h3
                id="edit-profile-title"
                className="font-[family-name:var(--font-display)] text-xl font-bold"
              >
                Ubah profil
              </h3>
              <button
                type="button"
                className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100"
                onClick={closeEdit}
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 px-5 py-4">
              <label className="block text-sm font-medium" htmlFor="edit-name">
                Nama panggilan
              </label>
              <input
                id="edit-name"
                className="w-full rounded-xl border border-neutral-300 px-3 py-3 text-lg"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={20}
              />
              <p className="text-sm font-medium">Avatar</p>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((a) => (
                  <button
                    type="button"
                    key={a}
                    className={`rounded-xl border-2 p-2 text-3xl ${editAvatar === a ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent'}`}
                    onClick={() => setEditAvatar(a)}
                    aria-pressed={editAvatar === a}
                    aria-label={`Pilih avatar ${a}`}
                  >
                    {emojiAvatar(a)}
                  </button>
                ))}
              </div>
              <p className="text-sm font-medium">Mode</p>
              <div className="flex gap-2">
                <Button
                  variant={editMode === 'TK' ? 'primary' : 'secondary'}
                  onClick={() => setEditMode('TK')}
                >
                  TK
                </Button>
                <Button
                  variant={editMode === 'SD1' ? 'primary' : 'secondary'}
                  onClick={() => setEditMode('SD1')}
                >
                  SD kelas 1
                </Button>
              </div>
              {editErr ? (
                <p className="text-sm text-red-600">{editErr}</p>
              ) : null}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={closeEdit}
                  disabled={savingEdit}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1"
                  disabled={savingEdit}
                  onClick={() => void saveEdit()}
                >
                  {savingEdit ? 'Menyimpan…' : 'Simpan'}
                </Button>
              </div>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
