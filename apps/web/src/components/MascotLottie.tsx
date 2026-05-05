import animationData from '@/assets/mascot-idle.json';
import { effectiveReducedMotion } from '@mainceria/utils';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { useCallback, useRef } from 'react';

export type MascotState = 'idle' | 'celebrate' | 'sleep';

const FALLBACK: Record<MascotState, string> = {
  idle: '🦊',
  celebrate: '🎉',
  sleep: '😴',
};

type Props = {
  state: MascotState;
  className?: string;
};

export function MascotLottie({ state, className }: Props) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const reduceMotion = effectiveReducedMotion();

  const applyPlayback = useCallback(() => {
    const inst = lottieRef.current;
    if (!inst || reduceMotion) return;
    const speed = state === 'celebrate' ? 1.35 : state === 'sleep' ? 0.42 : 1;
    inst.setSpeed(speed);
    if (state === 'celebrate') {
      inst.goToAndPlay(0, true);
    }
  }, [state, reduceMotion]);

  if (reduceMotion) {
    return (
      <span
        className={`inline-flex select-none items-center justify-center text-5xl ${className ?? ''}`}
        aria-hidden
      >
        {FALLBACK[state]}
      </span>
    );
  }

  return (
    <div
      className={`${className ?? ''} ${state === 'sleep' ? 'opacity-75 grayscale' : ''}`}
    >
      <Lottie
        key={state}
        lottieRef={lottieRef}
        animationData={animationData}
        loop={state !== 'celebrate'}
        className="h-full w-full"
        style={{ maxWidth: '100%', maxHeight: '100%' }}
        onDOMLoaded={applyPlayback}
      />
    </div>
  );
}
