import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/auth-client';
import { useCallback, useEffect, useState } from 'react';

type AuthAdmin = {
  listUsers: (opts?: {
    query?: Record<string, unknown>;
  }) => Promise<{ data?: ListPayload; error?: { message?: string } }>;
  createUser: (opts: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }) => Promise<{ error?: { message?: string } }>;
  setRole: (opts: { userId: string; role: string }) => Promise<{
    error?: unknown;
  }>;
  banUser: (opts: {
    userId: string;
    banReason?: string;
  }) => Promise<{ error?: unknown }>;
  unbanUser: (opts: { userId: string }) => Promise<{ error?: unknown }>;
  revokeUserSessions: (opts: {
    userId: string;
  }) => Promise<{ error?: unknown }>;
};

type ListPayload = {
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: string | null;
    banned: boolean | null;
    createdAt: Date | string;
  }>;
  total: number;
};

function getAuthAdmin(): AuthAdmin {
  return (authClient as unknown as { admin: AuthAdmin }).admin;
}

export function AdminUsersPage() {
  const { data: session } = authClient.useSession();
  const canCreateUsers = session?.user?.role === 'super_admin';
  const [rows, setRows] = useState<ListPayload['users']>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<
    'analyst' | 'content_editor' | 'super_admin'
  >('analyst');

  const load = useCallback(async () => {
    setErr(null);
    try {
      const admin = getAuthAdmin();
      const res = await admin.listUsers({
        query: { limit: 50, sortBy: 'createdAt', sortDirection: 'desc' },
      });
      if (res.error?.message) throw new Error(res.error.message);
      if (!res.data) throw new Error('Tidak ada data');
      setRows(res.data.users);
      setTotal(res.data.total);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal memuat pengguna');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setErr(null);
    setMsg(null);
    if (!canCreateUsers) {
      setErr('Hanya super_admin yang dapat menambahkan pengguna admin.');
      return;
    }
    try {
      const admin = getAuthAdmin();
      const res = await admin.createUser({
        email,
        password,
        name: name || email.split('@')[0],
        role,
      });
      if (res.error?.message) throw new Error(String(res.error.message));
      setMsg('Pengguna dibuat.');
      setEmail('');
      setPassword('');
      setName('');
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal membuat pengguna');
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Pengguna admin</h1>
        <p className="mt-1 text-neutral-600">
          Kelola akun better-auth (plugin admin). Hanya untuk{' '}
          <strong>super_admin</strong>.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Sesi Anda: {session?.user?.email} ({session?.user?.role})
        </p>
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Buat pengguna baru</h2>
        {!canCreateUsers ? (
          <p className="mt-3 text-sm text-amber-800">
            Hanya akun <strong>super_admin</strong> yang bisa menambahkan
            pengguna (permission Better Auth:{' '}
            <code className="text-xs">user.create</code>
            ). Masuk sebagai super_admin atau minta super_admin yang ada
            menambahkan Anda.
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-neutral-600">Email</span>
            <input
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              disabled={!canCreateUsers}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-neutral-600">
              Password
            </span>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={!canCreateUsers}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-neutral-600">
              Nama tampilan
            </span>
            <input
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canCreateUsers}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-neutral-600">Role</span>
            <select
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-50 disabled:text-neutral-400"
              value={role}
              onChange={(e) =>
                setRole(
                  e.target.value as
                    | 'analyst'
                    | 'content_editor'
                    | 'super_admin',
                )
              }
              disabled={!canCreateUsers}
            >
              <option value="analyst">analyst</option>
              <option value="content_editor">content_editor</option>
              <option value="super_admin">super_admin</option>
            </select>
          </label>
        </div>
        <div className="mt-4">
          <Button
            type="button"
            disabled={!canCreateUsers}
            onClick={() => void create()}
          >
            Buat pengguna
          </Button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Daftar ({total} pengguna)
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <UserRow key={u.id} user={u} onDone={() => void load()} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function UserRow({
  user,
  onDone,
}: {
  user: ListPayload['users'][number];
  onDone: () => void;
}) {
  const [localErr, setLocalErr] = useState<string | null>(null);

  const act = async (fn: (a: AuthAdmin) => Promise<{ error?: unknown }>) => {
    setLocalErr(null);
    try {
      const admin = getAuthAdmin();
      const res = await fn(admin);
      if (res.error) throw new Error('Aksi ditolak server');
      onDone();
    } catch (e: unknown) {
      setLocalErr(e instanceof Error ? e.message : 'Gagal');
    }
  };

  return (
    <tr className="border-b border-neutral-50 align-top">
      <td className="px-4 py-2">{user.email}</td>
      <td className="px-4 py-2">{user.name}</td>
      <td className="px-4 py-2 font-mono text-xs">{user.role}</td>
      <td className="px-4 py-2">
        {user.banned ? (
          <span className="text-red-600">Banned</span>
        ) : (
          <span className="text-neutral-600">Aktif</span>
        )}
      </td>
      <td className="px-4 py-2">
        {localErr ? <p className="text-xs text-red-600">{localErr}</p> : null}
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className="rounded bg-neutral-100 px-2 py-1 text-xs hover:bg-neutral-200"
            onClick={() =>
              void act((adm) =>
                adm.setRole({
                  userId: user.id,
                  role:
                    user.role === 'analyst'
                      ? 'content_editor'
                      : user.role === 'content_editor'
                        ? 'super_admin'
                        : 'analyst',
                }),
              )
            }
          >
            Putar role
          </button>
          {user.banned ? (
            <button
              type="button"
              className="rounded bg-green-50 px-2 py-1 text-xs text-green-800"
              onClick={() =>
                void act((adm) => adm.unbanUser({ userId: user.id }))
              }
            >
              Unban
            </button>
          ) : (
            <button
              type="button"
              className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-900"
              onClick={() =>
                void act((adm) => adm.banUser({ userId: user.id }))
              }
            >
              Ban
            </button>
          )}
          <button
            type="button"
            className="rounded bg-red-50 px-2 py-1 text-xs text-red-800"
            onClick={() =>
              void act((adm) => adm.revokeUserSessions({ userId: user.id }))
            }
          >
            Revoke sesi
          </button>
        </div>
      </td>
    </tr>
  );
}
