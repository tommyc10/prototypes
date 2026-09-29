/* The rule management page. This file owns the page's state and wires the pieces together:
 *
 *   Sidebar      navigation and assignment groups
 *   RuleList     finding rules: search, status tabs, sort
 *   RuleTabs     the working set: rules you've opened
 *   RuleDetail   the selected rule, and the decision form
 *   IncidentsPanel / CommandPalette   on top when opened
 *
 * Data flows down as props; changes come back up as callbacks (onSelect, onAction…). */

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { DecisionToast } from './components/common/DecisionToast';
import { IncidentsPanel } from './components/Incidents/IncidentsPanel';
import { RuleDetail } from './components/RuleDetail/RuleDetail';
import { RuleList } from './components/RuleList/RuleList';
import { RuleTabs } from './components/RuleTabs/RuleTabs';
import { Sidebar } from './components/Sidebar/Sidebar';
import { useDecision } from './hooks/useDecision';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePaneMode } from './hooks/usePaneMode';
import { useRuleView } from './hooks/useRuleView';
import { useRulesStore } from './hooks/useRulesStore';
import { useTheme } from './hooks/useTheme';
import { useWorkingSet } from './hooks/useWorkingSet';
import { actionsFor } from './model/policy';
import type { RuleAction } from './model/types';
import './RuleManagementPage.css';

export function RuleManagementPage() {
  const rules = useRulesStore((s) => s.rules);
  const { view, update, visible, counts } = useRuleView(rules);
  const workingSet = useWorkingSet();
  const [selectedId, setSelectedId] = useState<string | null>(() => workingSet.openIds[0] ?? null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [incidentsOpen, setIncidentsOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [hideList, setHideList] = useState(false);
  // Keyboard-opened decisions appear instantly; pointer-opened ones animate in.
  const [composerVia, setComposerVia] = useState<'key' | 'pointer'>('pointer');
  const [theme, toggleTheme] = useTheme();
  const [detailRef, mode] = usePaneMode();
  const searchRef = useRef<HTMLInputElement>(null);
  const incidentSearchRef = useRef<HTMLInputElement>(null);

  const decision = useDecision((rule, action) => {
    workingSet.markDecided(rule.id);
    toast.custom(() => <DecisionToast rule={rule} action={action} />);
  });

  const selected = rules.find((r) => r.id === selectedId) ?? null;

  // Keep the selection valid. An open tab can stay selected even when the list's filters
  // hide it; otherwise, if the list no longer shows the selected rule, pick its first one.
  useEffect(() => {
    if (selectedId && workingSet.openIds.includes(selectedId)) return;
    if (!visible.length) return setSelectedId(null);
    if (!selectedId || !visible.some((r) => r.id === selectedId)) setSelectedId(visible[0].id);
  }, [visible, selectedId, workingSet.openIds]);

  /** Start a decision on the selected rule, if that action is allowed. */
  const act = (action: RuleAction, via: 'key' | 'pointer') => {
    if (!selected || !actionsFor(selected).includes(action)) return;
    setIncidentsOpen(false); // the form lives in the detail pane, so leave the panel first
    workingSet.pin(selected.id); // deciding on a rule means you're working on it: keep its tab
    setComposerVia(via);
    decision.open(selected, action);
  };

  /** Move the selection up or down the list. */
  const move = (step: number) => {
    const i = visible.findIndex((r) => r.id === selectedId);
    const next = visible[Math.min(visible.length - 1, Math.max(0, i + step))];
    if (next) setSelectedId(next.id);
  };

  const closeTab = (id: string) => {
    const neighbour = workingSet.close(id);
    if (id === selectedId && neighbour) setSelectedId(neighbour); // like closing a browser tab
  };

  useKeyboardShortcuts({
    paletteOpen,
    onTogglePalette: () => setPaletteOpen((open) => !open),
    decisionOpen: decision.target !== null,
    onCancelDecision: decision.close,
    onSubmitDecision: decision.submit,
    keys: {
      j: () => move(1),
      ArrowDown: () => move(1),
      k: () => move(-1),
      ArrowUp: () => move(-1),
      '/': () => (incidentsOpen ? incidentSearchRef : searchRef).current?.focus(),
      Escape: () => setIncidentsOpen(false),
      a: () => act('approve', 'key'),
      x: () => act('reject', 'key'),
      e: () => act('activate', 'key'),
      d: () => act('deactivate', 'key'),
      Enter: () => selectedId && workingSet.pin(selectedId),
      '[': () => setHideSide((hidden) => !hidden),
      ']': () => setHideList((hidden) => !hidden),
    },
  });

  return (
    <div className="mn" data-hide-side={hideSide || undefined} data-hide-list={hideList || undefined}>
      <Sidebar
        hidden={hideSide}
        rules={rules}
        groupId={view.groupId}
        onSelectGroup={(groupId) => update({ groupId })}
        onOpenPalette={() => setPaletteOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <RuleList
        hidden={hideList}
        view={view}
        update={update}
        visible={visible}
        counts={counts}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onPin={workingSet.pin}
        searchRef={searchRef}
      />

      <section className="mn-detail" ref={detailRef}>
        <RuleTabs
          rules={rules}
          openIds={workingSet.openIds}
          selectedId={selectedId}
          draftingId={decision.target?.rule.id ?? null}
          decidedIds={workingSet.decidedIds}
          hideSide={hideSide}
          hideList={hideList}
          onToggleSide={() => setHideSide((hidden) => !hidden)}
          onToggleList={() => setHideList((hidden) => !hidden)}
          onSelect={setSelectedId}
          onPin={workingSet.pin}
          onClose={closeTab}
        />
        {selected ? (
          <RuleDetail
            rule={selected}
            rules={rules}
            mode={mode}
            decision={decision}
            composerVia={composerVia}
            onAction={(action) => act(action, 'pointer')}
            onSelect={setSelectedId}
            onViewIncidents={() => setIncidentsOpen(true)}
          />
        ) : (
          <div className="mn-empty">Select a rule</div>
        )}
        {selected && incidentsOpen && (
          <IncidentsPanel
            key={selected.id}
            rule={selected}
            wide={mode !== 'narrow'}
            searchRef={incidentSearchRef}
            onAction={(action) => act(action, 'pointer')}
            onClose={() => setIncidentsOpen(false)}
          />
        )}
      </section>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        rules={rules}
        selected={selected}
        onSelect={(id) => {
          update({ status: 'all', query: '' });
          setSelectedId(id);
        }}
        onStatus={(status) => update({ status })}
        onGroup={(groupId) => update({ groupId })}
        onSort={(sort) => update({ sort })}
        onAction={(action) => act(action, 'key')}
        onViewIncidents={() => setIncidentsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}
