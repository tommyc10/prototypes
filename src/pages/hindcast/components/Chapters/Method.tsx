/* Chapter five: how to read this, drawn rather than written. On the left, the path every
 * ticket closed by hand takes, as a staircase: the questions in the order the replay asks
 * them, this run's own figures peeling off at each one. On the right, the five rules of
 * reading, a line each. */

import type { CSSProperties, ReactNode } from 'react';
import { CircleDashed, Hand, History, Layers, Split } from 'lucide-react';
import { num } from '../../../../lib/format';
import { methodSteps } from '../../model/chapters';
import type { Focus } from '../../model/narrow';
import type { Replay, Verdict } from '../../model/replay';
import { GROUP, VERDICT_SHORT, VERDICT_TONE } from '../../model/words';

const RULES: { icon: ReactNode; title: string; line: string }[] = [
  { icon: <Split size={15} />, title: 'One verdict each', line: 'Every ticket lands in one place, so the verdicts add up to the total.' },
  { icon: <Hand size={15} />, title: 'Closed isn’t noise', line: 'Someone closed it, that’s all. Only those closed by hand are judged.' },
  { icon: <CircleDashed size={15} />, title: 'Unknown isn’t a miss', line: 'Missing data is set aside, never counted as unexplained.' },
  { icon: <Layers size={15} />, title: 'Sources overlap', line: 'A ticket two sources catch counts on both, and once in the verdict.' },
  { icon: <History size={15} />, title: 'Not a forecast', line: 'Today’s logic over the past. Nothing here was really suppressed.' },
];

export function Method({ r, focus, onFocus, basis }: { r: Replay; focus: Focus | null; onFocus: (f: Focus | null) => void; basis: string }) {
  const hand = Math.max(1, r.population.closedByHand);
  const steps = methodSteps(r);
  const others = r.population.total - r.population.closedByHand;
  const pickV = (v: Verdict) => onFocus(focus?.kind === 'verdict' && focus.verdict === v ? null : { kind: 'verdict', verdict: v });

  return (
    <div className="ol-ch ol-method">
      <section className="ol-path" aria-label="The path every ticket takes">
        <h3 className="ol-ch-h">
          The path every ticket takes <span>{basis}</span>
        </h3>
        <div className="ol-path-start ol-fade">
          <b>{num(r.population.total)}</b> read
          <span className="ol-path-arrow" aria-hidden />
          <b>{num(r.population.closedByHand)}</b> closed by hand get a verdict
          <small>{num(others)} others don’t: closed automatically, cancelled, open or merged</small>
        </div>
        <ol className="ol-steps">
          {steps.map((s, i) => (
            <li key={s.ask} className="ol-step ol-fade" data-group={s.group} data-last={i === steps.length - 1 || undefined} style={{ '--i': i + 1 } as CSSProperties}>
              <span className="ol-step-n">{i + 1}</span>
              <span className="ol-step-ask">{s.ask}</span>
              <span className="ol-step-bar" aria-hidden>
                <span className="ol-step-left" style={{ width: `${(s.before / hand) * 100}%` }}>
                  <i data-group={s.group} style={{ width: s.before ? `${(s.count / s.before) * 100}%` : 0 }} />
                </span>
              </span>
              <span className="ol-step-exit">
                <span className="ol-step-group" data-group={s.group}>
                  {i === steps.length - 1 ? 'Nothing explains it' : i < 2 ? 'Yes: explained' : s.group === 'unknown' ? 'No: unknown' : 'Yes: not explained'}
                </span>
                {s.exits.map((v) => {
                  const on = focus?.kind === 'verdict' && focus.verdict === v;
                  return (
                    <button key={v} className="ol-step-chip" data-picked={on || undefined} aria-pressed={on} onClick={() => pickV(v)} title={`${GROUP[s.group]}: show these tickets`}>
                      <i className="ol-swatch" data-tone={VERDICT_TONE[v]} />
                      {s.exits.length > 1 && VERDICT_SHORT[v]}
                      <b>{num(r.verdicts[v])}</b>
                    </button>
                  );
                })}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="ol-rules" aria-label="Five rules for reading">
        <h3 className="ol-ch-h">Five rules for reading</h3>
        <ul>
          {RULES.map((x, i) => (
            <li key={x.title} className="ol-rule-card ol-fade" style={{ '--i': i + 2 } as CSSProperties}>
              <span className="ol-rule-icon" aria-hidden>
                {x.icon}
              </span>
              <b>{x.title}</b>
              <span>{x.line}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
