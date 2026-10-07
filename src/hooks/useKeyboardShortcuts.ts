/* One key listener for the whole page. It decides who gets each key press, in order:
 *   0. While the tour is showing, it has the keyboard (see Tour.tsx).
 *   1. ⌘K always toggles the palette.
 *   2. While the palette is open, it handles its own keys.
 *   3. While a decision is open, only Esc (cancel) and ⌘↵ (submit) work.
 *   4. A popup marked `data-own-keys` (the group filter) handles its own keys.
 *   5. While typing in a field, keys are text; Esc, ↵ and ↓ leave the field.
 *   6. Keys held with ⌘, Ctrl or Alt are left for the browser.
 *   7. Otherwise, the key is looked up in `keys`. */

import { useEffect, useRef } from 'react';

interface Shortcuts {
  tourOpen: boolean;
  paletteOpen: boolean;
  onTogglePalette: () => void;
  /** Only pages with a decision form pass these three. */
  decisionOpen?: boolean;
  onCancelDecision?: () => void;
  onSubmitDecision?: () => void;
  /** Single-key shortcuts, e.g. `{ j: next, k: previous }`. */
  keys: Record<string, () => void>;
}

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  // The listener is added once, so it reads the latest values from this ref
  // instead of the ones from the first render (a "stale closure").
  const live = useRef(shortcuts);
  live.current = shortcuts;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = live.current;
      if (s.tourOpen) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        s.onTogglePalette();
        return;
      }
      if (s.paletteOpen) return;
      if (s.decisionOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          s.onCancelDecision?.();
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          s.onSubmitDecision?.();
        }
        return;
      }
      const target = e.target as HTMLElement;
      if (target.closest('[data-own-keys]')) return;
      if (/^(INPUT|TEXTAREA)$/.test(target.tagName) || target.isContentEditable) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'ArrowDown') {
          e.preventDefault();
          target.blur();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const run = s.keys[e.key];
      if (run) {
        e.preventDefault();
        run();
      }
    };
    // `true` = capture phase: the page hears the key before anything inside it.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);
}
