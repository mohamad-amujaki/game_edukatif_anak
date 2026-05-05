import { effectiveReducedMotion } from '@mainceria/utils';
import { useEffect } from 'react';

/** VO instruksi ringkas lewat Web Speech API (id-ID atau en-US). */
export function useInstructionSpeech(
  text: string | undefined,
  utterLang: 'id-ID' | 'en-US' = 'id-ID',
) {
  useEffect(() => {
    const t = text?.trim();
    if (!t || typeof window === 'undefined' || !window.speechSynthesis) return;
    if (effectiveReducedMotion()) return;

    const utter = new SpeechSynthesisUtterance(t);
    utter.lang = utterLang;
    utter.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [text, utterLang]);
}
