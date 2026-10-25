/* The rule management page. This file owns the page's state and wires the pieces together:
 *
 *   Sidebar      navigation (shared with the other pages), with this page's pinned groups in it
 *   RuleList     finding rules: group filter, search, status tabs, sort
 *   OvernightBlock   what last night's refresh found, pinned above the rules until it is dealt with
 *   RuleDetail   the selected rule, and the decision form
 *   SuggestionDetail   the selected overnight suggestion: propose it or dismiss it
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
import { SuggestionToast } from './components/common/SuggestionToast';
import { IncidentsPanel } from './components/Incidents/IncidentsPanel';
import { IncidentView } from './components/Incidents/IncidentView';
import { RuleDetail } from './components/RuleDetail/RuleDetail';
import { OvernightBlock } from './components/RuleList/OvernightBlock';
import { RuleList } from './components/RuleList/RuleList';
import { SuggestionButtons, SuggestionDetail } from './components/SuggestionDetail/SuggestionDetail';
import { PaneToggles } from '../../components/PaneToggles';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';
import { NOW } from '../../lib/clock';
import { navigate } from '../../lib/route';
import { TOUR_STEPS } from '../../../tours/rule-management';
import { Tour } from '../../../tours/Tour';
import { tourMode, useTour } from '../../../tours/useTour';
import { CURRENT_USER, groupById } from './data/mockData';
import { NIGHT_TOTAL } from './data/overnightData';
import { useDecision } from './hooks/useDecision';
import { usePaneMode } from './hooks/usePaneMode';
import { usePinnedGroups, type Pin } from './hooks/usePinnedGroups';
import { useRuleView } from './hooks/useRuleView';
import { useRulesStore } from './hooks/useRulesStore';
import { useSuggestions, type Suggested } from './hooks/useSuggestions';
import { groupKey } from './model/browse';
import { actionsFor } from './model/policy';
import { canTighten, proposedFrom } from './model/suggestions';
import type { RelatedIncident, RuleAction } from './model/types';

/** How long the overnight block takes to fade out; its exit in OvernightBlock.css is the same length. */
const BLOCK_EXIT_MS = 150;

/** How long an arrival stays marked: long enough to play once, then it is an ordinary row again. */
const ARRIVE_MS = 600;

