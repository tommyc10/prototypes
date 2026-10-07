/* The change windows page: every stretch of planned work, in place now, coming up or over.
 * This file owns the page's state and wires the pieces together:
 *
 *   Sidebar        navigation (shared with the other pages)
 *   WindowList     every window, what needs watching first: search and the tabs
 *   WindowsBar     the time now, and how much time the schedule shows
 *   Tally          the estate in four numbers
 *   Schedule       the chart: one bar per window on a timeline, a row per group
 *   WindowDetail   the picked window
 *   WindowsPalette / Tour   on top when opened
 *
 * The state is small: which window is picked (it's in the address, so a window can be
 * linked to), the list's tab and search, and the schedule's range. A window's status is
 * never stored; it's worked out from its times and the time now (see model/windows.ts). */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PaneToggles } from '../../components/PaneToggles';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';
import { NOW } from '../../lib/clock';
import { navigate } from '../../lib/route';
import { WINDOWS_TOUR } from '../../../tours/change-windows';
import { Tour } from '../../../tours/Tour';
import { tourMode, useTour } from '../../../tours/useTour';
import { groupById } from '../rule-management/data/mockData';
import { WindowsPalette } from './components/Palette/WindowsPalette';
import { Schedule } from './components/Schedule/Schedule';
import { Tally } from './components/Tally/Tally';
import { WindowDetail } from './components/WindowDetail/WindowDetail';
import { WindowList } from './components/WindowList/WindowList';
import { WindowsBar } from './components/WindowsBar/WindowsBar';
import { WINDOWS } from './data/mockData';
import type { ChangeWindow, ListFilter, Range } from './model/types';
import { inFilter, sortWindows } from './model/windows';
import './ChangeWindowsPage.css';

export function ChangeWindowsPage({ initialId }: { /** Open on this window (a link: its ticket number). */ initialId?: string }) {
  // The prototype's clock is frozen. In the real app this is the time now, refreshed every minute.
  const now = NOW.getTime();
  const windows = useMemo(() => sortWindows(WINDOWS, now), [now]);

  const [selectedKey, setSelectedKey] = useState<string | null>(() => windows.find((w) => w.id === initialId)?.key ?? null);
  // A linked window opens with the tab that has it in.
  const [filter, setFilter] = useState<ListFilter>(() => {
    const linked = windows.find((w) => w.key === selectedKey);
    return linked && !inFilter(linked, 'now', now) ? 'all' : 'now';
  });
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<Range>(24);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [hideList, setHideList] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const tour = useTour(WINDOWS_TOUR.length, { auto: false, seenKey: 'mn-windows-tour-seen' });

  /** Every word of the search appears somewhere in the window: ticket, name, CIs, group or who raised it. */
  const matches = (w: ChangeWindow, search: string) => {
    const group = groupById(w.groupId);
    const haystack = `${w.id} ${w.name} ${w.cis} ${group.name} ${group.unit} ${w.raisedBy}`.toLowerCase();
    return search.toLowerCase().split(/\s+/).filter(Boolean).every((word) => haystack.includes(word));
  };

  // The list: the search first, so the tab counts describe what it found.
  const list = useMemo(() => {
    const found = windows.filter((w) => matches(w, query));
    const count = (f: ListFilter) => found.filter((w) => inFilter(w, f, now)).length;
    return {
      tabs: { all: count('all'), now: count('now'), upcoming: count('upcoming'), ended: count('ended') },
      shown: found.filter((w) => inFilter(w, filter, now)),
    };
  }, [windows, query, filter, now]);

  // The detail always shows a window that's in the list, so the two can't disagree: the
  // picked one if the list still has it, otherwise the list's first (the one that most
  // needs watching).
  const picked = list.shown.find((w) => w.key === selectedKey) ?? null;
  const selected = picked ?? list.shown[0] ?? null;

  // Keep the address in step, without adding a Back step for every J and K.
  useEffect(() => {
    navigate(`#/changes${picked ? `/${picked.id}` : ''}`, true);
  }, [picked]);

  /** Pick a window from outside the list (a bar on the schedule, the command menu).
   *  If the list's tab or search would hide it, they give way. */
  const select = (key: string) => {
    const w = windows.find((w) => w.key === key);
    if (!w) return;
    setSelectedKey(key);
    if (!inFilter(w, filter, now)) setFilter('all');
    if (!matches(w, query)) setQuery('');
  };

  /** Move the selection up or down the list. */
  const move = (step: number) => {
    const i = list.shown.findIndex((w) => w.key === selected?.key);
    const next = list.shown[Math.min(list.shown.length - 1, Math.max(0, i + step))];
    if (next) setSelectedKey(next.key);
  };

  const startTour = () => {
    setHideSide(false);
    setHideList(false);
    setPaletteOpen(false);
    tour.start();
  };

  useKeyboardShortcuts({
    tourOpen: tour.open,
    paletteOpen,
    onTogglePalette: () => setPaletteOpen((open) => !open),
    keys: {
      j: () => move(1),
      ArrowDown: () => move(1),
      k: () => move(-1),
      ArrowUp: () => move(-1),
      '/': () => searchRef.current?.focus(),
      '[': () => setHideSide((hidden) => !hidden),
      ']': () => setHideList((hidden) => !hidden),
      '?': startTour,
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

      <WindowList
        hidden={hideList}
        windows={list.shown}
        counts={list.tabs}
        now={now}
        filter={filter}
        onFilter={setFilter}
        query={query}
        onQuery={setQuery}
        selectedKey={selected?.key ?? null}
        onSelect={setSelectedKey}
        searchRef={searchRef}
      />

      <section className="mn-detail">
        <div className="cw-scroll">
          <WindowsBar
            toolbar={
              <PaneToggles
                hideSide={hideSide}
                hideList={hideList}
                onToggleSide={() => setHideSide((hidden) => !hidden)}
                onToggleList={() => setHideList((hidden) => !hidden)}
                listLabel="Window list"
              />
            }
            now={now}
            range={range}
            onRange={setRange}
          />
          <div className="cw-page">
            <Tally windows={windows} now={now} />
            <Schedule windows={windows} now={now} range={range} selectedKey={selected?.key ?? null} onSelect={select} />
            <WindowDetail window={selected} all={windows} now={now} onSelect={select} />
          </div>
        </div>
      </section>

      <WindowsPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        windows={windows}
        now={now}
        onSelect={select}
        onRange={setRange}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        onStartTour={startTour}
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
