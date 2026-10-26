/* Light or dark. The theme lives on <html data-mn-theme>, so menus, ⌘K and toasts
 * (which render outside the page) follow it too. Switching dissolves the new theme
 * in over the old one (see styles/theme.css).
 *
 * Halloween mode is a night, so while it's on the page shows dark whatever you picked, and
 * your pick comes back when it ends. Asking for light while it's on takes the costume off. */

import { useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { useHalloween, writeHalloween } from './useHalloween';

export type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('mn-theme') === 'light' ? 'light' : 'dark'));
  const halloween = useHalloween();
  const shown: Theme = halloween ? 'dark' : theme;

  useLayoutEffect(() => {
    document.documentElement.dataset.mnTheme = shown;
  }, [shown]);

  useLayoutEffect(() => {
    localStorage.setItem('mn-theme', theme);
  }, [theme]);

  const toggle = () => {
    // flushSync makes React update the page immediately, inside the transition's "after" snapshot.
    const apply = () =>
      flushSync(() => {
        writeHalloween(false);
        setTheme(shown === 'dark' ? 'light' : 'dark');
      });
    if (!document.startViewTransition) return apply();
    document.startViewTransition(apply);
  };

  return [shown, toggle] as const;
}
