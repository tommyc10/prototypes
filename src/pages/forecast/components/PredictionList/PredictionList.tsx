/* What's coming, soonest first: each pattern from the hindcast, projected to the days it's
 * due, with how likely it is and what to do before then. Each links back to the pattern and
 * its evidence. Hovering one lights its days on the calendar. */

import { forwardRef, type CSSProperties } from 'react';
import { ArrowLeft } from 'lucide-react';
import { num, pct } from '../../../../lib/format';
import { serviceName } from '../../../hindcast/data/mockData';
import { CAUSE_LABEL, plural } from '../../../hindcast/model/labels';
import type { Prediction } from '../../model/types';
import { CONFIDENT, chanceWords } from '../../../hindcast/components/PatternList/PatternList';
import './PredictionList.css';

const part = (date: string, opts: Intl.DateTimeFormatOptions) => new Date(date).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });

export const PredictionList = forwardRef<
  HTMLDivElement,
  {
    predictions: Prediction[];
    flashId: string | null;
    lit: string | null;
    onLight: (id: string | null) => void;
    onHindcast: (patternId: string) => void;
  }
>(function PredictionList({ predictions, flashId, lit, onLight, onHindcast }, ref) {
  if (predictions.length === 0) {
    return <p className="ol-empty">Nothing the history repeats is due in this horizon. Try eight weeks, or all services.</p>;
  }
  return (
    <div className="ol-preds" ref={ref} onPointerLeave={() => onLight(null)}>
      {predictions.map((p, i) => {
        const { pattern } = p.evidence;
        return (
          <article
            key={p.id}
            className="ol-pred"
            data-flash={flashId === pattern.id || undefined}
            data-lit={lit === p.id || undefined}
            data-pattern={pattern.id}
            style={{ '--i': i } as CSSProperties}
            onPointerEnter={() => onLight(p.id)}
          >
            <div className="ol-pred-date" aria-label={part(p.next, { weekday: 'long', day: 'numeric', month: 'long' })}>
              <span>{part(p.next, { weekday: 'short' })}</span>
              <b>{part(p.next, { day: 'numeric' })}</b>
              <span>{part(p.next, { month: 'short' })}</span>
            </div>
            <div className="ol-pred-main">
              <div className="ol-pred-title">
                <span>{pattern.title}</span>
              </div>
              <div className="ol-pred-meta mn-truncate">
                {serviceName(pattern.serviceId)} · {CAUSE_LABEL[pattern.cause]}
                {p.dates.length > 1 && ` · due ${p.dates.length} times`}
              </div>
              <div className="ol-pred-action mn-truncate">{pattern.action}</div>
            </div>
            <div className="ol-pred-side">
              <div className="ol-pred-odds">
                {p.likelyIncident && (
                  <span className="ol-pill" data-tone="bad">
                    Likely incident
                  </span>
                )}
                {p.likelihood < CONFIDENT && (
                  <span className="ol-pill" data-tone="warn">
                    Low confidence
                  </span>
                )}
                <b>{pct(p.likelihood)}</b>
              </div>
              <span className="ol-pred-meter" aria-hidden>
                <i className="ol-grow-x" style={{ transform: `scaleX(${p.likelihood})`, '--i': i } as CSSProperties} />
              </span>
              <span className="ol-pred-tickets">
                ~{num(p.expectedTickets)} {plural(p.expectedTickets, 'ticket')}
              </span>
              <button className="mn-link ol-pred-back" onClick={() => onHindcast(pattern.id)} title={chanceWords(pattern, p.evidence.hits, p.evidence.chances)}>
                <ArrowLeft size={12} /> {pattern.id}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
});
