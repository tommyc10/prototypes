/* Throwaway: what every variant is given, the list row they all draw, and the pieces the
 * placeholder variants share. The row is IncidentSearch's own markup and classes, copied,
 * so a variant can change how a row renders without touching src/. */

import { useLayoutEffect, type ComponentType, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Server } from 'lucide-react';
import { num, shortDate } from '../../src/lib/format';
import { groupById } from '../../src/pages/rule-management/data/mockData';
import { END_SHORT, dayAndTime } from '../../src/pages/incidents/model/lifecycle';
import type { Lifecycle } from '../../src/pages/incidents/model/types';

/** How many of the latest incidents the page shows before anything is asked. */
export const LATEST = 12;
/** How many rows to draw at a time. */
export const PAGE = 50;

/** What the list row already knows before an incident's journey is fetched. */
export type Row = Pick<Lifecycle, 'incident' | 'end' | 'real' | 'groupId'>;

/** Why the list is waiting. */
export type ListWait = { kind: 'cold' } | { kind: 'search'; query: string; before: { asked: string; shown: number } };

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

/** What a page-level piece (a thread, a capsule, a mark) needs to place itself. */
export interface OverlayProps {
  /** Which columns are waiting. */
  list: boolean;
  detail: boolean;
  /** What's being fetched, in words. */
  says: string;
  /** Where the list and the pane start, in px from the window's left edge, and where they end. */
  listLeft: number;
  detailLeft: number;
}

export interface Variant {
  name: string;
  /** One line in the picker's tooltip and the file's header. */
  idea: string;
  /** On the page root, so each variant's CSS stays its own. */
  className: string;
  /** The line under the search while the list waits. */
  says: (wait: ListWait) => string;
  ListWaiting: ComponentType<ListWaitingProps>;
  /** The article's contents while the journey is on its way. */
  DetailWaiting: ComponentType<DetailWaitingProps>;
  /** Drawn once over the whole page while anything waits. */
  Overlay?: ComponentType<OverlayProps>;
  /** Stands in the top bar for the ending's badge while nothing is known. Null leaves it out. */
  badge: ReactNode;
  /** The old rows stay on screen while a search is out, so J and K can still step through them. */
  keepsRows: boolean;
  /** The length of one cycle of the variant's light, for the shared clock. */
  period?: number;
}

/** The line under the search once the rows are in: IncidentSearch's words. */
export function readySays(asked: string, total: number, shown: number) {
  if (!asked) return `The ${total} latest. Search to find any other.`;
  if (!total) return 'No incident matches.';
  if (total > shown) return `${num(total)} match, showing ${shown}.`;
  return `${num(total)} ${total === 1 ? 'matches' : 'match'}.`;
}

/** The list's line while it waits. The same words for every variant, so only the look differs. */
export const listSays = (wait: ListWait) => (wait.kind === 'cold' ? `Fetching the ${LATEST} latest…` : `Searching for “${wait.query}”…`);

/** One incident in the list, exactly as IncidentSearch draws it. */
export function IncidentRow({
  life,
  index,
  selected,
  onSelect,
  stale,
  className,
}: {
  life: Lifecycle;
  index: number;
  selected: boolean;
  onSelect: (id: string) => void;
  /** A newer answer is on its way to replace it. */
  stale?: boolean;
  className?: string;
}) {
  return (
    <div
      role="option"
      aria-selected={selected}
      className={className ? `ic-row ${className}` : 'ic-row'}
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

/** The same widths every time, so a replay looks the same: a stable spread from an index. */
export const spread = (i: number, min: number, max: number) => min + (((i * 37 + 11) % 23) / 22) * (max - min);

/** A soft shape where something will land. Every variant's light lives on these. */
export const Block = ({ w, h, r, className }: { w: string; h: number; r?: number; className?: string }) => (
  <span className={className ? `ld-block ${className}` : 'ld-block'} style={{ width: w, height: h, borderRadius: r }} aria-hidden />
);

/** Placeholder rows, built from a real row's own boxes, so a row lands where its shape was. */
export function SkelRows({ count }: { count: number }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="ic-row ld-skel" aria-hidden style={{ '--i': i } as CSSProperties}>
      <Block w="7px" h={7} r={999} className="ld-dot" />
      <div className="ic-row-main">
        <div className="ic-row-title">
          <Block w={`${spread(i, 52, 88)}%`} h={10} />
        </div>
        <div className="ic-row-sub">
          <Block w="62px" h={8} />
          <Block w={`${spread(i + 5, 34, 56)}px`} h={8} />
        </div>
      </div>
      <Block w="36px" h={8} className="ld-date" />
    </div>
  ));
}

/** The line under the title. With a row, all of it is known; without one, a block stands in. */
export function Meta({ row }: { row?: Row }) {
  const group = row && groupById(row.groupId);
  return (
    <div className="ic-meta">
      <Server size={14} />
      {row && group ? (
        <>
          <span className="mn-mono">{row.incident.ci}</span>
          <span className="mn-subtle">
            · {group.name} · {group.unit}
          </span>
          <span className="ic-sep" />
          Raised {dayAndTime(new Date(row.incident.openedAt).getTime())}
        </>
      ) : (
        <Block w="min(320px, 60%)" h={10} />
      )}
    </div>
  );
}

/** The pane while the journey is on its way: what's known, then soft shapes for the rest.
 *  Deliberately not the journey: no line, no stations, no dot. Plain cards, so nothing on
 *  screen can be mistaken for a journey that stopped. */
export function SkelDetail({ id, row }: DetailWaitingProps) {
  return (
    <div className="ld-detail">
      <header className="ic-head">
        {row ? <h2>{row.incident.title}</h2> : <Block w="min(520px, 70%)" h={24} className="ld-title" />}
        <Meta row={row} />
        <p className="ic-verdict ld-lines" aria-label={`Fetching the journey of ${id}`}>
          <Block w="92%" h={12} />
          <Block w="56%" h={12} />
        </p>
      </header>
      <div className="ld-cards" aria-hidden>
        <Block w="100%" h={148} r={12} className="ld-card" />
        <div className="ld-cards-row">
          <Block w="100%" h={132} r={12} className="ld-card" />
          <Block w="100%" h={132} r={12} className="ld-card" />
        </div>
        <Block w="100%" h={96} r={12} className="ld-card" />
      </div>
    </div>
  );
}

/** One clock for every light on the page. Each block learns where it sits on screen (--bx,
 *  --by) and how far into the current cycle the page already is (--clock), so blocks that
 *  appear later join the same beat instead of starting their own: the list and the pane
 *  shimmer, ripple or breathe as one surface. */
export function useBlockClock(root: RefObject<HTMLElement | null>, period: number) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const tag = () => {
      const now = performance.now();
      el.querySelectorAll<HTMLElement>('.ld-block, .ic-row[data-stale]').forEach((b) => {
        const box = b.getBoundingClientRect();
        b.style.setProperty('--bx', `${Math.round(box.left)}px`);
        b.style.setProperty('--by', `${Math.round(box.top)}px`);
        b.style.setProperty('--bxn', String(Math.round(box.left)));
        b.style.setProperty('--byn', String(Math.round(box.top)));
        if (!b.dataset.clocked) {
          b.dataset.clocked = '';
          b.style.setProperty('--clock', `${-(now % period)}ms`);
        }
      });
    };
    tag();
    const watch = new MutationObserver(tag);
    watch.observe(el, { childList: true, subtree: true });
    window.addEventListener('resize', tag);
    return () => {
      watch.disconnect();
      window.removeEventListener('resize', tag);
    };
  }, [root, period]);
}
