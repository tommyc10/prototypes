/* A long list, a page at a time. The pages sit side by side in a track that snaps: scroll
 * sideways (or swipe) and it settles on the next page; the arrows do the same. So a list of
 * eighty takes the room of six and the page under it never moves.
 *
 * Every page is in the document, which is what lets J and K carry the selection onto the
 * next page: the row is scrolled to, and the track follows it. */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Pager.css';

export function Pager<T>({
  items,
  size,
  columns = 1,
  label,
  row,
}: {
  items: T[];
  /** How many to a page. */
  size: number;
  /** A wide list can lay each page out in columns. */
  columns?: number;
  /** What the list is, for a screen reader. */
  label: string;
  row: (item: T) => ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pages - 1);

  // A different list (a filter, a search) starts again from its first page.
  useEffect(() => {
    track.current?.scrollTo({ left: 0, behavior: 'instant' });
    setPage(0);
  }, [items.length, size]);

  const go = (to: number) => track.current?.scrollTo({ left: to * track.current.clientWidth });

  return (
    <div className="cw-pager" role="group" aria-label={label}>
      <div
        className="cw-pager-track"
        ref={track}
        style={{ '--cw-page-cols': columns } as CSSProperties}
        onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
      >
        {Array.from({ length: pages }, (_, p) => (
          // The pages off to the side can't be tabbed into; they can still be scrolled to.
          <div key={p} className="cw-pager-page" inert={p !== current}>
            {items.slice(p * size, (p + 1) * size).map(row)}
          </div>
        ))}
      </div>
      {pages > 1 && (
        <div className="cw-pager-foot">
          <span aria-live="polite">
            {current * size + 1}–{Math.min(items.length, (current + 1) * size)} of {items.length}
          </span>
          <span>
            Page {current + 1} of {pages}
          </span>
          <button className="mn-icon-btn" disabled={current === 0} onClick={() => go(current - 1)} aria-label="Previous page">
            <ChevronLeft size={15} />
          </button>
          <button className="mn-icon-btn" disabled={current >= pages - 1} onClick={() => go(current + 1)} aria-label="Next page">
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
