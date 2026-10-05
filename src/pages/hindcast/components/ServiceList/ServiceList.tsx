/* The list column: every service, the noisiest first, with "All services" on top.
 * It is the page's service filter and its per-service breakdown at once: each row's bar is
 * as long as that service's share of the manual cancellations, and split by what would have
 * caught them. Pick a row and the report on the right is about that service. */

import { useEffect, useRef, type RefObject } from 'react';
import { Search, Sigma } from 'lucide-react';
import { num, pct } from '../../../../lib/format';
import { caught, share } from '../../model/labels';
import type { HindcastReport, ServiceRow } from '../../model/types';
import { Legend } from '../charts/Legend';
import { SplitBar } from '../charts/SplitBar';
import './ServiceList.css';

export function ServiceList({
  hidden,
  report,
  shown,
  query,
  onQuery,
  selectedId,
  onSelect,
  searchRef,
}: {
  hidden: boolean;
  report: HindcastReport;
  /** The services the search found, in rank order. */
  shown: ServiceRow[];
  query: string;
  onQuery: (query: string) => void;
  selectedId: string;
  onSelect: (serviceId: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const { services } = report;
  const max = Math.max(1, ...services.map((s) => s.cancelled));

  // The whole Empire, as one row: every service added up.
  const everything = services.reduce(
    (sum, s) => ({
      cancelled: sum.cancelled + s.cancelled,
      split: { rule: sum.split.rule + s.split.rule, window: sum.split.window + s.split.window, missed: sum.split.missed + s.split.missed },
    }),
    { cancelled: 0, split: { rule: 0, window: 0, missed: 0 } },
  );

  // Keep the selected row in view when J/K moves past the edge of the list.
  useEffect(() => {
    listRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  return (
    <section className="mn-list hc-list" inert={hidden}>
      <header className="hc-list-head" data-tour="hc-scope">
        <div className="hc-list-title">
          <h1>Hindcast</h1>
          <span className="mn-subtle">Last {report.scope.weeks} completed weeks</span>
        </div>
        <label className="mn-search">
          <Search size={14} />
          <input ref={searchRef} value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Find a service" aria-label="Find a service" />
          <kbd>/</kbd>
        </label>
        <div className="hc-list-key">
          <Legend short />
          <span className="mn-subtle">Cancelled by hand</span>
        </div>
      </header>

      <div className="hc-rows" ref={listRef} role="listbox" aria-label="Services" data-tour="hc-services">
        {!query && (
          <div role="option" aria-selected={selectedId === 'all'} className="hc-row" data-selected={selectedId === 'all' || undefined} onClick={() => onSelect('all')}>
            <span className="hc-rank" aria-hidden>
              <Sigma size={13} />
            </span>
            <div className="hc-row-main">
              <div className="hc-row-top">
                <span className="hc-row-name">All services</span>
                <span className="hc-row-num">{num(everything.cancelled)}</span>
              </div>
              <div className="hc-row-meta">
                <span>{services.length} services</span>
                <span>{pct(share(caught(everything.split), everything.cancelled))} caught</span>
              </div>
              <SplitBar split={everything.split} size="sm" />
            </div>
          </div>
        )}
        {shown.map((service) => (
          <div
            key={service.id}
            role="option"
            aria-selected={service.id === selectedId}
            className="hc-row"
            data-selected={service.id === selectedId || undefined}
            onClick={() => onSelect(service.id)}
          >
            <span className="hc-rank mn-mono" aria-label={`Rank ${services.indexOf(service) + 1}`}>
              {services.indexOf(service) + 1}
            </span>
            <div className="hc-row-main">
              <div className="hc-row-top">
                <span className="hc-row-name mn-truncate">{service.name}</span>
                <span className="hc-row-num">{num(service.cancelled)}</span>
              </div>
              <div className="hc-row-meta">
                <span className="mn-truncate">{service.unit}</span>
                <span>{pct(share(caught(service.split), service.cancelled))} caught</span>
              </div>
              <SplitBar split={service.split} of={max} size="sm" />
            </div>
          </div>
        ))}
        {shown.length === 0 && (
          <div className="mn-empty">
            <div>No services match</div>
            <button className="mn-btn" onClick={() => onQuery('')}>
              Clear search
            </button>
          </div>
        )}
      </div>

      <aside className="hc-about">
        <strong>What is a hindcast?</strong>
        <p>
          A replay. It takes the tickets people already cancelled by hand and runs them through the suppression logic
          that is live today, to show what would have been caught, and by what. It is evidence about the past, not a
          prediction.
        </p>
      </aside>

      <footer className="hc-hints">
        <span><kbd>J</kbd><kbd>K</kbd> Services</span>
        <span><kbd>1</kbd>–<kbd>5</kbd> Chapters</span>
        <span><kbd>⌘K</kbd> Commands</span>
      </footer>
    </section>
  );
}
