import { atomWithStorage } from 'jotai/utils';

export const parentSessionAtom = atomWithStorage<string | null>(
  'parent-session-v1',
  null,
);

export const lastChildIdAtom = atomWithStorage<string | null>(
  'last-child-id-v1',
  null,
);
