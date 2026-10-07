/* Every incident a rule matched: search, resolution filters, and the list a page at a time.
 * Used full-height in the incidents panel, and inline when the detail pane is extra wide.
 * The list keeps one size whatever page it's on: the pager swaps the rows, it never adds to them.
 * Give it a `key` of the rule's id, so switching rules starts with a fresh search. */

import { useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { allIncidents } from '../../data/mockData';
import { RESOLUTION_LABEL } from '../../model/labels';
import type { RelatedIncident, Resolution, Rule } from '../../model/types';
import { IncidentList } from './IncidentList';
import './IncidentBrowser.css';

// Escalated first: those are the real incidents a rule must not hide.
const RESOLUTIONS: Resolution[] = ['escalated', 'worked', 'auto-cleared', 'closed-no-action', 'duplicate'];

export function IncidentBrowser({
  rule,
  wide,
  pageSize,
  searchRef,
  autoFocus,
  onOpen,
}: {
  rule: Rule;
  wide: boolean;
  pageSize: number;
  searchRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
  onOpen: (incident: RelatedIncident) => void;
}) {
  const incidents = useMemo(() => allIncidents(rule), [rule]);
  const [query, setQuery] = useState('');
  const [resolution, setResolution] = useState<Resolution | 'all'>('all');
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Search first, so the filter counts describe what the search found.
  const q = query.trim().toLowerCase();
  const found = incidents.filter((i) => `${i.id} ${i.title} ${i.ci}`.toLowerCase().includes(q));
  const matching = resolution === 'all' ? found : found.filter((i) => i.resolution === resolution);
  const countOf = (res: Resolution) => found.filter((i) => i.resolution === res).length;

  const pages = Math.max(1, Math.ceil(matching.length / pageSize));
  const first = page * pageSize;
  const last = Math.min(first + pageSize, matching.length);

  /** Turn to a page, starting from its top row. */
  const turn = (to: number) => {
    setPage(to);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div className="mn-inc-browser">
      <label className="mn-search">
        <Search size={14} />
        <input
          ref={searchRef}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            turn(0);
          }}
          placeholder="Search ID, title or CI"
        />
      </label>

      <div className="mn-tabs mn-inc-filters" role="tablist">
        {(['all', ...RESOLUTIONS] as const).map((res) => (
          <button
            key={res}
            role="tab"
            aria-selected={resolution === res}
            className="mn-tab"
            data-active={resolution === res || undefined}
            data-bad={(res === 'escalated' && countOf(res) > 0) || undefined}
            onClick={() => {
              setResolution(res);
              turn(0);
            }}
          >
            {res === 'all' ? 'All' : RESOLUTION_LABEL[res]}
            <span>{res === 'all' ? found.length : countOf(res)}</span>
          </button>
        ))}
      </div>

      {/* --rows reserves a full page of height inline, so a short last page doesn't shrink the box. */}
      <div className="mn-inc-scroll" ref={scrollRef} style={{ '--rows': pageSize } as CSSProperties}>
        {matching.length ? (
          <IncidentList incidents={matching.slice(first, last)} wide={wide} onOpen={onOpen} />
        ) : (
          <div className="mn-empty">No incidents match</div>
        )}
      </div>

      <div className="mn-inc-pager">
        <span className="mn-subtle" aria-live="polite">
          {matching.length ? `${first + 1}–${last} of ${matching.length}` : '0 incidents'}
        </span>
        <span className="mn-subtle">
          Page {page + 1} of {pages}
        </span>
        <button className="mn-icon-btn" disabled={page === 0} onClick={() => turn(page - 1)} aria-label="Previous page">
          <ChevronLeft size={15} />
        </button>
        <button className="mn-icon-btn" disabled={page >= pages - 1} onClick={() => turn(page + 1)} aria-label="Next page">
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
