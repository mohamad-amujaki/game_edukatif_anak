import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@mainceria/ui';
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalonePwa(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      Boolean(
        (
          window.navigator as Navigator & {
            standalone?: boolean;
          }
        ).standalone,
      ))
  );
}

/**
 * Prompt pasang aplikasi (`beforeinstallprompt`) + banner saat ada service worker baru
 * ([vite-plugin-pwa](https://vite-pwa-org.netlify.app/) `registerType: 'prompt'`).
 */
export function PwaPrompts() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installDismissed, setInstallDismissed] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  useEffect(() => {
    if (!deferred || installDismissed || isStandalonePwa()) {
      setShowInstall(false);
      return;
    }
    setShowInstall(true);
  }, [deferred, installDismissed]);

  const onInstallClick = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice.catch(() => {});
    } finally {
      setDeferred(null);
      setShowInstall(false);
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-[100] flex flex-col items-center gap-3 px-4 sm:left-auto sm:right-4 sm:w-full sm:max-w-md">
      {offlineReady ? (
        <div className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-lg">
          <p className="flex-1 text-neutral-700" aria-live="polite">
            Konten dasar bisa dipakai offline.
          </p>
          <button
            type="button"
            className="ml-auto shrink-0 text-sm font-semibold text-primary-600 underline"
            onClick={() => setOfflineReady(false)}
          >
            Tutup
          </button>
        </div>
      ) : null}

      {needRefresh ? (
        <div className="pointer-events-auto flex w-full flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm shadow-lg ring-1 ring-amber-100">
          <span className="min-w-[12rem] font-medium text-amber-950">
            Versi baru aplikasi sudah ada. Muat ulang untuk memakai pembaruan.
          </span>
          <div className="ml-auto flex shrink-0 gap-2">
            <Button
              variant="secondary"
              className="!py-1.5 text-sm"
              type="button"
              onClick={() => setNeedRefresh(false)}
            >
              Nanti
            </Button>
            <Button
              className="!py-1.5 text-sm"
              type="button"
              onClick={() => void updateServiceWorker(true)}
            >
              Muat ulang
            </Button>
          </div>
        </div>
      ) : null}

      {showInstall && deferred ? (
        <div className="pointer-events-auto flex w-full flex-wrap items-center gap-3 rounded-2xl border border-primary-200 bg-white px-4 py-3 text-sm shadow-lg ring-1 ring-primary-100">
          <span className="min-w-[10rem] font-medium text-neutral-800">
            Pasang di layar utama untuk akses lebih cepat.
          </span>
          <div className="ml-auto flex shrink-0 gap-2">
            <Button
              variant="secondary"
              className="!py-1.5 text-sm"
              type="button"
              onClick={() => {
                setInstallDismissed(true);
                setShowInstall(false);
              }}
            >
              Tutup
            </Button>
            <Button
              className="!py-1.5 text-sm"
              type="button"
              onClick={() => void onInstallClick()}
            >
              Pasang
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
