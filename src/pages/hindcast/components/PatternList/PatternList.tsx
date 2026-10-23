/* What the history says will happen again: each pattern the hindcast found, with its evidence
 * drawn as a strip of its recent chances (filled when it happened). These are what the
 * forecast projects forward; each card links to its prediction there, and back. */

import { forwardRef, type CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { pct } from '../../../../lib/format';
import { serviceName } from '../../data/mockData';
import { CAUSE_LABEL, weekdayDate } from '../../model/labels';
import type { Pattern, PatternEvidence } from '../../model/types';
import './PatternList.css';

/** Below this, a pattern is shown but flagged: it happens, but not reliably enough to plan on. */
export const CONFIDENT = 0.6;

const DAY_NAMES = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];

/** "23 of 26 Wednesdays" */
export function chanceWords(pattern: Pattern, hits: number, chances: number) {
  const noun = pattern.cadence.kind === 'weekday' ? DAY_NAMES[pattern.cadence.day] : pattern.cadence.kind === 'cycle' ? 'cycles' : 'month ends';
  return `${hits} of ${chances} ${noun}`;
}

export function Strip({ strip }: { strip: boolean[] }) {
  return (
    <span className="ol-strip" aria-hidden>
      {strip.map((hit, i) => (
        <i key={i} data-hit={hit || undefined} className="ol-fade" style={{ '--i': i } as CSSProperties} />
      ))}
    </span>
  );
}

export const PatternList = forwardRef<HTMLDivElement, { patterns: PatternEvidence[]; flashId: string | null; onForecast: (patternId: string) => void }>(
  function PatternList({ patterns, flashId, onForecast }, ref) {
    if (patterns.length === 0) {
      return <p className="ol-empty">No repeating pattern in this scope. Widen the lookback or pick another service.</p>;
    }
    return (
      <div className="ol-pats" ref={ref}>
        {patterns.map((ev) => (
          <article key={ev.pattern.id} className="ol-pat" data-flash={flashId === ev.pattern.id || undefined} data-pattern={ev.pattern.id}>
            <div className="ol-pat-top">
              <span className="mn-mono">{ev.pattern.id}</span>
              <span className="mn-truncate">
                {serviceName(ev.pattern.serviceId)} · {CAUSE_LABEL[ev.pattern.cause]}
              </span>
              {ev.confidence < CONFIDENT ? <span className="ol-pill" data-tone="warn">Low confidence</span> : <b className="ol-pat-conf">{pct(ev.confidence)}</b>}
            </div>
            <h3 className="ol-pat-title">{ev.pattern.title}</h3>
            <div className="ol-pat-evidence">
              <Strip strip={ev.strip} />
              <span>{chanceWords(ev.pattern, ev.hits, ev.chances)}</span>
            </div>
            <div className="ol-pat-foot">
              <span>
                Next chance <b>{weekdayDate(ev.next)}</b>
              </span>
              <button className="mn-btn ol-pat-go" onClick={() => onForecast(ev.pattern.id)}>
                In the forecast <ArrowRight size={13} />
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  },
);
