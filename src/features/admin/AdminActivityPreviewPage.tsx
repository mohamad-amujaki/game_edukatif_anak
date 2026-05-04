import { adminApi } from '@/api-admin';
import { ActivityPlayer } from '@/features/ActivityPlayer';
import { authClient } from '@/lib/auth-client';
import type { ActivityVoiceOverPayload } from '@server/schemas';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function AdminActivityPreviewPage({
  activityId,
}: {
  activityId: string;
}) {
  const { data: session } = authClient.useSession();
  const canPreview = Boolean(session);

  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replayKey, setReplayKey] = useState(0);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [payload, setPayload] = useState<unknown>(null);
  const [voiceBundle, setVoiceBundle] = useState<
    ActivityVoiceOverPayload | undefined
  >(undefined);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!activityId) return;
    setLoading(true);
    setErr(null);
    adminApi
      .getActivity(activityId)
      .then((a) => {
        setTitle(a.title);
        setType(a.type);
        try {
          setPayload(JSON.parse(a.payload) as unknown);
        } catch {
          setPayload(null);
          setErr('Payload JSON tidak valid.');
        }
        try {
          const voice = JSON.parse(a.voiceOverKeys) as ActivityVoiceOverPayload;
          setVoiceBundle(
            typeof voice.instruksi === 'string' && voice.instruksi.trim()
              ? voice
              : undefined,
          );
        } catch {
          setVoiceBundle(undefined);
        }
      })
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e.message : 'Gagal memuat aktivitas'),
      )
      .finally(() => setLoading(false));
  }, [activityId]);

  useEffect(() => {
    load();
  }, [load]);

  const playerPayload = useMemo(() => payload ?? {}, [payload]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-2">
      <div>
        <Link
          to="/admin/content/activities/$activityId"
          params={{ activityId }}
          className="text-sm font-medium text-primary-600 hover:underline"
        >
          ← Kembali ke editor
        </Link>
        <h1 className="mt-3 text-2xl font-bold">Pratinjau aktivitas</h1>
        <p className="mt-1 text-sm text-neutral-600">{title}</p>
        <p className="font-mono text-xs text-neutral-500">{activityId}</p>
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {toast ? (
        <p className="rounded-xl bg-neutral-900 px-3 py-2 text-center text-sm text-white">
          {toast}
        </p>
      ) : null}

      {loading ? (
        <p className="text-neutral-500">Memuat…</p>
      ) : canPreview && type && payload !== null ? (
        <>
          <ActivityPlayer
            key={replayKey}
            previewMode
            activityType={type}
            title={title}
            payload={playerPayload}
            voiceOver={voiceBundle}
            onComplete={({ mistakes, score, maxScore }) => {
              window.setTimeout(() => setToast(null), 4000);
              setToast(
                `Selesai (pratinjau): salah ${mistakes}, skor ${score}/${maxScore} — tidak disimpan.`,
              );
            }}
          />
          <div className="flex justify-center">
            <button
              type="button"
              className="text-sm font-medium text-primary-600 underline"
              onClick={() => {
                setToast(null);
                setReplayKey((k) => k + 1);
              }}
            >
              Ulang sesi pratinjau
            </button>
          </div>
        </>
      ) : (
        <p className="text-neutral-500">Masuk sebagai admin untuk pratinjau.</p>
      )}
    </div>
  );
}
