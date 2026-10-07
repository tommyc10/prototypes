/* The incidents page: find any incident and see its whole journey. Was it held by a change
 * window, suppressed by a rule, folded into another, or sent to the Imperial Ops team to be
 * enriched and delivered? This file owns the page's state and wires the pieces together:
 *
 *   Sidebar          navigation (shared with the other pages)
 *   IncidentSearch   the list column: search, and how the journey ended
 *   the header       the incident, and its verdict in one sentence
 *   Journey          the line of checkpoints, lit as far as it got
 *   Stages           one section per checkpoint it reached, with the evidence
 *   IncidentsPalette / Tour   on top when opened
 *
 * The state is small: which incident is picked (it's in the address, so an incident can be
 * linked to), and the list's search and tab. A journey isn't stored; it's worked out from
 * the incident and the rules as they stand (data/mockData.ts). */

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
import { END_LABEL, dayAndTime, inFilter } from './model/lifecycle';
import type { EndFilter, StationId } from './model/types';
import './IncidentsPage.css';

export function IncidentsPage({ initialId }: { /** Open on this incident (a link from another page). */ initialId?: string }) {
  const rules = useRulesStore((s) => s.rules);
  const lives = useMemo(() => lifecycles(rules), [rules]);
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [filter, setFilter] = useState<EndFilter>('all');
  const [query, setQuery] = useState('');
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

  // The list: the search first, so the tab counts describe what it found.
  const list = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const found = lives.filter((l) => {
      const haystack = `${l.incident.id} ${l.incident.title} ${l.incident.ci} ${l.rule?.id ?? ''} ${l.rule?.name ?? ''} ${groupById(l.groupId).name}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
    const count = (f: EndFilter) => found.filter((l) => inFilter(l, f)).length;
    return {
      tabs: { all: count('all'), suppressed: count('suppressed'), enriched: count('enriched'), other: count('other') },
      shown: found.filter((l) => inFilter(l, filter)),
    };
  }, [lives, query, filter]);

  // The page always shows an incident that's in the list, so the two can't disagree: the
  // picked one if the list still has it, otherwise the list's first.
  const picked = list.shown.find((l) => l.incident.id === selectedId) ?? null;
  const life = picked ?? list.shown[0] ?? null;

  // Keep the address in step, without adding a Back step for every J and K.
  useEffect(() => {
    navigate(`#/incidents${picked ? `/${picked.incident.id}` : ''}`, true);
  }, [picked?.incident.id]);

  // A different incident is a different page: start it from the top.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [life?.incident.id]);

  /** Pick an incident from outside the list (a link in a section, the command menu).
   *  If the list's tab or search would hide it, they give way. */
  const select = (id: string) => {
    const target = lives.find((l) => l.incident.id === id);
    if (!target) return;
    setVia('pointer');
    setSelectedId(id);
    if (!list.shown.includes(target)) {
      setFilter('all');
      setQuery('');
    }
  };

  /** Move the selection up or down the list. */
  const move = (step: number) => {
    const i = list.shown.findIndex((l) => l.incident.id === life?.incident.id);
    const next = list.shown[Math.min(list.shown.length - 1, Math.max(0, i + step))];
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
        lives={list.shown}
        counts={list.tabs}
        filter={filter}
        onFilter={setFilter}
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
            <div className="mn-empty">No incident matches</div>
          )}
        </div>
      </section>

      <IncidentsPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        lives={lives}
        onSelect={select}
        onFilter={setFilter}
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
