/* The two bars that say how the population splits.
 *
 * Population: every ticket in the scope, by what happened to it. Each ticket is in exactly
 * one part, so the parts add up to the total.
 *
 * Partition: the tickets closed by hand, by what today's logic would say about each. Also one
 * part per ticket: a ticket that a rule and a window both explain is in "rule and window", not
 * in both. That's why these add up and the per-source counts beside them don't.
 *
 * Both morph to new figures when the scope changes (hooks/useTween), and every part is a
 * button that narrows the ticket list. A part and its key light each other up on hover. */

import { useState, type CSSProperties } from 'react';
import { num, pct } from '../../../../lib/format';
import { useTweenedNumbers } from '../../hooks/useTween';
import { GROUPS, GROUP_OF, VERDICTS, type Replay, type Verdict, type VerdictGroup } from '../../model/replay';
import { GROUP, GROUP_NOTE, LIFECYCLE, LIFE_KEYS, LIFE_TONE, VERDICT, VERDICT_TONE, type LifeKey } from '../../model/words';


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

/* ---------- partition: closed by hand, by verdict ---------- */

export type PartPick = { kind: 'group'; group: VerdictGroup } | { kind: 'verdict'; verdict: Verdict };

const KINDS: Record<VerdictGroup, Verdict[]> = {
  explained: VERDICTS.filter((v) => GROUP_OF[v] === 'explained'),
  unexplained: ['none', 'hypothetical'],
  unknown: VERDICTS.filter((v) => GROUP_OF[v] === 'unknown'),
};

/** Bar order: caught first, then not, then unknown, so the eye reads the ramp left to right. */
const BAR_ORDER: Verdict[] = ['rule', 'both', 'window', 'none', 'hypothetical', 'unevaluable', 'unavailable'];

const isPicked = (pick: PartPick | null, v: Verdict) => !!pick && (pick.kind === 'verdict' ? pick.verdict === v : GROUP_OF[v] === pick.group);

export function Partition({ verdicts, groups, picked, onPick }: { verdicts: Record<Verdict, number>; groups: Record<VerdictGroup, number>; picked: PartPick | null; onPick: (p: PartPick | null) => void }) {
  const shown = useTweenedNumbers({ ...verdicts, ...Object.fromEntries(GROUPS.map((g) => [`g:${g}`, groups[g]])) } as Record<string, number>);
  const total = GROUPS.reduce((n, g) => n + shown[`g:${g}`], 0);
  const [hot, setHot] = useState<Verdict | VerdictGroup | null>(null);
  const isHot = (v: Verdict) => hot === v || hot === GROUP_OF[v];
  const same = (a: PartPick | null, b: PartPick) => !!a && a.kind === b.kind && (a.kind === 'group' ? a.group === (b as { group: VerdictGroup }).group : a.verdict === (b as { verdict: Verdict }).verdict);
  const pick = (p: PartPick) => onPick(same(picked, p) ? null : p);

  return (
    <div className="ol-part">
      <div className="ol-seg-bar ol-wipe" data-size="tall" role="group" aria-label="Tickets closed by hand, by what today’s logic would say" data-picking={picked ? '' : undefined}>
        {BAR_ORDER.map((v) => (
          <button
            key={v}
            className="ol-segment"
            data-tone={VERDICT_TONE[v]}
            data-group={GROUP_OF[v]}
            data-picked={isPicked(picked, v) || undefined}
            data-hot={isHot(v) || undefined}
            data-empty={shown[v] < 0.5 || undefined}
            style={{ flexGrow: shown[v] } as CSSProperties}
            aria-pressed={isPicked(picked, v)}
            aria-label={`${VERDICT[v]}: ${num(verdicts[v])}`}
            onPointerEnter={() => setHot(v)}
            onPointerLeave={() => setHot(null)}
            onClick={() => pick({ kind: 'verdict', verdict: v })}
          />
        ))}
      </div>

      <div className="ol-part-key">
        {GROUPS.map((g, i) => (
          <section key={g} className="ol-part-group ol-fade" data-group={g} style={{ '--i': i } as CSSProperties} aria-label={GROUP[g]}>
            <button
              className="ol-part-head"
              data-picked={(picked?.kind === 'group' && picked.group === g) || undefined}
              aria-pressed={picked?.kind === 'group' && picked.group === g}
              onPointerEnter={() => setHot(g)}
              onPointerLeave={() => setHot(null)}
              onClick={() => pick({ kind: 'group', group: g })}
            >
              <span className="ol-part-name">{GROUP[g]}</span>
              <b className="ol-part-count">{num(Math.round(shown[`g:${g}`]))}</b>
              <span className="ol-part-share">{pct(share(shown[`g:${g}`], total))}</span>
            </button>
            <ul>
              {KINDS[g].map((v) => (
                <li key={v}>
                  <button
                    className="ol-key-btn"
                    data-picked={(picked?.kind === 'verdict' && picked.verdict === v) || undefined}
                    data-hot={hot === v || undefined}
                    aria-pressed={picked?.kind === 'verdict' && picked.verdict === v}
                    onPointerEnter={() => setHot(v)}
                    onPointerLeave={() => setHot(null)}
                    onClick={() => pick({ kind: 'verdict', verdict: v })}
                  >
                    <i className="ol-swatch" data-tone={VERDICT_TONE[v]} />
                    <span className="ol-key-label">{VERDICT[v]}</span>
                    <b>{num(Math.round(shown[v]))}</b>
                  </button>
                </li>
              ))}
            </ul>
            <p className="ol-part-note">{GROUP_NOTE[g]}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
