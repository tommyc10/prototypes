/* The rule list: title, search, status tabs, sort, the rows, and keyboard hints.
 * It shows whatever `visible` it's given; filtering and sorting happen in useRuleView. */

import { useEffect, useRef, type RefObject } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import { pct } from '../../../../lib/format';
import { groupById } from '../../data/mockData';
import { STATUS_TABS, type StatusFilter, type ViewState } from '../../model/browse';
import { statusLabel } from '../../model/labels';
import { isLowConfidence } from '../../model/policy';
import type { Rule } from '../../model/types';
import { SortMenu } from './SortMenu';
import './RuleList.css';

export function RuleList({
  hidden,
  view,
  update,
  visible,
  counts,
  selectedId,
  onSelect,
  searchRef,
}: {
  hidden: boolean;
  view: ViewState;
  update: (patch: Partial<ViewState>) => void;
  visible: Rule[];
  counts: Record<StatusFilter, number>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the selected row in view when J/K moves past the edge of the list.
  useEffect(() => {
    listRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  return (
    <section className="mn-list" inert={hidden}>
      <header className="mn-list-head" data-tour="list-tools">
        <div className="mn-list-title">
          <h1>Rules</h1>
          <span className="mn-subtle">{view.groupId === 'all' ? 'All groups' : groupById(view.groupId).name}</span>
        </div>
        <label className="mn-search">
          <Search size={14} />
          <input
            ref={searchRef}
            value={view.query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Search rules, CIs, sources"
          />
          <kbd>/</kbd>
        </label>
        <div className="mn-list-tools">
          <div className="mn-tabs" role="tablist">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={view.status === tab.key}
                className="mn-tab"
                data-active={view.status === tab.key || undefined}
                onClick={() => update({ status: tab.key })}
              >
                {tab.label}
                <span>{counts[tab.key]}</span>
              </button>
            ))}
          </div>
          <SortMenu sort={view.sort} dir={view.dir} onChange={update} />
        </div>
      </header>

      <div className="mn-rows" ref={listRef} data-tour="rows" role="listbox" aria-label="Rules">
        {visible.map((rule) => (
          <div
            key={rule.id}
            role="option"
            aria-selected={rule.id === selectedId}
            className="mn-row"
            data-selected={rule.id === selectedId || undefined}
            onClick={() => onSelect(rule.id)}
          >
            <span className="mn-dot" data-status={rule.status} aria-label={statusLabel(rule)} />
            <div className="mn-row-main">
              <div className="mn-row-name">{rule.name}</div>
              <div className="mn-row-meta">
                <span className="mn-mono">{rule.id}</span>
                <span>{groupById(rule.groupId).name}</span>
              </div>
            </div>
            <div className="mn-row-side">
              <span className="mn-row-conf" data-low={isLowConfidence(rule) || undefined}>
                {isLowConfidence(rule) && <AlertTriangle size={12} aria-label="Low confidence" />}
                {pct(rule.confidence)}
              </span>
              <span className="mn-subtle">{rule.incidentCount} inc</span>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="mn-empty">
            <div>No rules match</div>
            <button className="mn-btn" onClick={() => update({ query: '', status: 'all', groupId: 'all' })}>
              Clear filters
            </button>
          </div>
        )}
      </div>

      <footer className="mn-hints">
        <span><kbd>J</kbd><kbd>K</kbd> Navigate</span>
        <span><kbd>/</kbd> Search</span>
        <span><kbd>⌘K</kbd> Commands</span>
      </footer>
    </section>
  );
}
