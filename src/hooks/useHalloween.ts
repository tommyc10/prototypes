/* Halloween mode: a costume the app can wear for the last weeks of October, after Tesla's
 * Halloween mode. It sits over the dark theme and changes nothing about what anything means:
 * status colours stay where they are (see styles/halloween.css).
 *
 * It lives on <html data-mn-halloween>, like the theme, so menus, ⌘K and toasts wear it too.
 * One store for the whole app, so the banner's switch, ⌘K and the theme button agree.
 * Turning it on flickers the lights once; turning it off dissolves, like a theme switch. */

import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

const KEY = 'mn-halloween';
const listeners = new Set<() => void>();

/** October, and the night after Halloween. The real date: the prototype's frozen clock reads September. */
export function inSeason(date = new Date()) {
  return date.getMonth() === 9 || (date.getMonth() === 10 && date.getDate() === 1);
}

let on = inSeason() && localStorage.getItem(KEY) === '1';
document.documentElement.toggleAttribute('data-mn-halloween', on);

/** Without a transition: for callers already inside one (the theme button). */
export function writeHalloween(next: boolean) {
  if (next === on) return;
  on = next;
  localStorage.setItem(KEY, next ? '1' : '0');
  document.documentElement.toggleAttribute('data-mn-halloween', next);
  listeners.forEach((listener) => listener());
}

export function setHalloween(next: boolean) {
  if (next === on) return;
  const apply = () => flushSync(() => writeHalloween(next));
  if (!document.startViewTransition) return apply();
  const root = document.documentElement;
  if (next) root.dataset.mnFlicker = '';
  document.startViewTransition(apply).finished.finally(() => delete root.dataset.mnFlicker);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHalloween() {
  return useSyncExternalStore(subscribe, () => on);
}
