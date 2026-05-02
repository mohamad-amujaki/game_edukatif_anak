import { effectiveReducedMotion } from '@/lib/game-feedback-sync';
import { useEffect } from 'react';

/** VO instruksi ringkas lewat Web Speech API (Bahasa Indonesia). */
export function useInstructionSpeech(text: string | undefined) {
  useEffect(() => {
    const t = text?.trim();
    if (!t || typeof window === 'undefined' || !window.speechSynthesis) return;
    if (effectiveReducedMotion()) return;

    const utter = new SpeechSynthesisUtterance(t);
    utter.lang = 'id-ID';
    utter.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [text]);
}
