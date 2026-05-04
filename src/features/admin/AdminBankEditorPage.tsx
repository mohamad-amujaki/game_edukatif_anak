import { adminApi } from '@/api-admin';
import { Button } from '@/components/ui/Button';
import { BankItemsPreviewGrid } from '@/features/admin/bank-item-preview';
import { authClient } from '@/lib/auth-client';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export function AdminBankEditorPage({ activityId }: { activityId: string }) {
  const { data: session } = authClient.useSession();
  const canEdit =
    session?.user?.role === 'super_admin' ||
    session?.user?.role === 'content_editor';

  const [text, setText] = useState('');
  const [activityType, setActivityType] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activityId) return;
    setLoading(true);
    adminApi
      .getBank(activityId)
      .then(({ items, activityType: t }) => {
        setText(JSON.stringify(items, null, 2));
        setActivityType(t);
        setErr(null);
      })
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : 'Gagal memuat bank'),
      )
      .finally(() => setLoading(false));
  }, [activityId]);

  const save = async () => {
    if (!activityId || !canEdit) return;
    setErr(null);
    setSaved(false);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      setErr('JSON tidak valid.');
      return;
    }
    if (!Array.isArray(parsed)) {
      setErr('Bank harus berupa array JSON.');
      return;
    }
    try {
      await adminApi.putBank(activityId, parsed);
      setSaved(true);
    } catch (e: unknown) {
      const base = e instanceof Error ? e.message : 'Gagal menyimpan';
      const det = e as Error & { details?: unknown };
      const extra =
        det.details != null ? `\n${JSON.stringify(det.details, null, 2)}` : '';
      setErr(base + extra);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/admin/content"
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            ← Kembali ke konten
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Editor bank soal</h1>
          <p className="mt-1 font-mono text-xs text-neutral-500">
            {activityId}
          </p>
          {activityType ? (
            <p className="mt-1 text-sm text-neutral-600">{activityType}</p>
          ) : null}
        </div>
        <Link
          to="/admin/content/activities/$activityId"
          params={{ activityId }}
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Edit aktivitas
        </Link>
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {saved ? (
        <p className="text-sm text-green-700">Bank soal disimpan.</p>
      ) : null}

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-neutral-500">Memuat…</p>
        ) : (
          <>
            <label className="block">
              <span className="text-sm font-medium text-neutral-700">
                Item bank (array JSON)
              </span>
              <textarea
                className="mt-2 min-h-[320px] w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-xs"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={!canEdit}
                spellCheck={false}
              />
            </label>
            <div className="mt-6 rounded-2xl border border-dashed border-primary-200 bg-primary-50/40 p-4">
              <h2 className="text-sm font-semibold text-neutral-900">
                Preview kartu per item (mini-game)
              </h2>
              <p className="mt-1 text-xs text-neutral-600">
                Membantu QA konten tanpa bermain sebagai anak.
              </p>
              <div className="mt-4">
                <BankItemsPreviewGrid
                  activityType={activityType}
                  itemsJson={text}
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              Untuk matching/susun, server menyimpan ke field{' '}
              <code className="rounded bg-neutral-100 px-1">pairs</code>; untuk
              tipe lain ke{' '}
              <code className="rounded bg-neutral-100 px-1">questions</code>.
            </p>
            {canEdit ? (
              <div className="mt-4">
                <Button type="button" onClick={() => void save()}>
                  Simpan bank
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                Hanya super_admin dan content_editor yang dapat mengedit bank.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
