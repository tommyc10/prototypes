/* The days ahead, as a calendar: each day shaded by how busy it should be, and marked with a
 * dot for every prediction due (red when the pattern tends to become an incident). Hovering
 * a day lights its predictions in the list beside it, and hovering a prediction lights its days. */

import { useState, type CSSProperties } from 'react';
import { num } from '../../../../lib/format';
import { WEEKDAYS, plural, weekdayDate } from '../../../hindcast/model/labels';
import { useSize } from '../../../hindcast/hooks/useSize';
import type { DayRisk, Prediction } from '../../model/types';
import { Tip } from '../../../hindcast/components/charts/Tip';
import './RiskCalendar.css';

export function RiskCalendar({
  days,
  predictions,
  lit,
  onLight,
}: {
  days: DayRisk[];
  predictions: Prediction[];
  /** The prediction being hovered, here or in the list. */
  lit: string | null;
  onLight: (id: string | null) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const byId = new Map(predictions.map((p) => [p.id, p]));
  const day = hover === null ? null : days[hover];
  const rows = days.length / 7;
  const [gridRef, grid] = useSize<HTMLDivElement>();

  return (
    <div className="ol-cal">
      <div className="ol-cal-head" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div
        className="ol-cal-grid"
        ref={gridRef}
        style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
        onPointerLeave={() => {
          setHover(null);
          onLight(null);
        }}
      >
        {days.map((d, i) => {
          const date = new Date(d.date);
          const isLit = lit !== null && d.predictions.includes(lit);
          return (
            <div
              key={d.date}
              className="ol-cal-day ol-fade"
              tabIndex={0}
              data-level={d.level}
              data-today={i === 0 || undefined}
              data-lit={isLit || undefined}
              style={{ '--i': i } as CSSProperties}
              aria-label={`${weekdayDate(d.date)}: about ${num(d.expected)} tickets${d.predictions.length ? `, ${d.predictions.length} ${plural(d.predictions.length, 'prediction')} due` : ''}`}
              onPointerEnter={() => {
                setHover(i);
                onLight(d.predictions[0] ?? null);
              }}
              onFocus={() => {
                setHover(i);
                onLight(d.predictions[0] ?? null);
              }}
              onBlur={() => {
                setHover(null);
                onLight(null);
              }}
            >
              <span className="ol-cal-date">{date.getUTCDate()}</span>
              <span className="ol-cal-n">{num(d.expected)}</span>
              {d.predictions.length > 0 && (
                <span className="ol-cal-marks" aria-hidden>
                  {d.predictions.map((id) => (
                    <i key={id} data-incident={byId.get(id)?.likelyIncident || undefined} />
                  ))}
                </span>
              )}
            </div>
          );
        })}
        {day && hover !== null && (
          <Tip
            x={(((hover % 7) + 0.5) / 7) * grid.width}
            y={Math.floor(hover / 7) * (grid.height / rows) + 4}
            flip={hover % 7 >= 4}
            title={weekdayDate(day.date)}
            rows={[
              { value: num(day.expected), label: 'Tickets expected' },
              ...day.predictions.map((id) => {
                const p = byId.get(id)!;
                return { tone: p.likelyIncident ? 'var(--red)' : 'var(--tone-1)', value: `${Math.round(p.likelihood * 100)}%`, label: p.evidence.pattern.title };
              }),
            ]}
          />
        )}
      </div>
      <div className="ol-cal-foot" aria-hidden>
        <span className="ol-cal-scale">
          {[0, 1, 2, 3, 4].map((l) => (
            <i key={l} data-level={l} />
          ))}
        </span>
        Busier
        <span className="ol-cal-key">
          <i /> Prediction
        </span>
        <span className="ol-cal-key">
          <i data-incident /> Likely incident
        </span>
      </div>
    </div>
  );
}
