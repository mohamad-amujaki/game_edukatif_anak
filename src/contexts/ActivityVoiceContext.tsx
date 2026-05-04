import type { ActivityVoiceOverPayload } from '@server/schemas';
import { type ReactNode, createContext, useContext } from 'react';

const ActivityVoiceContext = createContext<ActivityVoiceOverPayload | null>(
  null,
);

export function ActivityVoiceProvider({
  bundle,
  children,
}: {
  bundle: ActivityVoiceOverPayload | null | undefined;
  children: ReactNode;
}) {
  return (
    <ActivityVoiceContext.Provider value={bundle ?? null}>
      {children}
    </ActivityVoiceContext.Provider>
  );
}

export function useActivityVoice(): ActivityVoiceOverPayload | null {
  return useContext(ActivityVoiceContext);
}
