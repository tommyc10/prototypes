/* Where the tickets should land: every service's expected count over the horizon, with its
 * likely range as a whisker. The bar starts at zero so lengths compare honestly. Picking a
 * row scopes the whole page to that service; picking it again lets go. */

import type { CSSProperties } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { num, pct } from '../../../../lib/format';
import { change } from '../../../hindcast/model/labels';
import type { ServiceRisk as Row } from '../../model/types';
import './ServiceRisk.css';

export function ServiceRisk({ services, scoped, onScope }: { services: Row[]; scoped: string; onScope: (id: string) => void }) {
  const max = Math.max(1, ...services.map((s) => s.high));
  const at = (v: number) => `${(v / max) * 100}%`;
  return (
    <div className="ol-risk" data-picked={scoped !== 'all' || undefined}>
      {services.map((s, i) => {
        const moved = change(s.expected, s.previous);
        return (
          <button
            key={s.id}
            className="ol-risk-row"
            data-selected={scoped === s.id || undefined}
            aria-pressed={scoped === s.id}
            aria-label={`${s.name}: ${num(s.expected)} expected, likely ${num(s.low)} to ${num(s.high)}`}
            onClick={() => onScope(scoped === s.id ? 'all' : s.id)}
          >
            <span className="ol-risk-name mn-truncate">{s.name}</span>
            <span className="ol-risk-track">
              <span className="ol-risk-bar ol-grow-x" style={{ width: at(s.expected), '--i': i } as CSSProperties} />
              <span className="ol-risk-range ol-fade" style={{ left: at(s.low), width: `calc(${at(s.high)} - ${at(s.low)})`, '--i': i + 6 } as CSSProperties} />
            </span>
            <span className="ol-risk-num">{num(s.expected)}</span>
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
