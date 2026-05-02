import { api } from '@/api';
import { Button } from '@/components/ui/Button';
import { parentSessionAtom } from '@/state/atoms';
import { Link, useNavigate } from '@tanstack/react-router';
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

type Profile = {
  id: string;
  name: string;
  avatarKey: string;
  ageMode: string;
};

export function SuperParentPage() {
  const [session, setSession] = useAtom(parentSessionAtom);
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMode, setEditMode] = useState<'TK' | 'SD1'>('TK');
  const [editAvatar, setEditAvatar] = useState(AVATARS[0]);

  useEffect(() => {
    if (!session) {
      navigate({ to: '/parent' });
      return;
    }
    api
      .getParentSettings(session)
      .then((s) => {
        if (!s.isSuperParent) {
          navigate({ to: '/parent' });
          return;
        }
        setAllowed(true);
      })
      .catch(() => navigate({ to: '/parent' }));
  }, [session, navigate]);

  useEffect(() => {
    if (!allowed || !session) return;
    api
      .getProfiles()
      .then(setProfiles)
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : 'Gagal memuat profil'),
      );
  }, [allowed, session]);

  const startEdit = (p: Profile) => {
    setEditId(p.id);
    setEditName(p.name);
    setEditMode(p.ageMode as 'TK' | 'SD1');
    setEditAvatar(p.avatarKey);
    setErr(null);
    setMsg(null);
  };

  const saveEdit = async () => {
    if (!session || !editId) return;
    setErr(null);
    setMsg(null);
    try {
      await api.patchProfileAsSuperParent(session, editId, {
        name: editName,
        ageMode: editMode,
        avatarKey: editAvatar,
      });
      setMsg('Profil diperbarui.');
      setEditId(null);
      const list = await api.getProfiles();
      setProfiles(list);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan');
    }
  };

  const remove = async (id: string, name: string) => {
    if (!session) return;
    if (!confirm(`Hapus profil "${name}"?`)) return;
    setErr(null);
    try {
      const res = await api.deleteProfile(session, id);
      if (!res.ok) throw new Error('HTTP');
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setMsg('Profil dihapus.');
      if (editId === id) setEditId(null);
    } catch {
      setErr('Gagal menghapus (perlu sesi super-orang tua).');
    }
  };

  const reset = async (childId: string) => {
    if (!session) return;
    if (!confirm('Reset semua progres untuk anak ini?')) return;
    setErr(null);
    try {
      await api.resetProgressAsSuperParent(session, childId);
      setMsg('Progres direset.');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal reset');
    }
  };

  if (!session || allowed === null) {
    return (
      <div className="space-y-4 px-4 py-8">
        <p className="text-neutral-600">Memuat…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/parent"
          className="text-sm font-medium text-primary-600 hover:underline"
        >
          ← Area orang tua
        </Link>
        <h1 className="text-2xl font-bold">Super-orang tua</h1>
        <p className="text-sm text-neutral-600">
          Kelola profil anak di perangkat ini (PIN + flag super-orang tua).
        </p>
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="border-b border-neutral-100 pb-4 last:border-0 last:pb-0"
          >
            {editId === p.id ? (
              <div className="space-y-3">
                <input
                  className="w-full rounded-xl border px-3 py-2"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <select
                  className="w-full rounded-xl border px-3 py-2"
                  value={editMode}
                  onChange={(e) => setEditMode(e.target.value as 'TK' | 'SD1')}
                >
                  <option value="TK">TK</option>
                  <option value="SD1">SD1</option>
                </select>
                <select
                  className="w-full rounded-xl border px-3 py-2"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                >
                  {AVATARS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => void saveEdit()}
                  >
                    Simpan
                  </Button>
                  <button
                    type="button"
                    className="rounded-xl border px-4 py-2 text-sm"
                    onClick={() => setEditId(null)}
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-neutral-500">
                  {p.ageMode} · {p.avatarKey}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-sm"
                    onClick={() => startEdit(p)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-sm"
                    onClick={() => void reset(p.id)}
                  >
                    Reset progres
                  </Button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                    onClick={() => void remove(p.id, p.name)}
                  >
                    Hapus
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {profiles.length === 0 ? (
          <p className="text-center text-neutral-400">Belum ada profil.</p>
        ) : null}
      </div>

      <Button
        variant="ghost"
        className="w-full"
        onClick={() => setSession(null)}
      >
        Keluar sesi orang tua
      </Button>
    </div>
  );
}
