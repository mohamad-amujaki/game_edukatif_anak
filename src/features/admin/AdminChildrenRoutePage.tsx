import { adminApi } from '@/api-admin';
import { Button } from '@/components/ui/Button';
import { downloadAdminCsv } from '@/lib/admin-csv-download';
import { authClient } from '@/lib/auth-client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useCallback, useState } from 'react';

export default function AdminChildrenRoutePage() {
  const { data: session } = authClient.useSession();
  const role = session?.user?.role ?? '';
  const canDeleteChild = role === 'super_admin' || role === 'content_editor';
  const queryClient = useQueryClient();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: rows = [],
    error,
    isPending,
  } = useQuery({
    queryKey: ['admin', 'children'],
    queryFn: () => adminApi.getChildren(),
  });

  const err =
    error instanceof Error
      ? error.message
      : error
        ? 'Gagal memuat daftar anak'
        : null;

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (
        !globalThis.confirm(
          `Hapus profil "${name}" beserta progresnya? Tindakan ini tidak bisa dibatalkan.`,
        )
      ) {
        return;
      }
      setDeletingId(id);
      try {
        await adminApi.deleteChild(id);
        await queryClient.invalidateQueries({
          queryKey: ['admin', 'children'],
        });
      } catch (e: unknown) {
        console.error(e);
      } finally {
        setDeletingId(null);
      }
    },
    [queryClient],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Manajemen Anak</h1>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            void downloadAdminCsv(
              '/api/admin/export/children.csv',
              'children.csv',
            )
          }
        >
          Unduh CSV
        </Button>
      </div>
      <p className="text-neutral-600">
        Daftar profil anak di perangkat ini (sumber:{' '}
        <code className="rounded bg-neutral-100 px-1">
          GET /api/admin/children
        </code>
        ).
      </p>
      {canDeleteChild ? (
        <p className="text-sm text-neutral-500">
          Super admin dan editor konten dapat menghapus profil dari tabel di
          bawah.
        </p>
      ) : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50">
            <tr>
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Mode</th>
              <th className="px-4 py-3 font-semibold">Avatar</th>
              <th className="px-4 py-3 font-semibold w-[1%] whitespace-nowrap">
                Aksi
              </th>
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
                <td className="px-4 py-3">
                  {canDeleteChild ? (
                    <Button
                      variant="secondary"
                      className="min-h-10 min-w-0 px-3 py-2 text-sm text-red-700 border-red-200 hover:bg-red-50"
                      disabled={deletingId !== null}
                      onClick={() => handleDelete(p.id, p.name)}
                    >
                      {deletingId === p.id ? 'Menghapus…' : 'Hapus'}
                    </Button>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isPending ? (
          <p className="px-4 py-6 text-center text-neutral-400">Memuat…</p>
        ) : null}
        {!err && !isPending && rows.length === 0 ? (
          <p className="px-4 py-6 text-center text-neutral-400">
            Belum ada profil anak.
          </p>
        ) : null}
      </div>
    </div>
  );
}
