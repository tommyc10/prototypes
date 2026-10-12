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
import { useTheme } from '../../hooks/useTheme';
import { navigate } from '../../lib/route';
import { INCIDENTS_TOUR } from '../../../tours/incidents';
import { Tour } from '../../../tours/Tour';
import { tourMode, useTour } from '../../../tours/useTour';
import { groupById } from '../rule-management/data/mockData';
import { useRulesStore } from '../rule-management/hooks/useRulesStore';
import { IncidentSearch } from './components/IncidentSearch/IncidentSearch';
import { Journey } from './components/Journey/Journey';
import { IncidentsPalette } from './components/Palette/IncidentsPalette';
import { Stages } from './components/Stages/Stages';
import { lifecycles } from './data/mockData';
import { END_LABEL, dayAndTime } from './model/lifecycle';
import type { StationId } from './model/types';
import './IncidentsPage.css';

/** How many of the latest incidents are there before anything is asked for. */
const LATEST = 12;
/** How long after the last keystroke the search is sent. */
const SEARCH_WAIT = 220;

export function IncidentsPage({ initialId }: { /** Open on this incident (a link from another page). */ initialId?: string }) {
  const rules = useRulesStore((s) => s.rules);
  const lives = useMemo(() => lifecycles(rules), [rules]);
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [query, setQuery] = useState('');
  // The search that has been answered. It trails what's typed, the way a request does.
  const [asked, setAsked] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setAsked(query.trim()), query.trim() ? SEARCH_WAIT : 0);
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
  const tour = useTour(INCIDENTS_TOUR.length, { auto: false, seenKey: 'mn-incidents-tour-seen' });

  // The list: the latest few until something is asked for, then whatever the search found.
  // (Here the search runs over the mock data. In the real app it's a request, and `found`
  // is the page of rows and the total that come back.)
  const found = useMemo(() => {
    if (!asked) return lives.slice(0, LATEST);
    const words = asked.toLowerCase().split(/\s+/).filter(Boolean);
    return lives.filter((l) => {
      const haystack = `${l.incident.id} ${l.incident.title} ${l.incident.ci} ${l.rule?.id ?? ''} ${l.rule?.name ?? ''} ${groupById(l.groupId).name}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }, [lives, asked]);

  // The incident on the page is fetched by its number, so it doesn't have to be in the list.
  // With none picked, the pane is empty.
  const life = lives.find((l) => l.incident.id === selectedId) ?? null;

  // Keep the address in step, without adding a Back step for every J and K.
  useEffect(() => {
    navigate(`#/incidents${life ? `/${life.incident.id}` : ''}`, true);
  }, [life?.incident.id]);

  // A different incident is a different page: start it from the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [life?.incident.id]);

  /** Pick an incident from outside the list (a link in a section, the command menu). */
  const select = (id: string) => {
    setVia('pointer');
    setSelectedId(id);
  };

  /** Move the selection up or down the list. With nothing picked, either way picks the first. */
  const move = (step: number) => {
    const i = found.findIndex((l) => l.incident.id === life?.incident.id);
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

  const group = life && groupById(life.groupId);
  const tone = !life ? undefined : life.end === 'suppressed' && life.real ? 'bad' : life.end === 'enriching' ? 'wait' : life.end === 'delivered' ? 'through' : undefined;

  return (
    <div className="mn ic" inert={tour.open} data-hide-side={hideSide || undefined} data-hide-list={hideList || undefined}>
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
        lives={found}
        asked={asked}
        searching={query.trim() !== asked}
        query={query}
        onQuery={setQuery}
        selectedId={life?.incident.id ?? null}
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
            {life && (
              <>
                <span className="mn-mono mn-subtle">{life.incident.id}</span>
                <span className="ic-badge" data-tone={tone}>
                  {END_LABEL[life.end]}
                </span>
              </>
            )}
          </div>

          {life && group ? (
            <article className="ic-page" aria-label={`The journey of ${life.incident.id}`}>
              <header className="ic-head" data-tour="ic-head">
                <h2>{life.incident.title}</h2>
                <div className="ic-meta">
                  <Server size={14} />
                  <span className="mn-mono">{life.incident.ci}</span>
                  <span className="mn-subtle">
                    · {group.name} · {group.unit}
                  </span>
                  <span className="ic-sep" />
                  Raised {dayAndTime(new Date(life.incident.openedAt).getTime())}
                </div>
                {/* The whole journey, as one sentence. */}
                <p className="ic-verdict" data-tone={tone}>
                  {life.summary}
                </p>
              </header>

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
