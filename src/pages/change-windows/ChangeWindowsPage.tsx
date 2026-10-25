/* The change windows page: every stretch of planned work, in place now, coming up or over.
 * A real feed has a hundred and fifty of them, so the page never shows them all at once.
 * They're sorted into categories (each group, or each family of CI where nobody set a
 * group), and one category at a time is drawn on a timeline, ten windows to a page.
 *
 * This file owns the page's state and wires the pieces together:
 *
 *   Sidebar         navigation (shared with the other pages)
 *   GroupList       the list column: the categories, what's in place and late in each
 *   WindowsBar      the pane toggles and the time now
 *   GroupTimeline   the picked category: a bar per window on a timeline
 *   WindowDetail    the picked window, in a rail that opens when one is picked
 *   WindowLanes     …with its own timeline, among its neighbours
 *   MaintenancePlan …and its maintenance plan: what happens to the tickets filed against
 *                   it while the work runs. M plans one for the picked window.
 *   WindowsPalette / Tour   on top when opened
 *
 * The state is small: the search, which category is picked, and which window (it's in the
 * address, so a window can be linked to). A window's status is never stored; it's worked
 * out from its times and the time now (see model/windows.ts). The plans live in a store
 * (hooks/usePlansStore.ts) so they outlast a visit; the plan form's state is the page's, so
 * its one key listener can give Esc and ⌘↵ to the form while it's open. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { PaneToggles } from '../../components/PaneToggles';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';
import { NOW } from '../../lib/clock';
import { navigate } from '../../lib/route';
import { WINDOWS_TOUR } from '../../../tours/change-windows';
import { Tour } from '../../../tours/Tour';
import { tourMode, useTour } from '../../../tours/useTour';
import { GroupList } from './components/GroupList/GroupList';
import { GroupTimeline } from './components/GroupTimeline/GroupTimeline';
import { WindowsPalette } from './components/Palette/WindowsPalette';
import { WindowDetail } from './components/WindowDetail/WindowDetail';
import { WindowLanes } from './components/WindowLanes/WindowLanes';
import { WindowsBar } from './components/WindowsBar/WindowsBar';
import { MaintenancePlan } from './components/MaintenancePlan/MaintenancePlan';
import { SAMPLES } from './data/mockData';
import { TICKETS } from './data/planData';
import { usePlanForm } from './hooks/usePlanForm';
import { usePlansStore } from './hooks/usePlansStore';
import { planLive, planStart, withWindow } from './model/plans';
import { categorise, groupFor, groupsOf } from './model/categories';
import type { ChangeWindow, Sample } from './model/types';
import { groupOf, sortWindows } from './model/windows';
import './ChangeWindowsPage.css';

export function ChangeWindowsPage({ initialId }: { /** Open on this window (a link: its ticket number). */ initialId?: string }) {
  // The prototype's clock is frozen. In the real app this is the time now, refreshed every minute.
  const now = NOW.getTime();
  // Prototype only: two made-up estates, to see the page with neat data and with a real feed's shape.
  const [sample, setSample] = useState<Sample>(() => (sessionStorage.getItem('mn-windows-sample') === 'busy' ? 'busy' : 'tidy'));
  const windows = useMemo(() => sortWindows(SAMPLES[sample], now), [sample, now]);
  const categories = useMemo(() => categorise(windows), [windows]);

  const [selectedKey, setSelectedKey] = useState<string | null>(() => windows.find((w) => w.id === initialId)?.key ?? null);
  // A linked window opens with its category showing.
  const [groupKey, setGroupKey] = useState<string | null>(() => {
    const linked = windows.find((w) => w.key === selectedKey);
    return linked ? categories.of(linked).key : null;
  });
  // Whether the window showing was picked with the pointer: then its timeline draws itself in.
  // Moved to with J and K, it's simply there.
  const [byPointer, setByPointer] = useState(false);
  const [query, setQuery] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [hideList, setHideList] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const plans = usePlansStore((s) => s.plans);
  const form = usePlanForm();
  const mainRef = useRef<HTMLDivElement>(null);
  const tour = useTour(WINDOWS_TOUR.length, { auto: false, seenKey: 'mn-windows-tour-seen' });
  // The order the timeline is showing the windows in, for J and K (it reports its own).
  const order = useRef<string[]>([]);
  const onOrder = useCallback((keys: string[]) => {
    order.current = keys;
  }, []);

  /** Every word of the search appears somewhere in the window: ticket, name, CIs, group or who raised it. */
  const matches = (w: ChangeWindow, search: string) => {
    const group = groupOf(w.groupId);
    const haystack = `${w.id} ${w.name} ${w.cis} ${group.name} ${group.unit} ${w.raisedBy}`.toLowerCase();
    return search.toLowerCase().split(/\s+/).filter(Boolean).every((word) => haystack.includes(word));
  };

  // The search first, so the categories and their counts describe what it found.
  const found = useMemo(() => windows.filter((w) => matches(w, query)), [windows, query]);
  const groups = useMemo(() => groupsOf(found, now, categories), [found, now, categories]);
  const group = groupFor(groups, groupKey);

  // The rail shows a window only while the search still has it.
  const selected = found.find((w) => w.key === selectedKey) ?? null;
  // A plan ends with its window, so one closed early cuts its plan short.
  const plan = selected && plans[selected.key] ? withWindow(plans[selected.key], selected) : undefined;
  // Tickets filed against the picked window so far, newest first.
  const tickets = useMemo(() => (selected ? TICKETS[sample].filter((t) => t.windowKey === selected.key && t.filedAt <= now).reverse() : []), [selected, sample, now]);
  // A plan can be started for work still to come, or changed while it hasn't ended.
  const plannable = !!selected && !selected.closedAt && (!plan || planLive(plan, now) || now < planStart(plan));
  const startPlan = (via: 'key' | 'pointer') => selected && plannable && form.open(selected, plan, now, via);

  // The form belongs to one window: picking another puts it away.
  useEffect(() => {
    if (form.windowKey && form.windowKey !== selected?.key) form.close();
  }, [selected?.key]);

  // Keep the address in step, without adding a Back step for every J and K.
  useEffect(() => {
    navigate(`#/changes${selected ? `/${selected.id}` : ''}`, true);
  }, [selected]);

  // Keep the picked lane in sight when J and K move it (the pager follows it onto the next page).
  useEffect(() => {
    mainRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedKey]);

  /** Pick a window with the pointer (a lane, a neighbour in the rail, the command menu).
   *  If it's in another category or the search would hide it, they give way. */
  const select = (key: string) => {
    const w = windows.find((w) => w.key === key);
    if (!w) return;
    setByPointer(true);
    setSelectedKey(key);
    if (!matches(w, query)) setQuery('');
    // "Every window" has it whatever its category; any other category gives way to the window's own.
    if (!group?.windows.includes(w)) setGroupKey(categories.of(w).key);
  };

  /** Move the selection up or down the timeline. */
  const move = (step: number) => {
    const keys = order.current;
    const next = keys[Math.min(keys.length - 1, Math.max(0, keys.indexOf(selected?.key ?? '') + step))];
    if (next) {
      setByPointer(false);
      setSelectedKey(next);
    }
  };

  // The tour's last step points at the rail, so it starts with a window picked.
  const startTour = () => {
    setHideSide(false);
    setHideList(false);
    setPaletteOpen(false);
    if (!selected && order.current[0]) setSelectedKey(order.current[0]);
    tour.start();
  };

  useKeyboardShortcuts({
    tourOpen: tour.open,
    paletteOpen,
    onTogglePalette: () => setPaletteOpen((open) => !open),
    decisionOpen: !!form.windowKey,
    onCancelDecision: form.close,
    onSubmitDecision: () => form.submit(now),
    keys: {
      m: () => startPlan('key'),
      j: () => move(1),
      ArrowDown: () => move(1),
      k: () => move(-1),
      ArrowUp: () => move(-1),
      '/': () => searchRef.current?.focus(),
      '[': () => setHideSide((hidden) => !hidden),
      ']': () => setHideList((hidden) => !hidden),
      '?': startTour,
      // Esc puts the rail away.
      ...(selected ? { Escape: () => setSelectedKey(null) } : {}),
    },
  });

  return (
    <div className="mn cw" inert={tour.open} data-hide-side={hideSide || undefined} data-hide-list={hideList || undefined}>
      <Sidebar
        hidden={hideSide}
        page="changes"
        onOpenPalette={() => setPaletteOpen(true)}
        onStartTour={startTour}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <GroupList hidden={hideList} groups={groups} group={group} onPick={setGroupKey} noun={categories.noun} query={query} onQuery={setQuery} searchRef={searchRef} />

      <section className="mn-detail cw-pane">
        <WindowsBar
          toolbar={
            <PaneToggles
              hideSide={hideSide}
              hideList={hideList}
              onToggleSide={() => setHideSide((hidden) => !hidden)}
              onToggleList={() => setHideList((hidden) => !hidden)}
              listLabel="Category list"
            />
          }
          now={now}
          sample={sample}
          onSample={(next) => {
            sessionStorage.setItem('mn-windows-sample', next);
            setSample(next);
            setSelectedKey(null);
            setGroupKey(null);
            setQuery('');
          }}
        />

        {/* The timeline, and beside it the rail, which is only there while a window is picked. */}
        <div className="cw-frame" data-rail={selected ? true : undefined}>
          <div className="cw-frame-main" ref={mainRef}>
            <GroupTimeline group={group} now={now} selectedKey={selected?.key ?? null} onSelect={select} onOrder={onOrder} plans={plans} />
          </div>
          {selected && (
            <aside className="cw-rail" aria-label="The picked window">
              <button className="mn-icon-btn cw-rail-close" onClick={() => setSelectedKey(null)} aria-label="Close" title="Close  Esc">
                <X size={15} />
              </button>
              <WindowDetail
                window={selected}
                all={windows}
                now={now}
                onSelect={select}
                timeline={<WindowLanes window={selected} all={windows} now={now} categories={categories} onSelect={select} animate={byPointer} />}
                plan={<MaintenancePlan window={selected} plan={plan} tickets={tickets} now={now} form={form} />}
              />
            </aside>
          )}
        </div>
      </section>

      <WindowsPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        windows={windows}
        now={now}
        onSelect={select}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        onStartTour={startTour}
        planFor={plannable ? selected : null}
        onPlan={() => startPlan('key')}
      />

      {/* Rendered into <body>, outside the page, which is inert while the tour shows. */}
      {tour.open &&
        createPortal(
          <Tour steps={WINDOWS_TOUR} index={tour.index} onIndex={tour.go} onDone={tour.finish} lite={tourMode()} />,
          document.body,
        )}
    </div>
  );
}
