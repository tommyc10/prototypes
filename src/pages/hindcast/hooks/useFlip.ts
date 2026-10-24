/* Rows that slide to their new place when a ranked list reorders (root causes, services,
 * causes ahead), instead of teleporting. Each child marked [data-flip="<key>"] remembers
 * where it sat; after a change it starts from there and glides to where it is now. Transform
 * only, on the same curve and duration as the chart morphs. Asked for less motion, rows simply
 * take their new place. */

import { useLayoutEffect, useRef, type RefObject } from 'react';
import { MORPH_MS, isSnapping } from './useTween';

export function useFlip(container: RefObject<HTMLElement | null>, order: string) {
  const last = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || isSnapping();
    const next = new Map<string, number>();
    el.querySelectorAll<HTMLElement>('[data-flip]').forEach((row) => {
      const key = row.dataset.flip!;
      const top = row.offsetTop;
      next.set(key, top);
      const before = last.current.get(key);
      if (reduce || before === undefined || before === top) return;
      row.animate([{ transform: `translateY(${before - top}px)` }, { transform: 'none' }], {
        duration: MORPH_MS,
        easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
      });
    });
    last.current = next;
  }, [container, order]);
}
