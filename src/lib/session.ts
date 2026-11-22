/* Whether this tab is signed in. Kept in sessionStorage so a reload goes straight back in, the
 * way a cached token does in the real app (where MSAL or the like replaces this file), and
 * mirrored in memory for a private window that refuses storage. */

import { useSyncExternalStore } from 'react';

const KEY = 'mn-session';
const listeners = new Set<() => void>();

let current: string | null = (() => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
})();

function set(value: string | null) {
  current = value;
  try {
    if (value) sessionStorage.setItem(KEY, value);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* private window: memory still holds it for this visit */
  }
  listeners.forEach((listener) => listener());
}

export const startSession = (email: string) => set(email);
export const endSession = () => set(null);

/** Whether someone is signed in, re-rendering when that changes. */
export function useSession() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current !== null,
  );
}
