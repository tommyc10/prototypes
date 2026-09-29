/* The tab bar: the rules you're working on. The list is for finding rules; tabs
 * are your working set. Each tab says at a glance what it needs: your decision,
 * a decision in progress, or nothing. On the left, buttons to tuck away the sidebar
 * and list; on the right, a count of what's waiting and what's done. */

import { Check, List, PanelLeftClose, PanelLeftOpen, PenLine, X } from 'lucide-react';
import type { Rule } from '../../model/types';
import './RuleTabs.css';

type TabState = 'needs-input' | 'drafting' | 'decided' | 'active' | 'inactive';

const TAB_STATE_LABEL: Record<TabState, string> = {
  'needs-input': 'Needs your decision',
  drafting: 'Decision in progress',
  decided: 'Decided',
  active: 'Active',
  inactive: 'Inactive',
};

function tabState(rule: Rule, drafting: boolean, decided: boolean): TabState {
  if (drafting) return 'drafting';
  if (decided) return 'decided';
  return rule.status === 'proposed' ? 'needs-input' : rule.status;
}

function TabIcon({ state }: { state: TabState }) {
  if (state === 'drafting') return <PenLine size={12} />;
  if (state === 'decided') return <Check size={12} strokeWidth={2.5} />;
  return <span className="mn-dot" data-status={state === 'needs-input' ? 'proposed' : state} />;
}

export function RuleTabs({
  rules,
  openIds,
  selectedId,
  draftingId,
  decidedIds,
  hideSide,
  hideList,
  onToggleSide,
  onToggleList,
  onSelect,
  onPin,
  onClose,
}: {
  rules: Rule[];
  openIds: string[];
  selectedId: string | null;
  draftingId: string | null;
  decidedIds: string[];
  hideSide: boolean;
  hideList: boolean;
  onToggleSide: () => void;
  onToggleList: () => void;
  onSelect: (id: string) => void;
  onPin: (id: string) => void;
  onClose: (id: string) => void;
}) {
  // A rule you've only glanced at shows as a "preview" tab until you pin it (↵, double-click, or start a decision).
  const previewId = selectedId && !openIds.includes(selectedId) ? selectedId : null;
  const tabs = [...openIds, ...(previewId ? [previewId] : [])].flatMap((id) => {
    const rule = rules.find((r) => r.id === id);
    return rule ? [{ rule, state: tabState(rule, id === draftingId, decidedIds.includes(id)) }] : [];
  });
  const waiting = tabs.filter((t) => t.state === 'needs-input').length;
  const done = tabs.filter((t) => t.state === 'decided').length;

  return (
    <div className="mn-tabbar">
      <div className="mn-tabbar-tools">
        <button
          className="mn-icon-btn"
          onClick={onToggleSide}
          aria-pressed={!hideSide}
          aria-label="Sidebar"
          title={`${hideSide ? 'Show' : 'Hide'} sidebar  [`}
        >
          {hideSide ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
        <button
          className="mn-icon-btn"
          onClick={onToggleList}
          aria-pressed={!hideList}
          aria-label="Rule list"
          title={`${hideList ? 'Show' : 'Hide'} rule list  ]`}
        >
          <List size={15} />
        </button>
      </div>

      <div className="mn-tabstrip" role="tablist" aria-label="Open rules">
        {tabs.map(({ rule, state }) => (
          <div
            key={rule.id}
            role="tab"
            tabIndex={0}
            aria-selected={rule.id === selectedId}
            className="mn-rtab"
            data-active={rule.id === selectedId || undefined}
            data-preview={rule.id === previewId || undefined}
            data-state={state}
            title={`${rule.id} · ${rule.name} · ${TAB_STATE_LABEL[state]}${rule.id === previewId ? ' (preview: ↵ to pin)' : ''}`}
            onClick={() => onSelect(rule.id)}
            onDoubleClick={() => onPin(rule.id)}
            onAuxClick={(e) => e.button === 1 && onClose(rule.id)}
          >
            <span className="mn-rtab-icon" aria-label={TAB_STATE_LABEL[state]}>
              <TabIcon state={state} />
            </span>
            <span className="mn-truncate">{rule.name}</span>
            {rule.id !== previewId && (
              <button
                className="mn-rtab-close"
                aria-label={`Close ${rule.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(rule.id);
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mn-tabbar-summary">
        {waiting > 0 && (
          <span>
            <span className="mn-dot" data-status="proposed" /> {waiting} waiting
          </span>
        )}
        {done > 0 && (
          <span className="mn-tabbar-done">
            <Check size={12} strokeWidth={2.5} /> {done} done
          </span>
        )}
      </div>
    </div>
  );
}
