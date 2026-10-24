/* Where the tickets should land: every service's expected count over the horizon, with its
 * likely range as a whisker. The bar starts at zero so lengths compare honestly. Picking a
 * row scopes the whole page to that service; picking it again lets go.
 *
 * When the scope changes, each row's bar, range and figure morph to the new ones, and rows
 * that change rank slide to their new place (hindcast/hooks/useTween and useFlip). */

import { useRef, type CSSProperties } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { num, pct } from '../../../../lib/format';
import { useFlip } from '../../../hindcast/hooks/useFlip';
import { useTweenedNumbers, useTweenedRows } from '../../../hindcast/hooks/useTween';
import { change } from '../../../hindcast/model/labels';
import type { ServiceRisk as Row } from '../../model/types';
import './ServiceRisk.css';

export function ServiceRisk({ services, scoped, onScope }: { services: Row[]; scoped: string; onScope: (id: string) => void }) {
  const rows = useTweenedRows(services, (s) => s.id, (s) => ({ expected: s.expected, low: s.low, high: s.high }));
  const { max } = useTweenedNumbers({ max: Math.max(1, ...services.map((s) => s.high)) });
  const at = (v: number) => `${(v / max) * 100}%`;
  const listRef = useRef<HTMLDivElement>(null);
  useFlip(listRef, services.map((s) => s.id).join());
  return (
    <div className="ol-risk" data-picked={scoped !== 'all' || undefined} ref={listRef}>
      {rows.map(({ row: s, values: v }, i) => {
        if (!s) return null;
        const moved = change(s.expected, s.previous);
        return (
          <button
            key={s.id}
            data-flip={s.id}
            className="ol-risk-row"
            data-selected={scoped === s.id || undefined}
            aria-pressed={scoped === s.id}
            aria-label={`${s.name}: ${num(s.expected)} expected, likely ${num(s.low)} to ${num(s.high)}`}
            onClick={() => onScope(scoped === s.id ? 'all' : s.id)}
          >
            <span className="ol-risk-name mn-truncate">{s.name}</span>
            <span className="ol-risk-track">
              <span className="ol-risk-bar ol-grow-x" style={{ width: at(v.expected), '--i': i } as CSSProperties} />
              <span className="ol-risk-range ol-fade" style={{ left: at(v.low), width: `calc(${at(v.high)} - ${at(v.low)})`, '--i': i + 6 } as CSSProperties} />
            </span>
            <span className="ol-risk-num">{num(Math.round(v.expected))}</span>
            <span className="ol-risk-change" data-worse={moved !== null && moved >= 0.15 ? '' : undefined}>
              {moved !== null && (moved >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
              {moved === null ? '–' : pct(Math.abs(moved))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ServiceRiskTable({ services }: { services: Row[] }) {
  return (
    <table className="ol-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Expected</th>
          <th>Likely range</th>
          <th>Same weeks just gone</th>
        </tr>
      </thead>
      <tbody>
        {services.map((s) => (
          <tr key={s.id}>
            <th>{s.name}</th>
            <td>{num(s.expected)}</td>
            <td>
              {num(s.low)}–{num(s.high)}
            </td>
            <td>{num(s.previous)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