export function RuleManagementPage({
  initialRuleId,
  initialGroup,
}: {
  /** Open on this rule (a link from another page). */
  initialRuleId?: string;
  /** Open filtered to this group (a pinned group in the sidebar, picked on another page). */
  initialGroup?: Pin | null;
}) {
  const rules = useRulesStore((s) => s.rules);
  const { view, update, visible, counts } = useRuleView(rules, initialGroup ? { groupBy: initialGroup.by, groupId: initialGroup.id } : undefined);
  const [pins, togglePin] = usePinnedGroups();
  // A rule's id, or an overnight suggestion's: both are rows in the same list.
  const [selectedId, setSelectedId] = useState<string | null>(initialRuleId ?? null);
  const overnight = useSuggestions();
  // Folded to its heading at first, so a busy night doesn't push the rules down the list. O, the
  // heading, an undo or a link to one of its suggestions opens it.
  const [overnightCollapsed, setOvernightCollapsed] = useState(() => !overnight.open.some((item) => item.suggestion.id === initialRuleId));
  // Three small arrivals and departures in the overnight flow. Like the decision form, they
  // only play when the action came from the pointer: what the keyboard does happens at once.
  //   arrivedId      the rule a suggestion has just become, so its row can travel into the list
  //   retuned        set for a moment after a threshold moves, so the changed numbers arrive
  //   leavingBlock   the block's last contents, kept on screen while it fades out
  const [arrivedId, setArrivedId] = useState<string | null>(null);
  const [retuned, setRetuned] = useState(0);
  const [leavingBlock, setLeavingBlock] = useState<Suggested[] | null>(null);
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

  // The suggestions the list is showing: they wait with the proposed rules, and follow the
  // group filter and the search like everything else.
  const words = view.query.toLowerCase().split(/\s+/).filter(Boolean);
  const suggestions =
    view.status === 'all' || view.status === 'proposed'
      ? overnight.open.filter(
          ({ suggestion: s, rule }) =>
            (view.groupId === 'all' || groupKey(rule, view.groupBy) === view.groupId) &&
            words.every((word) => `${s.id} ${s.name} ${groupById(s.groupId).name}`.toLowerCase().includes(word)),
        )
      : [];

  const selected = rules.find((r) => r.id === selectedId) ?? null;
  const suggested = suggestions.find((item) => item.suggestion.id === selectedId) ?? null;
  // An open incident belongs to one rule (or suggestion): moving to another puts it away.
  const owner = selected ?? suggested?.rule ?? null;
  const incident = owner && opened?.ruleId === owner.id ? opened.incident : null;
  useEffect(() => setOpened(null), [selectedId]);
  const openIncident = (incident: RelatedIncident) => owner && setOpened({ ruleId: owner.id, incident });
  /** With an incident open, move to the next or previous of the rule's incidents in its place. */
  const stepIncident = (by: number) => {
    if (!owner || !incident) return;
    const at = Math.max(0, owner.related.findIndex((i) => i.id === incident.id));
    openIncident(owner.related[Math.min(owner.related.length - 1, Math.max(0, at + by))]);
  };

  // Every row J and K can reach, top to bottom: the overnight block, then the rules.
  const rows = [...(overnightCollapsed ? [] : suggestions.map((item) => item.suggestion.id)), ...visible.map((r) => r.id)];
  const rowKey = rows.join();

  // Keep the selection valid: if the list no longer shows what's selected, pick its first rule.
  useEffect(() => {
    if (!rows.length) return setSelectedId(null);
    if (!selectedId || !rows.includes(selectedId)) setSelectedId(visible[0]?.id ?? rows[0]);
  }, [rowKey, selectedId]);

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
    const next = rows[Math.min(rows.length - 1, Math.max(0, rows.indexOf(selectedId ?? '') + step))];
    if (next) setSelectedId(next);
  };

  /** After a suggestion is dealt with, step to the next one waiting, or back to the rules. */
  const leave = ({ suggestion }: Suggested, via: 'key' | 'pointer') => {
    const rest = suggestions.filter((item) => item.suggestion.id !== suggestion.id);
    // The last one: the block fades out with it, rather than vanishing and jolting the rules up.
    if (via === 'pointer' && rest.length === 0) {
      setLeavingBlock(suggestions);
      setTimeout(() => setLeavingBlock(null), BLOCK_EXIT_MS);
    }
    const next = rest[suggestions.findIndex((item) => item.suggestion.id === suggestion.id)] ?? rest[rest.length - 1];
    setOpened(null);
    setSelectedId(next?.suggestion.id ?? visible[0]?.id ?? null);
  };

  /** Turn a suggestion into a proposed rule. It joins the list, waiting for approval. */
  const propose = (item: Suggested, via: 'key' | 'pointer' = 'pointer') => {
    const rule = proposedFrom(item.suggestion, item.rule, item.match, CURRENT_USER, NOW.toISOString());
    useRulesStore.getState().propose(rule);
    overnight.handle(item.suggestion.id);
    leave(item, via);
    if (via === 'pointer') {
      setArrivedId(rule.id);
      setTimeout(() => setArrivedId(null), ARRIVE_MS);
    }
    toast.custom((id) => (
      <SuggestionToast
        title={`${rule.id} proposed`}
        sub="Waiting for approval, with the other proposed rules"
        action="View"
        onAction={() => {
          update({ status: 'all', query: '', groupId: 'all' });
          setSelectedId(rule.id);
          toast.dismiss(id);
        }}
      />
    ));
  };

  const dismiss = (item: Suggested, via: 'key' | 'pointer' = 'pointer') => {
    const { id } = item.suggestion;
    overnight.handle(id);
    leave(item, via);
    toast.custom((toastId) => (
      <SuggestionToast
        title={`${id} dismissed`}
        sub="It won't be suggested again unless the pattern changes"
        action="Undo"
        onAction={() => {
          overnight.restore(id);
          setOvernightCollapsed(false);
          setSelectedId(id);
          toast.dismiss(toastId);
        }}
      />
    ));
  };

  /** Tighten the selected suggestion to the threshold that hides no real incident. */
  const tighten = () => {
    if (!suggested || !canTighten(suggested.suggestion, suggested.match, suggested.threshold)) return;
    overnight.setThreshold(suggested.suggestion, suggested.suggestion.threshold.safe ?? null);
  };

  /** A threshold moved with the pointer: let the numbers it changed arrive (see SuggestionDetail). */
  const retune = (item: Suggested, value: number | null) => {
    overnight.setThreshold(item.suggestion, value);
    setRetuned(Date.now());
    setTimeout(() => setRetuned(0), ARRIVE_MS);
  };

  /** Jump to the overnight block, opening it if it was folded away. */
  const toOvernight = () => {
    if (!suggestions.length) return;
    setOvernightCollapsed(false);
    if (!suggested) setSelectedId(suggestions[0].suggestion.id);
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
      // X turns down whatever is selected: a suggestion is dismissed, a proposed rule rejected.
      x: () => (suggested ? dismiss(suggested, 'key') : act('reject', 'key')),
      p: () => suggested && propose(suggested, 'key'),
      t: tighten,
      e: () => act('activate', 'key'),
      d: () => act('deactivate', 'key'),
      // While an incident's popup is open, the page behind it stays as it is: J and K walk
      // the rule's incidents instead of the list.
      ...(incident && {
        j: () => stepIncident(1),
        ArrowDown: () => stepIncident(1),
        k: () => stepIncident(-1),
        ArrowUp: () => stepIncident(-1),
      }),
      ...(!incident && {
        j: () => move(1),
        ArrowDown: () => move(1),
        k: () => move(-1),
        ArrowUp: () => move(-1),
        '/': () => (incidentsOpen ? incidentSearchRef : searchRef).current?.focus(),
        '[': () => setHideSide((hidden) => !hidden),
        ']': () => setHideList((hidden) => !hidden),
        o: toOvernight,
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
        activePin={view.groupId === 'all' ? null : { by: view.groupBy, id: view.groupId }}
        onPin={(pin) => update({ groupBy: pin.by, groupId: pin.id })}
      />

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
        arrivedId={arrivedId}
        pinned={
          (leavingBlock ?? suggestions).length > 0 && (
            <OvernightBlock
              items={leavingBlock ?? suggestions}
              leaving={leavingBlock !== null}
              total={NIGHT_TOTAL}
              collapsed={overnightCollapsed}
              onToggle={() => setOvernightCollapsed((collapsed) => !collapsed)}
              selectedId={selectedId}
              onSelect={setSelectedId}
              theme={theme}
            />
          )
        }
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
        ) : suggested ? (
          <SuggestionDetail
            key={suggested.suggestion.id}
            suggested={suggested}
            rules={rules}
            mode={mode}
            toolbar={
              <PaneToggles
                hideSide={hideSide}
                hideList={hideList}
                onToggleSide={() => setHideSide((hidden) => !hidden)}
                onToggleList={() => setHideList((hidden) => !hidden)}
              />
            }
            onPropose={() => propose(suggested)}
            onDismiss={() => dismiss(suggested)}
            arrive={retuned}
            onThreshold={(value) => retune(suggested, value)}
            onSelect={setSelectedId}
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

      {owner && incident && (
        <IncidentView
          rule={owner}
          incident={incident}
          onOpen={openIncident}
          onStep={stepIncident}
          onAction={(action) => act(action, 'pointer')}
          actions={suggested && <SuggestionButtons onPropose={() => propose(suggested)} onDismiss={() => dismiss(suggested)} />}
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
