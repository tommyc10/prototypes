/* Throwaway: what every variant is given, and the list row they all draw. The row is
 * IncidentSearch's own markup and classes, copied, so a variant can change how a row
 * renders without touching src/. */

import type { ComponentType, CSSProperties, ReactNode } from 'react';
import { Server } from 'lucide-react';
import { num, shortDate } from '../../src/lib/format';
import { groupById } from '../../src/pages/rule-management/data/mockData';
import { END_SHORT, dayAndTime } from '../../src/pages/incidents/model/lifecycle';
import type { Lifecycle } from '../../src/pages/incidents/model/types';

/** How many of the latest incidents the page shows before anything is asked. */
export const LATEST = 12;
/** How many rows to draw at a time. */
export const PAGE = 50;

/** What the list row already knows before an incident's journey is fetched. The group is
 * in it: the search matches on the group's name, so every row carries it. */
export type Row = Pick<Lifecycle, 'incident' | 'end' | 'real' | 'groupId'>;

/** Why the list is waiting. */
export type ListWait =
  /** Nothing on screen yet: a link or a refresh, and the latest few are on their way. */
  | { kind: 'cold' }
  /** A newer search is on its way; `before` is what the rows on screen answered. */
  | { kind: 'search'; query: string; before: { asked: string; shown: number } };

export interface ListWaitingProps {
  wait: ListWait;
  /** The rows on screen before the wait. Empty on a cold open, or after a search found nothing. */
  rows: Lifecycle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export interface DetailWaitingProps {
  id: string;
  /** Missing when the incident was opened by its number alone (a link, a refresh). */
  row?: Row;
}

export interface Variant {
  name: string;
  /** On the page root, so each variant's CSS stays its own. */
  className: string;
  /** The line under the search while the list waits. */
  says: (wait: ListWait) => string;
  ListWaiting: ComponentType<ListWaitingProps>;
  /** The article's contents while the journey is on its way. */
  DetailWaiting: ComponentType<DetailWaitingProps>;
  /** Stands in the top bar for the ending's badge while nothing is known. Null leaves it out. */
  badge: ReactNode;
  /** The old rows stay on screen while a search is out, so J and K can still step through them. */
  keepsRows: boolean;
}

/** The line under the search once the rows are in: IncidentSearch's words. */
export function readySays(asked: string, total: number, shown: number) {
  if (!asked) return `The ${total} latest. Search to find any other.`;
  if (!total) return 'No incident matches.';
  if (total > shown) return `${num(total)} match, showing ${shown}.`;
  return `${num(total)} ${total === 1 ? 'matches' : 'match'}.`;
}

/** What the old rows were, in a few words, for a sentence about them. */
export const beforeWords = (before: { asked: string; shown: number }) => (before.asked ? `the matches for “${before.asked}”` : `the ${before.shown} latest`);

/** One incident in the list, exactly as IncidentSearch draws it. */
export function IncidentRow({
  life,
  index,
  selected,
  onSelect,
  stale,
}: {
  life: Lifecycle;
  /** Its place in the list, for anything that runs down it in order. */
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
  /** A newer answer is on its way to replace it. */
  stale?: boolean;
}) {
  return (
    <div
      role="option"
      aria-selected={selected}
      className="ic-row"
      data-selected={selected || undefined}
      data-end={life.end}
      data-real={life.real || undefined}
      data-stale={stale || undefined}
      style={{ '--i': index } as CSSProperties}
      onClick={() => onSelect(life.incident.id)}
    >
      <i aria-hidden />
      <div className="ic-row-main">
        <div className="ic-row-title mn-truncate">{life.incident.title}</div>
        <div className="ic-row-sub mn-truncate">
          <span className="mn-mono">{life.incident.id}</span>
          <span className="ic-row-end">{END_SHORT[life.end]}</span>
        </div>
      </div>
      <time className="mn-subtle">{shortDate(life.incident.openedAt)}</time>
    </div>
  );
}

/** A grey bar where fetched words will land. */
export const Bar = ({ w, h = 10, className }: { w: string; h?: number; className?: string }) => (
  <span className={className ? `pl-bar ${className}` : 'pl-bar'} style={{ width: w, height: h }} aria-hidden />
);

/** The same widths every time, so a replay looks the same: a stable spread from an index. */
export const spread = (i: number, min: number, max: number) => min + (((i * 37 + 11) % 23) / 22) * (max - min);

/** The line under the title. With a row, all of it is known; without one, `hole` stands in
 * each gap (null leaves the line empty, holding its height). */
export function Meta({ row, hole }: { row?: Row; hole: ReactNode }) {
  if (!row && hole === null) return <div className="ic-meta" />;
  const group = row && groupById(row.groupId);
  return (
    <div className="ic-meta">
      <Server size={14} />
      {row ? <span className="mn-mono">{row.incident.ci}</span> : hole}
      {group ? (
        <span className="mn-subtle">
          · {group.name} · {group.unit}
        </span>
      ) : (
        hole
      )}
      <span className="ic-sep" />
      {row ? `Raised ${dayAndTime(new Date(row.incident.openedAt).getTime())}` : hole}
    </div>
  );
}
