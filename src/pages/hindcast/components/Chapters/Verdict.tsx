/* Chapter one: the answer. One sentence with the share in words, the bar of every ticket
 * closed by hand by its verdict, the three groups as a scoreboard, and the weeks.
 * Every part is a button that narrows the ticket dock to exactly what it counts. */

import { useState, type CSSProperties } from 'react';
import { num, pct } from '../../../../lib/format';
import { useTweenedNumbers } from '../../hooks/useTween';
import { inWords } from '../../model/chapters';
import type { Focus } from '../../model/narrow';
import { GROUPS, GROUP_OF, type Replay, type Verdict, type VerdictGroup } from '../../model/replay';
import { GROUP, GROUP_NOTE, VERDICT, VERDICT_TONE } from '../../model/words';
import { Panel } from '../Panel/Panel';
import { WeekChart, WeekTable, type WeekRange } from '../Replay/WeekChart';

/** Caught first, then not, then unknown, so the eye reads the ramp left to right. */
const BAR_ORDER: Verdict[] = ['rule', 'both', 'window', 'none', 'hypothetical', 'unevaluable', 'unavailable'];
const KINDS: Record<VerdictGroup, Verdict[]> = {
  explained: ['rule', 'both', 'window'],
  unexplained: ['none', 'hypothetical'],
  unknown: ['unevaluable', 'unavailable'],
};

type Pick = Extract<Focus, { kind: 'group' } | { kind: 'verdict' }>;
const same = (a: Focus | null, b: Pick) => !!a && a.kind === b.kind && (a.kind === 'group' ? a.group === (b as { group: VerdictGroup }).group : (a as { verdict: Verdict }).verdict === (b as { verdict: Verdict }).verdict);
/** "3 in 4 tickets closed by hand have…", worded so every share reads as a sentence. */
function verdictWords(unexplained: number, hand: number) {
  if (unexplained === 0) return { lead: 'Every ticket', rest: 'closed by hand is explained, or couldn’t be checked.' };
  const share = inWords(unexplained / hand);
  if (share === 'All') return { lead: 'Every ticket', rest: 'closed by hand has nothing running today to explain it.' };
  return { lead: share.endsWith('%') ? `${share} of tickets` : `${share} tickets`, rest: 'closed by hand have nothing running today to explain them.' };
}

const lit = (f: Focus | null, v: Verdict) => !!f && ((f.kind === 'verdict' && f.verdict === v) || (f.kind === 'group' && f.group === GROUP_OF[v]));

export function VerdictChapter({ r, focus, onFocus, range, onRange }: { r: Replay; focus: Focus | null; onFocus: (f: Focus | null) => void; range: WeekRange | null; onRange: (w: WeekRange | null) => void }) {
  const hand = r.population.closedByHand;
  const shown = useTweenedNumbers({ ...r.verdicts, ...Object.fromEntries(GROUPS.map((g) => [`g:${g}`, r.groups[g]])) } as Record<string, number>);
  const [hot, setHot] = useState<Verdict | VerdictGroup | null>(null);
  const pick = (p: Pick) => onFocus(same(focus, p) ? null : p);
  const picking = !!focus && (focus.kind === 'group' || focus.kind === 'verdict');

  const words = verdictWords(r.groups.unexplained, hand);

  if (hand === 0) return <p className="ol-empty">Nothing in this scope was closed by hand, so there’s nothing for the replay to judge.</p>;

  return (
    <div className="ol-ch">
      <p className="ol-vline ol-fade">
        <b>{words.lead}</b> {words.rest} <span>{num(r.groups.explained)} would be explained and {num(r.groups.unknown)} couldn’t be checked, of {num(hand)}.</span>
      </p>

      <div className="ol-seg-bar ol-vbar ol-wipe" role="group" aria-label="Tickets closed by hand, by verdict" data-picking={picking || undefined}>
        {BAR_ORDER.map((v) => (
          <button
            key={v}
            className="ol-segment"
            data-tone={VERDICT_TONE[v]}
            data-picked={lit(focus, v) || undefined}
            data-hot={hot === v || hot === GROUP_OF[v] || undefined}
            data-empty={shown[v] < 0.5 || undefined}
            style={{ flexGrow: shown[v] } as CSSProperties}
            aria-pressed={lit(focus, v)}
            aria-label={`${VERDICT[v]}: ${num(r.verdicts[v])}`}
            title={`${VERDICT[v]}: ${num(r.verdicts[v])}`}
            onPointerEnter={() => setHot(v)}
            onPointerLeave={() => setHot(null)}
            onClick={() => pick({ kind: 'verdict', verdict: v })}
          />
        ))}
      </div>

      <div className="ol-vgrid">
      <div className="ol-vboard">
        {GROUPS.map((g, i) => {
          const on = focus?.kind === 'group' && focus.group === g;
          return (
            <section key={g} className="ol-vtile ol-fade" data-group={g} data-picked={on || undefined} style={{ '--i': i } as CSSProperties}>
              <button className="ol-vtile-head" aria-pressed={on} title={GROUP_NOTE[g]} onPointerEnter={() => setHot(g)} onPointerLeave={() => setHot(null)} onClick={() => pick({ kind: 'group', group: g })}>
                <span className="ol-vtile-name">{GROUP[g]}</span>
                <span className="ol-vtile-num">
                  <b>{num(Math.round(shown[`g:${g}`]))}</b>
                  <small>{pct(r.groups[g] / hand)}</small>
                </span>
              </button>
              <ul>
                {KINDS[g].map((v) => {
                  const vOn = focus?.kind === 'verdict' && focus.verdict === v;
                  return (
                    <li key={v}>
                      <button className="ol-key-btn" data-picked={vOn || undefined} data-hot={hot === v || undefined} aria-pressed={vOn} onPointerEnter={() => setHot(v)} onPointerLeave={() => setHot(null)} onClick={() => pick({ kind: 'verdict', verdict: v })}>
                        <i className="ol-swatch" data-tone={VERDICT_TONE[v]} />
                        <span className="ol-key-label">{VERDICT[v]}</span>
                        <b>{num(Math.round(shown[v]))}</b>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <Panel area="weeks" title="Week by week" meta={range ? 'Drag again to change, Esc to let go' : 'Drag across weeks to narrow the tickets'} table={<WeekTable weeks={r.weeks} />}>
        <div className="ol-vweeks">
          <WeekChart weeks={r.weeks} range={range} onRange={onRange} />
        </div>
      </Panel>
      </div>
    </div>
  );
}
