/* Tally: the light is the count. One streak per waiting suggestion, spaced evenly round the
 * card and as long as that pattern's share of last night. Deal with one and its light drains
 * away while the rest close ranks. */

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { NIGHT_TOTAL, ring, type BeamProps } from '../shared';
import './variants.css';

export function TallyBeam({ card, all, open, selectedId }: BeamProps) {
  const [length, setLength] = useState(0);
  // A gone streak keeps the place it had, so it fades where it was rather than jumping.
  const phases = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const el = card.current;
    if (!el) return;
    const measure = () => setLength(ring(el).length);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [card]);

  const ids = open.map((s) => s.id);

  return (
    <span className="pb-ring pb-tally" style={{ '--pb-ring': `${length}px` } as CSSProperties} aria-hidden>
      {all.map((s) => {
        const at = ids.indexOf(s.id);
        if (at >= 0) phases.current.set(s.id, (at / ids.length) * 100);
        return (
          <span
            key={s.id}
            className="pb-tally-streak"
            data-gone={at < 0 || undefined}
            data-on={s.id === selectedId || undefined}
            style={
              {
                '--pb-phase': `${phases.current.get(s.id) ?? 0}%`,
                '--pb-share': s.incidents / NIGHT_TOTAL,
              } as CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
