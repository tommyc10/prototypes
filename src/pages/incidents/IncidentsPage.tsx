/* The incidents page: find any incident and see its whole journey. Was it held by a change
 * window, suppressed by a rule, folded into another, or sent to the Imperial Ops team to be
 * enriched and delivered? This file owns the page's state and wires the pieces together:
 *
 *   Sidebar          navigation (shared with the other pages)
 *   IncidentSearch   the list column: the latest few, and the search that finds any other
 *   the header       the incident, and its verdict in one sentence
 *   Journey          the line of checkpoints, lit as far as it got
 *   Stages           one section per checkpoint it reached, with the evidence
 *   IncidentsPalette / Tour   on top when opened
 *
 * The state is small: which incident is picked (it's in the address, so an incident can be
 * linked to), and the search. A journey isn't stored; it's worked out from the incident and
 * the rules as they stand (data/mockData.ts).
 *
 * Waiting looks the same everywhere on the page: it sheens (see mn-skel in styles/ui.css and
 * hooks/useSheen.ts). One band of light crosses the window and passes over every shape at
 * once, so when the list and the pane wait together they read as one page loading.
 *
 *   the list   on opening, a shape for each of the latest few while they load; during a
 *              search, the rows already there stay, sit back and take the same light
 *   the pane   a picked incident's journey is fetched by its number, and while it's on its
 *              way the pane shows what the list row already knew (the number, title, CI, when
 *              it was raised and how it ended), and below it the journey and its sections as
 *              shapes in their own layout (JourneySkeleton, StagesSkeleton): as many sections
 *              as the ending says it reached, so what lands fills the shapes it replaces.
 *              Never the journey's line or dot: a waiting journey must not look like one that
 *              stopped. Only the last pick is ever shown: stepping on before a journey
 *              arrives drops it.
 *
 * Opened by a link, both wait, and the list holds its rows until the journey is in too, so
 * the page lands once.
 *
 * The page never loads every incident, because a real feed has far too many: it shows the
 * latest few, and everything else is found by asking. So it has no totals and no tabs with
 * counts, which could only describe whatever happened to be loaded. With nothing picked,
 * the pane is empty and says how to find one. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Server } from 'lucide-react';
import { PaneToggles } from '../../components/PaneToggles';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useSheen } from '../../hooks/useSheen';
import { useTheme } from '../../hooks/useTheme';
import { navigate } from '../../lib/route';
import { INCIDENTS_TOUR } from '../../../tours/incidents';
import { Tour } from '../../../tours/Tour';
import { tourMode, useTour } from '../../../tours/useTour';
import { groupById } from '../rule-management/data/mockData';
import { useRulesStore } from '../rule-management/hooks/useRulesStore';
import { IncidentSearch } from './components/IncidentSearch/IncidentSearch';
import { Journey, JourneySkeleton } from './components/Journey/Journey';
import { IncidentsPalette } from './components/Palette/IncidentsPalette';
import { Stages, StagesSkeleton } from './components/Stages/Stages';
import { lifecycles } from './data/mockData';
import { END_LABEL, dayAndTime } from './model/lifecycle';
import type { Lifecycle, StationId } from './model/types';
import './IncidentsPage.css';

/** How many of the latest incidents are there before anything is asked for. */
const LATEST = 12;
/** How long after the last keystroke the search is sent. */
const SEARCH_WAIT = 220;
/** How long the list's rows take to arrive, the latest few or a search's. Fake, like the data:
 * it stands in for the request, so the waiting state can be seen. */
const LIST_WAIT = 600;
/** How long an incident's journey takes to arrive once it's picked. Fake, like the data: it
 * stands in for the request, so the waiting state can be seen. */
const STORY_WAIT = 700;

