/* Every incident a rule matched: search, resolution filters, and the list a page at a time.
 * Used full-height in the incidents panel, and inline when the detail pane is extra wide.
 * Give it a `key` of the rule's id, so switching rules starts with a fresh search. */

import { useMemo, useState, type RefObject } from 'react';
import { Search } from 'lucide-react';
import { allIncidents } from '../../data/mockData';
import { RESOLUTION_LABEL } from '../../model/labels';
import type { Resolution, Rule } from '../../model/types';
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
}: {
  rule: Rule;
  wide: boolean;
  pageSize: number;
  searchRef?: RefObject<HTMLInputElement | null>;
  autoFocus?: boolean;
}) {
  const incidents = useMemo(() => allIncidents(rule), [rule]);
  const [query, setQuery] = useState('');
  const [resolution, setResolution] = useState<Resolution | 'all'>('all');
  const [shown, setShown] = useState(pageSize);

  // Search first, so the filter counts describe what the search found.
  const q = query.trim().toLowerCase();
  const found = incidents.filter((i) => `${i.id} ${i.title} ${i.ci}`.toLowerCase().includes(q));
  const matching = resolution === 'all' ? found : found.filter((i) => i.resolution === resolution);
  const countOf = (res: Resolution) => found.filter((i) => i.resolution === res).length;

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
            setShown(pageSize);
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
              setShown(pageSize);
            }}
          >
            {res === 'all' ? 'All' : RESOLUTION_LABEL[res]}
            <span>{res === 'all' ? found.length : countOf(res)}</span>
          </button>
        ))}
      </div>

      <div className="mn-inc-scroll">
        {matching.length ? (
          <IncidentList incidents={matching.slice(0, shown)} wide={wide} />
        ) : (
          <div className="mn-empty">No incidents match</div>
        )}
        {shown < matching.length && (
          <div className="mn-inc-more">
            <button className="mn-btn" onClick={() => setShown(shown + pageSize)}>
              Show more <span className="mn-subtle">{matching.length - shown} left</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
