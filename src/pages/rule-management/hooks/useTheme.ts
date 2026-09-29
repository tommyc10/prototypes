/* Light or dark. The theme lives on <html data-mn-theme>, so menus, ⌘K and toasts
 * (which render outside the page) follow it too. Switching dissolves the new theme
 * in over the old one (see styles/theme.css). */

import { useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('mn-theme') === 'light' ? 'light' : 'dark'));

  useLayoutEffect(() => {
    document.documentElement.dataset.mnTheme = theme;
    localStorage.setItem('mn-theme', theme);
  }, [theme]);

  const toggle = () => {
    // flushSync makes React update the page immediately, inside the transition's "after" snapshot.
    const apply = () => flushSync(() => setTheme(theme === 'dark' ? 'light' : 'dark'));
    if (!document.startViewTransition) return apply();
    document.startViewTransition(apply);
  };

  return [theme, toggle] as const;
}