export function IncidentsPage({ initialId }: { /** Open on this incident (a link from another page). */ initialId?: string }) {
  const rules = useRulesStore((s) => s.rules);
  const lives = useMemo(() => lifecycles(rules), [rules]);
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [query, setQuery] = useState('');
  // The latest few, fetched once when the page opens. Opened by a link, they wait for the
  // linked journey too, so the list and the pane land together.
  const [listReady, setListReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setListReady(true), initialId ? STORY_WAIT : LIST_WAIT);
    return () => clearTimeout(timer);
  }, []);
  // The search that has been answered. It trails what's typed, the way a request does: sent
  // a moment after the last keystroke, then answered. Clearing it goes straight back to the
  // latest few, which are already here.
  const [asked, setAsked] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setAsked(query.trim()), query.trim() ? SEARCH_WAIT + LIST_WAIT : 0);
    return () => clearTimeout(timer);
  }, [query]);
  // How the incident on screen was opened. The pointer (or a link) plays its journey; the
  // keyboard shows it at once. `replay` counts presses of "play again".
  const [via, setVia] = useState<'pointer' | 'key'>('pointer');
  const [replay, setReplay] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [hideList, setHideList] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  useSheen(rootRef);
  const tour = useTour(INCIDENTS_TOUR.length, { auto: false, seenKey: 'mn-incidents-tour-seen' });

  // The list: the latest few until something is asked for, then whatever the search found.
  // (Here the search runs over the mock data. In the real app it's a request, and `found`
  // is the page of rows and the total that come back.)
  const found = useMemo(() => {
    if (!listReady) return [];
    if (!asked) return lives.slice(0, LATEST);
    const words = asked.toLowerCase().split(/\s+/).filter(Boolean);
    return lives.filter((l) => {
      const haystack = `${l.incident.id} ${l.incident.title} ${l.incident.ci} ${l.rule?.id ?? ''} ${l.rule?.name ?? ''} ${groupById(l.groupId).name}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }, [lives, asked, listReady]);

  // The journeys that have arrived. One fetched once shows at once when it's picked again.
  const [fetched, setFetched] = useState<ReadonlySet<string>>(() => new Set());
  const waiting = selectedId !== null && !fetched.has(selectedId);
  // A new pick clears the timer, so a journey that arrives late is never shown.
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setFetched((ids) => new Set(ids).add(selectedId)), STORY_WAIT);
    return () => clearTimeout(timer);
  }, [selectedId, waiting]);

  // The incident on the page is fetched by its number, so it doesn't have to be in the list.
  // With none picked, or a number that doesn't exist, the pane is empty.
  const life = waiting ? null : (lives.find((l) => l.incident.id === selectedId) ?? null);
  // What's known before it arrives: its row, if it's in the list (not when it came from a link).
  const known: Pick<Lifecycle, 'incident' | 'end' | 'real' | 'groupId' | 'rule'> | undefined = life ?? found.find((l) => l.incident.id === selectedId);
  const shownId = waiting || life ? selectedId : null;

  // Keep the address in step, without adding a Back step for every J and K.
  useEffect(() => {
    navigate(`#/incidents${shownId ? `/${shownId}` : ''}`, true);
  }, [shownId]);

  // A different incident is a different page: start it from the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [shownId]);

  /** Pick an incident from outside the list (a link in a section, the command menu). */
  const select = (id: string) => {
    setVia('pointer');
    setSelectedId(id);
  };

  /** Move the selection up or down the list. With nothing picked, either way picks the first. */
  const move = (step: number) => {
    const i = found.findIndex((l) => l.incident.id === shownId);
    const next = i < 0 ? found[0] : found[Math.min(found.length - 1, Math.max(0, i + step))];
    if (!next) return;
    setVia('key');
    setSelectedId(next.incident.id);
  };

  /** Jump to a checkpoint's section. Instant: it's a jump, not a journey. */
  const jump = (station: StationId) => document.getElementById(`ic-${station}`)?.scrollIntoView({ block: 'start' });

  const startTour = () => {
    setHideSide(false);
    setHideList(false);
    setPaletteOpen(false);
    scrollRef.current?.scrollTo({ top: 0 });
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
      // Back to the empty pane.
      Escape: () => setSelectedId(null),
      '[': () => setHideSide((hidden) => !hidden),
      ']': () => setHideList((hidden) => !hidden),
      '?': startTour,
    },
  });

  const group = known && groupById(known.groupId);
  const tone = !known ? undefined : known.end === 'suppressed' && known.real ? 'bad' : known.end === 'enriching' ? 'wait' : known.end === 'delivered' ? 'through' : undefined;

  return (
    <div className="mn ic" ref={rootRef} inert={tour.open} data-hide-side={hideSide || undefined} data-hide-list={hideList || undefined}>
      <Sidebar
        hidden={hideSide}
        page="incidents"
        onOpenPalette={() => setPaletteOpen(true)}
        onStartTour={startTour}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <IncidentSearch
        hidden={hideList}
        loading={listReady ? null : { count: LATEST }}
        lives={found}
        asked={asked}
        searching={query.trim() !== asked}
        query={query}
        onQuery={setQuery}
        selectedId={shownId}
        onSelect={(id) => {
          setVia('pointer');
          setSelectedId(id);
        }}
        searchRef={searchRef}
      />

      <section className="mn-detail">
        <div className="ic-scroll" ref={scrollRef}>
          <div className="ic-top">
            <PaneToggles
              hideSide={hideSide}
              hideList={hideList}
              onToggleSide={() => setHideSide((hidden) => !hidden)}
              onToggleList={() => setHideList((hidden) => !hidden)}
              listLabel="Incident list"
            />
            {shownId && <span className="mn-mono mn-subtle">{shownId}</span>}
            {known ? (
              <span className="ic-badge" data-tone={tone}>
                {END_LABEL[known.end]}
              </span>
            ) : (
              waiting && <span className="mn-skel ic-badge-shape" data-shape="pill" aria-hidden />
            )}
          </div>

          {shownId ? (
            // A journey that arrives after a pointer pick rises in; from the keyboard it's simply there.
            <article className="ic-page" aria-label={`The journey of ${shownId}`} aria-busy={waiting} data-arrive={via === 'pointer' || undefined}>
              <header className="ic-head" data-tour="ic-head">
                {known ? <h2>{known.incident.title}</h2> : <span className="mn-skel ic-shape-title" aria-hidden />}
                <div className="ic-meta">
                  <Server size={14} />
                  {known ? (
                    <>
                      <span className="mn-mono">{known.incident.ci}</span>
                      {group && (
                        <span className="mn-subtle">
                          · {group.name} · {group.unit}
                        </span>
                      )}
                      <span className="ic-sep" />
                      Raised {dayAndTime(new Date(known.incident.openedAt).getTime())}
                    </>
                  ) : (
                    <span className="mn-skel ic-shape-meta" aria-hidden />
                  )}
                </div>
                {/* The whole journey, as one sentence. Until it arrives, two lines of shape, and
                    the words a screen reader hears. */}
                {life ? (
                  <p className="ic-verdict" data-tone={tone}>
                    {life.summary}
                  </p>
                ) : (
                  <p className="ic-verdict ic-shape-lines" data-waiting role="status">
                    <span className="mn-sr">Fetching the journey of {shownId}…</span>
                    <span className="mn-skel" style={{ width: '92%' }} aria-hidden />
                    <span className="mn-skel ic-shape-more" style={{ width: '56%' }} aria-hidden />
                  </p>
                )}
              </header>

              {!life ? (
                // The journey and its sections as shapes in their own layout. How far it got comes
                // from its ending, when the list row knows it; opened by its number alone, four.
                <>
                  <JourneySkeleton />
                  <StagesSkeleton end={known?.end} rule={known ? Boolean(known.rule) : undefined} real={known?.real} />
                </>
              ) : (
                <>
                  {/* `key` gives each incident (and each "play again") a fresh journey, so it plays from the start. */}
                  <Journey
                    key={`${life.incident.id}-${replay}`}
                    life={life}
                    play={via === 'pointer'}
                    onJump={jump}
                    onReplay={() => {
                      setVia('pointer');
                      setReplay((n) => n + 1);
                    }}
                  />

                  <Stages
                    life={life}
                    activeRules={rules.filter((r) => r.status === 'active').length}
                    onOpenRule={(id) => navigate(`#/rules/${id}`)}
                    onOpenWindow={(id) => navigate(`#/changes/${id}`)}
                    onOpenIncident={select}
                  />
                </>
              )}
            </article>
          ) : (
            <div className="ic-blank">
              <h2>Find an incident</h2>
              <p>
                Search by its number, its title, the CI it was raised on, the rule it fits or the group it belongs to. Pick one to see its
                whole journey: where it was stopped, or how it reached a person.
              </p>
              <p className="ic-blank-keys">
                <span>
                  <kbd>/</kbd> Search
                </span>
                <span>
                  <kbd>J</kbd> <kbd>K</kbd> Step through the list
                </span>
              </p>
            </div>
          )}
        </div>
      </section>

      <IncidentsPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        lives={found}
        onSelect={select}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        onStartTour={startTour}
      />

      {/* Rendered into <body>, outside the page, which is inert while the tour shows. */}
      {tour.open &&
        createPortal(<Tour steps={INCIDENTS_TOUR} index={tour.index} onIndex={tour.go} onDone={tour.finish} lite={tourMode()} />, document.body)}
    </div>
  );
}
