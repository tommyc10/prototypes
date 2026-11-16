/* Every ticket in the scope, by what happened to it. Each ticket is in exactly one part, so
 * the parts add up to the total. (The verdict bar, for the tickets closed by hand, lives in
 * Chapters/Verdict.tsx.)
 *
 * It morphs to new figures when the scope changes (hooks/useTween), and every part is a
 * button that narrows the ticket dock. A part and its key light each other up on hover. */

import { useState, type CSSProperties } from 'react';
import { num, pct } from '../../../../lib/format';
import { useTweenedNumbers } from '../../hooks/useTween';
import type { Replay } from '../../model/replay';
import { LIFECYCLE, LIFE_KEYS, LIFE_TONE, type LifeKey } from '../../model/words';


const share = (n: number, of: number) => (of > 0 ? n / of : 0);

/* ---------- population ---------- */

export function Population({ population, picked, onPick }: { population: Replay['population']; picked: LifeKey | null; onPick: (k: LifeKey | null) => void }) {
  const shown = useTweenedNumbers(Object.fromEntries(LIFE_KEYS.map((k) => [k, population[k]])) as Record<LifeKey, number>);
  const total = useTweenedNumbers({ total: population.total }).total;
  const [hot, setHot] = useState<LifeKey | null>(null);
  const pick = (k: LifeKey) => onPick(picked === k ? null : k);

  return (
    <div className="ol-pop">
      <div className="ol-seg-bar ol-wipe" role="group" aria-label="Every ticket, by what happened to it" data-picking={picked ? '' : undefined}>
        {LIFE_KEYS.map((k) => (
          <button
            key={k}
            className="ol-segment"
            data-tone={LIFE_TONE[k]}
            data-picked={picked === k || undefined}
            data-hot={hot === k || undefined}
            data-empty={shown[k] < 0.5 || undefined}
            style={{ flexGrow: shown[k] } as CSSProperties}
            aria-pressed={picked === k}
            aria-label={`${LIFECYCLE[k]}: ${num(population[k])}`}
            onPointerEnter={() => setHot(k)}
            onPointerLeave={() => setHot(null)}
            onClick={() => pick(k)}
          />
        ))}
      </div>
      <ul className="ol-pop-key">
        {LIFE_KEYS.map((k, i) => (
          <li key={k} style={{ '--i': i } as CSSProperties} className="ol-fade">
            <button
              className="ol-key-btn"
              data-picked={picked === k || undefined}
              data-hot={hot === k || undefined}
              aria-pressed={picked === k}
              onPointerEnter={() => setHot(k)}
              onPointerLeave={() => setHot(null)}
              onClick={() => pick(k)}
            >
              <i className="ol-swatch" data-tone={LIFE_TONE[k]} />
              <span className="ol-key-label">{LIFECYCLE[k]}</span>
              <b>{num(Math.round(shown[k]))}</b>
              <span className="ol-key-share">{pct(share(shown[k], total))}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
