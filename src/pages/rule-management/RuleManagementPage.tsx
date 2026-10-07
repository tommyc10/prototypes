/* The rule management page. This file owns the page's state and wires the pieces together:
 *
 *   Sidebar      navigation (shared with the other pages), with this page's pinned groups in it
 *   RuleList     finding rules: group filter, search, status tabs, sort
 *   RuleDetail   the selected rule, and the decision form
 *   IncidentsPanel / CommandPalette   on top when opened
 *   IncidentView one incident, in a popup over the page when a row is clicked
 *   Tour         the guided tour, over everything (its code lives in tours/)
 *
 * Data flows down as props; changes come back up as callbacks (onSelect, onAction…). */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { CommandPalette } from './components/CommandPalette/CommandPalette';
import { DecisionToast } from './components/common/DecisionToast';
import { IncidentsPanel } from './components/Incidents/IncidentsPanel';
import { IncidentView } from './components/Incidents/IncidentView';
import { PinnedGroups } from './components/PinnedGroups/PinnedGroups';
import { RuleDetail } from './components/RuleDetail/RuleDetail';
import { RuleList } from './components/RuleList/RuleList';
import { PaneToggles } from '../../components/PaneToggles';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';
import { navigate } from '../../lib/route';
import { TOUR_STEPS } from '../../../tours/rule-management';
import { Tour } from '../../../tours/Tour';
import { tourMode, useTour } from '../../../tours/useTour';
import { useDecision } from './hooks/useDecision';
import { usePaneMode } from './hooks/usePaneMode';
import { usePinnedGroups } from './hooks/usePinnedGroups';
import { useRuleView } from './hooks/useRuleView';
import { useRulesStore } from './hooks/useRulesStore';
import { actionsFor } from './model/policy';
import type { RelatedIncident, RuleAction } from './model/types';

