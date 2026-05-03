import { adminApi } from '@/api-admin';
import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/auth-client';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export function AdminActivityEditorPage({
  activityId,
}: {
  activityId: string;
}) {
  const { data: session } = authClient.useSession();
  const canEdit =
    session?.user?.role === 'super_admin' ||
    session?.user?.role === 'content_editor';

  const [title, setTitle] = useState('');
  const [voiceOverKeys, setVoiceOverKeys] = useState('');
  const [estimatedSec, setEstimatedSec] = useState(180);
  const [payload, setPayload] = useState('');
  const [meta, setMeta] = useState<{
    type: string;
    order: number;
    levelTitle: string;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activityId) return;
    setLoading(true);
    adminApi
      .getActivity(activityId)
      .then((a) => {
        setTitle(a.title);
        setVoiceOverKeys(a.voiceOverKeys);
        setEstimatedSec(a.estimatedSec);
        setPayload(a.payload);
        setMeta({
          type: a.type,
          order: a.order,
          levelTitle: a.level.title,
        });
        setErr(null);
      })
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : 'Gagal memuat aktivitas'),
      )
      .finally(() => setLoading(false));
  }, [activityId]);

  const save = async () => {
    if (!activityId || !canEdit) return;
    setErr(null);
    setSaved(false);
    try {
      await adminApi.patchActivity(activityId, {
        title,
        voiceOverKeys,
        estimatedSec,
        payload,
      });
      setSaved(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan');
    }
  };

  if (loading && !meta) {
    return (
      <div className="space-y-4">
        <p className="text-neutral-500">Memuat…</p>
      </div>
    );
  }

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
          <h1 className="mt-2 text-3xl font-bold">Editor aktivitas</h1>
          {meta ? (
            <p className="mt-1 text-sm text-neutral-600">
              {meta.levelTitle} · {meta.type} · urutan {meta.order}
            </p>
          ) : null}
        </div>
        <Link
          to="/admin/banks/$activityId"
          params={{ activityId }}
          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Edit bank soal
        </Link>
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {saved ? (
        <p className="text-sm text-green-700">Perubahan disimpan.</p>
      ) : null}

      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">Judul</span>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">
            Voice-over keys
          </span>
          <input
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm"
            value={voiceOverKeys}
            onChange={(e) => setVoiceOverKeys(e.target.value)}
            disabled={!canEdit}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">
            Perkiraan durasi (detik)
          </span>
          <input
            type="number"
            min={1}
            className="mt-1 w-32 rounded-lg border border-neutral-200 px-3 py-2"
            value={estimatedSec}
            onChange={(e) => setEstimatedSec(Number(e.target.value))}
            disabled={!canEdit}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-neutral-700">
            Payload (JSON)
          </span>
          {meta ? (
            <PayloadPreview activityType={meta.type} raw={payload} />
          ) : null}
          <textarea
            className="mt-1 min-h-[240px] w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-xs"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            disabled={!canEdit}
            spellCheck={false}
          />
        </label>
        {canEdit ? (
          <Button type="button" onClick={() => void save()}>
            Simpan
          </Button>
        ) : (
          <p className="text-sm text-neutral-500">
            Hanya super_admin dan content_editor yang dapat mengedit konten.
          </p>
        )}
      </div>
    </div>
  );
}

function PayloadPreview({
  activityType,
  raw,
}: {
  activityType: string;
  raw: string;
}) {
  const lines: string[] = [];
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (typeof o.instruction === 'string') {
      const t = o.instruction;
      lines.push(`instruction: ${t.length > 100 ? `${t.slice(0, 100)}…` : t}`);
    }
    if (Array.isArray(o.pairs)) lines.push(`pairs: ${o.pairs.length} item`);
    if (Array.isArray(o.questions))
      lines.push(`questions: ${o.questions.length} item`);
    lines.push(`keys root: ${Object.keys(o).join(', ') || '—'}`);
  } catch {
    lines.push('JSON belum valid — perbaiki untuk preview struktur.');
  }
  return (
    <div className="mb-2 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
      <p className="font-semibold text-neutral-900">Ringkas payload</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-neutral-500">
        {activityType}
      </p>
      <ul className="mt-2 space-y-1 font-mono text-[11px]">
        {lines.map((l, i) => (
          <li key={i} className="break-words">
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}
