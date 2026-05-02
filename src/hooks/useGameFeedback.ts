import confetti from 'canvas-confetti';
import { useCallback, useEffect, useRef, useState } from 'react';

const WRONG_THROTTLE_MS = 150;
const CONFETTI_TICKS = 90;

function sfxEnabled(): boolean {
  try {
    return localStorage.getItem('game-sfx-enabled') !== 'false';
  } catch {
    return true;
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
  }
  return audioCtx;
}

async function resumeAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx?.state === 'suspended') await ctx.resume().catch(() => {});
}

function playCorrectTone(): void {
  if (!sfxEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const mk = (freq: number, dur: number, gain: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur);
  };
  mk(523.25, 0.08, 0.12);
  mk(659.25, 0.12, 0.1);
}

function playWrongSoft(): void {
  if (!sfxEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(180, t0);
  o.frequency.exponentialRampToValueAtTime(120, t0 + 0.08);
  g.gain.setValueAtTime(0.11, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + 0.23);
}

function burstConfetti(): void {
  if (prefersReducedMotion()) return;
  confetti({
    particleCount: 72,
    spread: 62,
    startVelocity: 28,
    ticks: CONFETTI_TICKS,
    gravity: 1.05,
    scalar: 0.95,
    origin: { x: 0.5, y: 0.72 },
  });
}

export function useGameFeedback() {
  const lastWrongAt = useRef(0);
  const [correctPulse, setCorrectPulse] = useState(false);

  useEffect(() => {
    if (!correctPulse) return;
    const id = window.setTimeout(() => setCorrectPulse(false), 380);
    return () => window.clearTimeout(id);
  }, [correctPulse]);

  const celebrateCorrect = useCallback(async () => {
    await resumeAudio();
    playCorrectTone();
    if (prefersReducedMotion()) {
      setCorrectPulse(true);
    } else {
      burstConfetti();
    }
  }, []);

  const warnWrong = useCallback(async () => {
    const now = Date.now();
    if (now - lastWrongAt.current < WRONG_THROTTLE_MS) return;
    lastWrongAt.current = now;
    await resumeAudio();
    playWrongSoft();
  }, []);

  const motionSafeRing = correctPulse
    ? 'ring-4 ring-math-400/50 scale-[1.02] transition-transform duration-300'
    : '';

  return { celebrateCorrect, warnWrong, motionSafeRing };
}
