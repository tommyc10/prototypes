/* Throwaway: what every variant's waiting state is given, and the parts they all share. */

import { Server } from 'lucide-react';
import type { ReactNode } from 'react';
import { dayAndTime } from '../../src/pages/incidents/model/lifecycle';
import type { Lifecycle } from '../../src/pages/incidents/model/types';

/** What the list row already knows before the journey is fetched. */
export type Row = Pick<Lifecycle, 'incident' | 'end' | 'real'>;

export interface WaitingProps {
  id: string;
  /** Missing when the incident was opened by its number alone (a link, an address). */
  row?: Row;
  via: 'pointer' | 'key';
}

/** A grey bar where words will be. */
export const Bar = ({ w, h = 10 }: { w: string; h?: number }) => <span className="sl-bar" style={{ width: w, height: h }} aria-hidden />;

/** The heading, with what's known filled in and what isn't held open. */
export function KnownHead({ row, verdict }: { row?: Row; verdict: ReactNode }) {
  return (
    <header className="ic-head">
      {row ? (
        <h2>{row.incident.title}</h2>
      ) : (
        <h2>
          <Bar w="62%" h={22} />
        </h2>
      )}
      <div className="ic-meta">
        <Server size={14} />
        {row ? <span className="mn-mono">{row.incident.ci}</span> : <Bar w="90px" />}
        <span className="mn-subtle">·</span>
        <Bar w="150px" />
        <span className="ic-sep" />
        {row ? <>Raised {dayAndTime(new Date(row.incident.openedAt).getTime())}</> : <Bar w="110px" />}
      </div>
      {verdict}
    </header>
  );
}
