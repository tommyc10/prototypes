/* Ping: the edge is still. Every few seconds the amber count sends a light out both ways round
 * the card; the two meet on the far side and flare once. Deal with a suggestion and it pings
 * at once, as the number drops. Most of the time nothing moves. */

import { useEffect, useRef } from 'react';
import { reducedMotion, ring, type BeamProps } from '../shared';
import './variants.css';

const EVERY = 7000;
const TRAVEL = 1500;
const IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
const OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

export function PingBeam({ card, open, handled, collapsed }: BeamProps) {
  const cw = useRef<HTMLSpanElement>(null);
  const ccw = useRef<HTMLSpanElement>(null);
  const bloom = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reducedMotion() || open.length === 0) return;

    const ping = () => {
      const el = card.current;
      const count = el?.querySelector<HTMLElement>('[data-count]');
      if (!el || !count || !cw.current || !ccw.current || !bloom.current) return;
      const c = count.getBoundingClientRect();
      const from = ring(el).top(c.left + c.width / 2 - el.getBoundingClientRect().left);
      const at = (f: number) => `${f * 100}%`;
      // Half a lap each way, fading in as it leaves and out as it meets the other.
      const half = (dir: 1 | -1) =>
        [0, 0.1, 0.92, 1].map((offset) => ({
          offset,
          opacity: offset === 0 || offset === 1 ? 0 : 1,
          offsetDistance: at(from + (dir < 0 ? 1 : 0) + dir * offset * 0.5),
        }));

      cw.current.animate(half(1), { duration: TRAVEL, easing: IN_OUT });
      ccw.current.animate(half(-1), { duration: TRAVEL, easing: IN_OUT });
      bloom.current.style.offsetDistance = at(from + 0.5);
      bloom.current.animate(
        [
          { opacity: 0, transform: 'scaleX(0.2)' },
          { opacity: 1, transform: 'scaleX(1)', offset: 0.35 },
          { opacity: 0, transform: 'scaleX(1.3)' },
        ],
        { duration: 900, delay: TRAVEL * 0.85, easing: OUT },
      );
      count.style.display = 'inline-block';
      count.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)', offset: 0.3 }, { transform: 'scale(1)' }], {
        duration: 420,
        easing: OUT,
      });
    };

    const first = setTimeout(ping, handled > 0 ? 0 : 600);
    const timer = setInterval(ping, EVERY);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [card, handled, collapsed, open.length]);

  return (
    <span className="pb-ring" aria-hidden>
      <span ref={cw} className="pb-ping-streak" />
      <span ref={ccw} className="pb-ping-streak" data-ccw />
      <span ref={bloom} className="pb-ping-bloom" />
    </span>
  );
}