export function RuleManagementPage({ initialRuleId }: { /** Open on this rule (a link from another page). */ initialRuleId?: string }) {
  const rules = useRulesStore((s) => s.rules);
  const { view, update, visible, counts } = useRuleView(rules);
  const [pins, togglePin] = usePinnedGroups();
  const [selectedId, setSelectedId] = useState<string | null>(initialRuleId ?? null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [incidentsOpen, setIncidentsOpen] = useState(false);
  // The incident that's open, and the rule it was opened from.
  const [opened, setOpened] = useState<{ ruleId: string; incident: RelatedIncident } | null>(null);
  const [hideSide, setHideSide] = useState(false);
  const [hideList, setHideList] = useState(false);
  // Keyboard-opened decisions appear instantly; pointer-opened ones animate in.
  const [composerVia, setComposerVia] = useState<'key' | 'pointer'>('pointer');
  const [theme, toggleTheme] = useTheme();
  const [detailRef, mode] = usePaneMode();
  const searchRef = useRef<HTMLInputElement>(null);
  const incidentSearchRef = useRef<HTMLInputElement>(null);
  const tour = useTour(TOUR_STEPS.length);
  // Whether the tour opened the decision form (to show it), so it only closes its own.
  const tourDecision = useRef(false);

  const decision = useDecision((rule, action) => {
    toast.custom(() => <DecisionToast rule={rule} action={action} />);
  });

  const selected = rules.find((r) => r.id === selectedId) ?? null;
  // An open incident belongs to one rule: moving to another rule puts it away.
  const incident = selected && opened?.ruleId === selected.id ? opened.incident : null;
  useEffect(() => setOpened(null), [selectedId]);
  const openIncident = (incident: RelatedIncident) => selected && setOpened({ ruleId: selected.id, incident });

  // Keep the selection valid: if the list no longer shows the selected rule, pick its first one.
  useEffect(() => {
    if (!visible.length) return setSelectedId(null);
    if (!selectedId || !visible.some((r) => r.id === selectedId)) setSelectedId(visible[0].id);
  }, [visible, selectedId]);

  /** Start a decision on the selected rule, if that action is allowed. */
  const act = (action: RuleAction, via: 'key' | 'pointer') => {
    if (!selected || !actionsFor(selected).includes(action)) return;
    setIncidentsOpen(false); // the form lives in the detail pane, so leave the panels first
    setOpened(null);
    setComposerVia(via);
    decision.open(selected, action);
  };

  /** Move the selection up or down the list. */
  const move = (step: number) => {
    const i = visible.findIndex((r) => r.id === selectedId);
    const next = visible[Math.min(visible.length - 1, Math.max(0, i + step))];
    if (next) setSelectedId(next.id);
  };

  /** Start the tour with everything it points at on screen, on a rule that's waiting for a decision. */
  const startTour = () => {
    setHideSide(false);
    setHideList(false);
    setIncidentsOpen(false);
    setOpened(null);
    setPaletteOpen(false);
    if (selected?.status !== 'proposed') {
      const waiting = visible.find((r) => r.status === 'proposed');
      if (waiting) setSelectedId(waiting.id);
    }
    tour.start();
  };

  // The step about the decision form opens one on the selected rule; the others put it away again.
  const tourStep = tour.open ? TOUR_STEPS[tour.index] : null;
  useEffect(() => {
    if (tourStep?.showsDecision && selected && !decision.target) {
      tourDecision.current = true;
      setComposerVia('pointer');
      decision.open(selected, actionsFor(selected)[0]);
    } else if (!tourStep?.showsDecision && tourDecision.current) {
      tourDecision.current = false;
      decision.close();
    }
  }, [tourStep]);

  useKeyboardShortcuts({
    tourOpen: tour.open,
    paletteOpen,
    onTogglePalette: () => setPaletteOpen((open) => !open),
    decisionOpen: decision.target !== null,
    onCancelDecision: decision.close,
    onSubmitDecision: decision.submit,
    keys: {
      // Esc steps back one layer at a time: the incident first, then the incident list.
      Escape: () => (incident ? setOpened(null) : setIncidentsOpen(false)),
      a: () => act('approve', 'key'),
      x: () => act('reject', 'key'),
      e: () => act('activate', 'key'),
      d: () => act('deactivate', 'key'),
      // While an incident's popup is open, the page behind it stays as it is.
      ...(!incident && {
        j: () => move(1),
        ArrowDown: () => move(1),
        k: () => move(-1),
        ArrowUp: () => move(-1),
        '/': () => (incidentsOpen ? incidentSearchRef : searchRef).current?.focus(),
        '[': () => setHideSide((hidden) => !hidden),
        ']': () => setHideList((hidden) => !hidden),
        '?': startTour,
      }),
    },
  });

  return (
    <div className="mn" inert={tour.open} data-hide-side={hideSide || undefined} data-hide-list={hideList || undefined}>
      <Sidebar
        hidden={hideSide}
        page="rules"
        onOpenPalette={() => setPaletteOpen(true)}
        onStartTour={startTour}
        theme={theme}
        onToggleTheme={toggleTheme}
      >
        <PinnedGroups
          rules={rules}
          pins={pins}
          view={view}
          onSelect={(pin) => update({ groupBy: pin.by, groupId: pin.id })}
        />
      </Sidebar>

      <RuleList
        hidden={hideList}
        rules={rules}
        view={view}
        update={update}
        pins={pins}
        onTogglePin={togglePin}
        visible={visible}
        counts={counts}
        selectedId={selectedId}
        onSelect={setSelectedId}
        searchRef={searchRef}
      />

      <section className="mn-detail" ref={detailRef}>
        {selected ? (
          <RuleDetail
            rule={selected}
            rules={rules}
            mode={mode}
            decision={decision}
            composerVia={composerVia}
            toolbar={
              <PaneToggles
                hideSide={hideSide}
                hideList={hideList}
                onToggleSide={() => setHideSide((hidden) => !hidden)}
                onToggleList={() => setHideList((hidden) => !hidden)}
              />
            }
            onAction={(action) => act(action, 'pointer')}
            onSelect={setSelectedId}
            onViewIncidents={() => setIncidentsOpen(true)}
            onOpenIncident={openIncident}
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
            onOpenIncident={openIncident}
            onClose={() => setIncidentsOpen(false)}
          />
        )}
      </section>

      {selected && incident && (
        <IncidentView
          rule={selected}
          incident={incident}
          onOpen={openIncident}
          onAction={(action) => act(action, 'pointer')}
          onClose={() => setOpened(null)}
        />
      )}

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
        onGroup={(groupId) => update({ groupBy: 'assignment', groupId })}
        onSort={(sort) => update({ sort })}
        onAction={(action) => act(action, 'key')}
        onViewIncidents={() => setIncidentsOpen(true)}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        onStartTour={startTour}
      />

      {/* Rendered into <body>, outside the page, which is inert while the tour shows. */}
      {tour.open &&
        createPortal(
          <Tour steps={TOUR_STEPS} index={tour.index} onIndex={tour.go} onDone={tour.finish} lite={tourMode()} />,
          document.body,
        )}
    </div>
  );
}
