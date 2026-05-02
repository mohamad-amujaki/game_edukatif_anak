import { adminApi } from '@/api-admin';
import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/auth-client';
import { Link, useNavigate } from '@tanstack/react-router';
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

export function AdminChildDetailPage({ childId }: { childId: string }) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const isSuper = session?.user?.role === 'super_admin';

  const [name, setName] = useState('');
  const [ageMode, setAgeMode] = useState<'TK' | 'SD1'>('TK');
  const [avatarKey, setAvatarKey] = useState(AVATARS[0]);
  const [counts, setCounts] = useState({ playSessions: 0, progress: 0 });
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getChild(childId)
      .then((c) => {
        setName(c.name);
        setAgeMode(c.ageMode as 'TK' | 'SD1');
        setAvatarKey(c.avatarKey);
        setCounts(c._count);
        setErr(null);
      })
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : 'Profil tidak ditemukan'),
      )
      .finally(() => setLoading(false));
  }, [childId]);

  const save = async () => {
    if (!isSuper) return;
    setErr(null);
    setMsg(null);
    try {
      await adminApi.patchChild(childId, { name, ageMode, avatarKey });
      setMsg('Profil diperbarui.');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan');
    }
  };

  const remove = async () => {
    if (!isSuper) return;
    if (!confirm(`Hapus profil "${name}"? Tidak dapat dibatalkan.`)) return;
    setErr(null);
    try {
      await adminApi.deleteChild(childId);
      navigate({ to: '/admin/children' });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal menghapus');
    }
  };

  const reset = async () => {
    if (!isSuper) return;
    if (!confirm('Reset semua progres anak ini?')) return;
    setErr(null);
    try {
      await adminApi.resetChildProgress(childId);
      setMsg('Progres direset.');
      const c = await adminApi.getChild(childId);
      setCounts(c._count);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal reset');
    }
  };

  if (loading) return <p className="text-neutral-500">Memuat…</p>;
  if (err && !name) return <p className="text-red-600">{err}</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        to="/admin/children"
        className="text-sm font-medium text-primary-600 hover:underline"
      >
        ← Daftar anak
      </Link>
      <h1 className="text-3xl font-bold">Profil anak</h1>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-600">
          Sesi main: <strong>{counts.playSessions}</strong> · Entri progres:{' '}
          <strong>{counts.progress}</strong>
        </p>

        {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
        {msg ? <p className="mt-3 text-sm text-green-700">{msg}</p> : null}

        <label className="mt-4 block">
          <span className="text-sm font-medium text-neutral-700">Nama</span>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isSuper}
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-neutral-700">Mode</span>
          <select
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
            value={ageMode}
            onChange={(e) => setAgeMode(e.target.value as 'TK' | 'SD1')}
            disabled={!isSuper}
          >
            <option value="TK">TK</option>
            <option value="SD1">SD1</option>
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-neutral-700">Avatar</span>
          <select
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
            value={avatarKey}
            onChange={(e) => setAvatarKey(e.target.value)}
            disabled={!isSuper}
          >
            {AVATARS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        {isSuper ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" onClick={() => void save()}>
              Simpan
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void reset()}
            >
              Reset progres
            </Button>
            <button
              type="button"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800"
              onClick={() => void remove()}
            >
              Hapus profil
            </button>
          </div>
        ) : (
          <p className="mt-6 text-sm text-neutral-500">
            Mengubah/hapus profil anak memerlukan super_admin (sesuai PRD).
          </p>
        )}
      </div>
    </div>
  );
}
