/* Follow: the light goes where the decision is. With nothing from last night selected it
 * travels as it does today. Select a suggestion and it runs on to that row, slows, and settles
 * as a rail on the card's left edge, with a second rail lighting on the right: the card holding
 * the row you are deciding on. Select a rule below and it lets go and travels again. */

import { useLayoutEffect, useRef } from 'react';
import { reducedMotion, ring, type BeamProps } from '../shared';
import './variants.css';

const LAP = 9000;
const STREAK = 160;
const OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

type Mode = 'travel' | 'parked';

const at = (f: number) => `${f * 100}%`;
const where = (el: HTMLElement) => parseFloat(getComputedStyle(el).offsetDistance) / 100 || 0;

export function FollowBeam({ card, open, selectedId, collapsed }: BeamProps) {
  const light = useRef<HTMLSpanElement>(null);
  const echo = useRef<HTMLSpanElement>(null);
  const mode = useRef<Mode | null>(null);

  useLayoutEffect(() => {
    const el = card.current;
    const head = light.current;
    const tail = echo.current;
    if (!el || !head || !tail) return;

    const still = reducedMotion();
    const row = selectedId && !collapsed ? el.querySelector<HTMLElement>(`[data-id="${selectedId}"]`) : null;
    const now = where(head);
    const was = mode.current;
    head.getAnimations().forEach((a) => a.cancel());
    tail.getAnimations().forEach((a) => a.cancel());

    if (!row) {
      mode.current = 'travel';
      head.removeAttribute('data-parked');
      head.style.setProperty('--pb-scale', '1');
      head.style.opacity = still ? '0' : '';
      if (!still) head.animate([{ offsetDistance: at(now) }, { offsetDistance: at(now + 1) }], { duration: LAP, iterations: Infinity });
      tail.animate([{ opacity: was === 'parked' ? 1 : 0 }, { opacity: 0 }], { duration: 200, easing: OUT, fill: 'forwards' });
      return;
    }

    mode.current = 'parked';
    const g = ring(el);
    // The light runs upward on the left edge, so its head sits at the row's top; on the right
    // edge it runs downward, so the echo's head sits at the row's bottom.
    const target = g.left(row.offsetTop);
    let to = target;
    let duration = 340;
    if (was === 'travel') {
      // Carry on forward, the way it was already going, and slow into place.
      while (to < now) to += 1;
      duration = 500 + 700 * (to - now);
    } else {
      to = target + Math.round(now - target);
    }
    if (still) duration = 0;

    head.style.opacity = '';
    head.setAttribute('data-parked', '');
    head.style.setProperty('--pb-scale', String(row.offsetHeight / STREAK));
    head.animate([{ offsetDistance: at(now) }, { offsetDistance: at(to) }], { duration, easing: OUT, fill: 'forwards' });

    const echoTo = at(g.right(row.offsetTop + row.offsetHeight));
    tail.style.setProperty('--pb-scale', String(row.offsetHeight / STREAK));
    if (was === 'parked') {
      tail.animate([{ offsetDistance: tail.style.offsetDistance || echoTo, opacity: 1 }, { offsetDistance: echoTo, opacity: 1 }], {
        duration,
        easing: OUT,
        fill: 'forwards',
      });
    } else {
      tail.animate([{ opacity: 0 }, { opacity: 1 }], { duration: still ? 0 : 300, delay: duration * 0.6, easing: OUT, fill: 'forwards' });
    }
    tail.style.offsetDistance = echoTo;
  }, [card, selectedId, collapsed, open.length]);

  return (
    <span className="pb-ring" aria-hidden>
      <span ref={light} className="pb-follow-light" />
      <span ref={echo} className="pb-follow-light" data-echo data-parked />
    </span>
  );
}
