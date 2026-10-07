/* The list column: every alert up to the playhead, newest first. Search, the outcome tabs,
 * and one row per alert. The dot on each row is drawn the way the chart draws that alert,
 * so the two read as one thing.
 *
 * It's also the chart's table view: everything the picture shows is in here as text. */

import { useEffect, useRef, useState, type RefObject } from 'react';
import { Search, X } from 'lucide-react';
import type { Rule } from '../../../rule-management/model/types';
import { FEED_TABS, OUTCOME_SHORT } from '../../model/labels';
import type { FeedFilter, StreamAlert } from '../../model/types';
import './AlertFeed.css';

/** How many rows to draw at a time. An hour is close to a thousand alerts. */
const PAGE = 120;

const clockFace = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function AlertFeed({
  hidden,
  alerts,
  counts,
  filter,
  onFilter,
  query,
  onQuery,
  rule,
  onClearRule,
  selectedId,
  onSelect,
  preview,
  live,
  searchRef,
}: {
  hidden: boolean;
  /** What the search, tab and rule filter leave, newest first. */
  alerts: StreamAlert[];
  /** How many the search found under each tab. */
  counts: Record<FeedFilter, number>;
  filter: FeedFilter;
  onFilter: (filter: FeedFilter) => void;
  query: string;
  onQuery: (query: string) => void;
  /** The rule the feed is narrowed to (picked from "Rules at work"). */
  rule: Rule | null;
  onClearRule: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  preview: boolean;
  live: boolean;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const [limit, setLimit] = useState(PAGE);
  const rowsRef = useRef<HTMLDivElement>(null);
  // Rows that arrive after the feed is on screen fade in; the ones it opens with don't.
  const settled = useRef(false);
  useEffect(() => {
    settled.current = true;
  }, []);

  // A different question starts from the top again.
  useEffect(() => {
    setLimit(PAGE);
    rowsRef.current?.scrollTo({ top: 0 });
  }, [filter, query, rule]);

  // Keep the selected row in sight (it may have been picked on the chart).
  const selectedIndex = alerts.findIndex((a) => a.id === selectedId);
  useEffect(() => {
    if (selectedIndex >= limit) setLimit(Math.ceil((selectedIndex + 1) / PAGE) * PAGE);
    else rowsRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedId, selectedIndex >= limit]);

  return (
    <aside className="mn-list" inert={hidden} data-tour="al-feed">
      <header className="al-list-head">
        <div className="al-list-title">
          <h1>Alerts</h1>
          <span className="mn-subtle">{live ? 'last hour' : 'up to the playhead'}</span>
        </div>
        <label className="mn-search">
          <Search size={14} />
          <input ref={searchRef} value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search alerts, CIs, rules" />
          <kbd>/</kbd>
        </label>
        <div className="mn-tabs" role="tablist" aria-label="What became of the alert">
          {FEED_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={filter === tab.key}
              className="mn-tab"
              data-active={filter === tab.key || undefined}
              onClick={() => onFilter(tab.key)}
            >
              {tab.label} <span>{counts[tab.key]}</span>
            </button>
          ))}
        </div>
        {rule && (
          <div className="al-list-scope">
            <span className="mn-truncate">
              Fits <span className="mn-mono">{rule.id}</span> · {rule.name}
            </span>
            <button className="mn-icon-btn" onClick={onClearRule} aria-label="Show every rule's alerts" title="Clear">
              <X size={14} />
            </button>
          </div>
        )}
      </header>

      <div className="al-rows" ref={rowsRef} role="listbox" aria-label="Alerts">
        {alerts.slice(0, limit).map((alert) => {
          const sinking = preview && alert.wouldHide;
          return (
            <div
              key={alert.id}
              role="option"
              aria-selected={alert.id === selectedId}
              className="al-row"
              data-selected={alert.id === selectedId || undefined}
              data-outcome={alert.outcome}
              data-new={settled.current || undefined}
              onClick={() => onSelect(alert.id)}
            >
              <i data-kind={sinking ? (alert.outcome === 'paged' ? 'ring-paged' : 'ring') : alert.outcome} aria-hidden />
              <div className="al-row-main">
                <div className="al-row-title mn-truncate">{alert.title}</div>
                <div className="al-row-sub mn-truncate">
                  <span className="mn-mono">{alert.ci}</span>
                  <span>{sinking ? 'Would be hidden' : OUTCOME_SHORT[alert.outcome]}</span>
                </div>
              </div>
              <time className="mn-mono mn-subtle">{clockFace(alert.at)}</time>
            </div>
          );
        })}
        {alerts.length > limit && (
          <button className="al-more" onClick={() => setLimit(limit + PAGE)}>
            Show older <span className="mn-subtle">{alerts.length - limit} more</span>
          </button>
        )}
        {!alerts.length && <div className="mn-empty">No alerts match</div>}
      </div>

      <footer className="al-list-foot">
        <span>
          <kbd>J</kbd> <kbd>K</kbd> Navigate
        </span>
        <span>
          <kbd>←</kbd> <kbd>→</kbd> Rewind
        </span>
        <span>
          <kbd>⌘K</kbd> Commands
        </span>
      </footer>
    </aside>
  );
}
