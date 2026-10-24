/* Thread: nothing on the page moves. The shapes sit still, the old rows dim, and one 2px
 * thread across the top of whatever is waiting fills as the page loads. When both columns
 * wait it spans both, and it only finishes when the last of them is in, so the page reports
 * one load, not two.
 *
 * The thread rushes to a fifth, then crawls towards nine tenths and never claims more than
 * it knows; when everything is in, it fills the rest quickly and fades. */

import { useEffect, useRef } from 'react';
import type { OverlayProps } from '../shared';
import { placeholderVariant } from './placeholders';

function ThreadOverlay({ list, detail, listLeft, detailLeft }: OverlayProps) {
  const busy = list || detail;
  const bar = useRef<HTMLSpanElement>(null);
  const running = useRef<Animation | null>(null);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (busy) {
      running.current?.cancel();
      running.current = reduce
        ? el.animate([{ opacity: 0.35, transform: 'scaleX(1)' }, { opacity: 1, transform: 'scaleX(1)' }], { duration: 900, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' })
        : el.animate(
            [{ transform: 'scaleX(0)' }, { transform: 'scaleX(0.22)', offset: 0.04 }, { transform: 'scaleX(0.9)' }],
            { duration: 9000, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' },
          );
    } else if (running.current) {
      const from = getComputedStyle(el).transform;
      running.current.cancel();
      running.current = el.animate(
        [
          { transform: reduce ? 'scaleX(1)' : from, opacity: 1 },
          { transform: 'scaleX(1)', opacity: 1, offset: 0.45 },
          { transform: 'scaleX(1)', opacity: 0 },
        ],
        { duration: 460, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' },
      );
    }
  }, [busy]);

  // Spans whatever is waiting: the list alone, the pane alone, or both.
  const left = list ? listLeft : detailLeft;
  const width = list && !detail ? detailLeft - listLeft : undefined;
  return (
    <div className="ld-thread-track" style={{ left, width, right: width === undefined ? 0 : undefined }} aria-hidden>
      <span ref={bar} className="ld-thread-bar" />
    </div>
  );
}

export const thread = {
  ...placeholderVariant({ name: 'Thread', idea: 'Nothing moves but one hairline across the top of whatever is loading', className: 'ld-thread' }),
  Overlay: ThreadOverlay,
  badge: null,
};
