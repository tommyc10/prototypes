/* One clock for every sheen on a page (see mn-skel in styles/ui.css). Put it on the page's
 * root. Each shape learns where it sits across the window (--sheen-x), so its slice of the
 * band lines up with every other shape's, and how far into the current pass the page already
 * is (--sheen-clock), so a shape that appears later joins the band already crossing instead of
 * starting its own. Shapes are found as they appear, and measured again when the window
 * resizes or a column is tucked away. */

import { useLayoutEffect, type RefObject } from 'react';

/** One pass of the band, in ms. The same as the mn-sheen animation. */
export const SHEEN_PASS = 2400;

export function useSheen(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const tag = () => {
      const now = performance.now();
      el.querySelectorAll<HTMLElement>('.mn-skel, [data-sheen-stale]').forEach((shape) => {
        shape.style.setProperty('--sheen-x', `${Math.round(shape.getBoundingClientRect().left)}px`);
        if (!shape.dataset.sheenClock) {
          shape.dataset.sheenClock = '';
          shape.style.setProperty('--sheen-clock', `${-(now % SHEEN_PASS)}ms`);
        }
      });
    };
    tag();
    const watch = new MutationObserver((records) => {
      // A row newly marked stale starts its light now, so it takes the clock afresh.
      for (const r of records) if (r.type === 'attributes' && (r.target as HTMLElement).hasAttribute('data-sheen-stale')) delete (r.target as HTMLElement).dataset.sheenClock;
      tag();
    });
    watch.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-sheen-stale'] });
    window.addEventListener('resize', tag);
    // The shell's columns slide when one is tucked away: measure again once they've settled.
    el.addEventListener('transitionend', tag);
    return () => {
      watch.disconnect();
      window.removeEventListener('resize', tag);
      el.removeEventListener('transitionend', tag);
    };
  }, [root]);
}
