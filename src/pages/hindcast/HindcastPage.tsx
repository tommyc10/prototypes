/* The hindcast: every ticket raised, what caused it, when, and the patterns that repeat, on one
 * screen. This file owns the page's state and wires the pieces together:
 *
 *   Sidebar          navigation (shared with the other pages)
 *   TopBar           the page's name, and its scope: service and lookback
 *   the grid         headline figures, tickets week by week, root causes, the tickets
 *                    themselves, the patterns that repeat, and when tickets arrive
 *   AnalysisPalette  on top when opened
 *
 * The patterns are what the forecast page (src/pages/forecast) projects forward. Each card
 * links to its prediction there, and a prediction links back here, ringing its pattern.
 *
 * Scope lives in the address (#/hindcast/holonet/26) and is remembered for the session, so the
 * forecast opens on the same service and lookback. Every figure is read from model/hindcast.ts. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';
import { num, pct } from '../../lib/format';
import { navigate } from '../../lib/route';
import { CauseList } from './components/CauseList/CauseList';
import { Heatmap } from './components/charts/Heatmap';
import { OUTCOME_TONE, VolumeChart, VolumeTable } from './components/charts/VolumeChart';
import { Counting, Kpis, type KpiTile } from './components/Kpis/Kpis';
import { AnalysisPalette } from './components/Palette/AnalysisPalette';
import { Panel } from './components/Panel/Panel';
import { CONFIDENT, PatternList } from './components/PatternList/PatternList';
import { TicketList } from './components/TicketList/TicketList';
import { TopBar } from './components/TopBar/TopBar';
import { TICKETS, serviceName } from './data/mockData';
import { useEntrance } from './hooks/useEntrance';
import { snapNextChange } from './hooks/useTween';
import { asPattern, useScope } from './hooks/useScope';
import { hindcast as runHindcast } from './model/hindcast';
import { CAUSE_LABEL, DEFAULT_LOOKBACK, OUTCOME_LABEL, OUTCOMES, TODAY, change, plural, span } from './model/labels';
import type { CauseKey } from './model/types';
import './components/charts/charts.css';
import './layout.css';

export function HindcastPage({ serviceId: serviceFromAddress, weeks: weeksFromAddress, focus }: { serviceId?: string; weeks?: string; focus?: string }) {
  const [{ serviceId, weeks, horizon }, setScope] = useScope({ serviceId: serviceFromAddress, weeks: weeksFromAddress });
  const arrivedOn = asPattern(focus);
  const [cause, setCause] = useState<CauseKey | null>(null);
  const [query, setQuery] = useState('');
  const [flash, setFlash] = useState<string | null>(arrivedOn);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const hc = useMemo(() => runHindcast(TICKETS, { serviceId, weeks, cause }), [serviceId, weeks, cause]);
  // Arriving from a prediction, the reader is mid-task: no story, just the page and its ring.
  const motion = useEntrance(!arrivedOn);

  // Keep the address in step, without adding a Back step for every change.
  useEffect(() => {
    navigate(`#/hindcast${serviceId !== 'all' || weeks !== DEFAULT_LOOKBACK ? `/${serviceId}/${weeks}` : ''}`, true);
  }, [serviceId, weeks]);

  // A flashed card is scrolled into its list, and the flash lets go once it has played.
  useEffect(() => {
    if (!flash) return;
    const card = listRef.current?.querySelector<HTMLElement>(`[data-pattern="${flash}"]`);
    if (card) card.parentElement!.scrollTop = card.offsetTop - card.parentElement!.offsetTop - 4;
    const t = setTimeout(() => setFlash(null), 1600);
    return () => clearTimeout(t);
  }, [flash]);

  /** Change the scope. Every panel stays where it is and its figures morph to the new ones. */
  const rescope = (patch: Parameters<typeof setScope>[0]) => setScope(patch);

  /** Open a pattern's prediction on the forecast page, in the same scope. */
  const toForecast = (patternId: string) => navigate(`#/forecast/${serviceId}/${weeks}/${horizon}/${patternId}`);

  const step = (by: number) => {
    snapNextChange();
    const keys = hc.causes.map((c) => c.key);
    const at = cause ? keys.indexOf(cause) : by > 0 ? -1 : keys.length;
    setCause(keys[Math.max(0, Math.min(keys.length - 1, at + by))] ?? null);
  };

  useKeyboardShortcuts({
    tourOpen: false,
    paletteOpen,
    onTogglePalette: () => setPaletteOpen((open) => !open),
    keys: {
      j: () => step(1),
      ArrowDown: () => step(1),
      k: () => step(-1),
      ArrowUp: () => step(-1),
      '/': () => searchRef.current?.focus(),
      // Esc lets go, one thing at a time: the search, then the cause.
      Escape: () => {
        snapNextChange();
        if (query) setQuery('');
        else setCause(null);
      },
      '[': () => setHideSide((hidden) => !hidden),
    },
  });

  const weeksWord = `${weeks} weeks`;
  const against = `vs previous ${weeksWord}`;
  const k = hc.kpis;
  const top = hc.causes[0];
  const confident = hc.patterns.filter((p) => p.confidence >= CONFIDENT).length;
  const scopeName = serviceId === 'all' ? 'across every service' : `for ${serviceName(serviceId)}`;
  // The headline figures count to their new values when the scope changes, with the charts.
  const count = (n: number, show: (v: number) => string) => <Counting numbers={{ n }} render={(v) => show(v.n)} />;

  const tiles: KpiTile[] = [
    { label: 'Tickets', value: count(k.tickets.value, (v) => num(Math.round(v))), change: change(k.tickets.value, k.tickets.previous), better: 'down', against, series: k.tickets.series },
    {
      label: 'Became incidents',
      value: (
        <Counting
          numbers={{ incidents: k.incidents.value, tickets: k.tickets.value }}
          render={(v) => (
            <>
              {num(Math.round(v.incidents))}
              <small>{pct(v.tickets ? v.incidents / v.tickets : 0)}</small>
            </>
          )}
        />
      ),
      change: change(k.incidents.value, k.incidents.previous),
      better: 'down',
      against,
      series: k.incidents.series,
    },
    { label: 'Median time to resolve', value: count(k.medianMins.value, span), change: change(k.medianMins.value, k.medianMins.previous), better: 'down', against, series: k.medianMins.series },
    { label: 'Repeat tickets', value: count(k.repeatShare.value, pct), note: 'Same CI and cause within 3 days', change: null },
    { label: 'Root cause found', value: count(k.foundShare.value, pct), note: 'Tickets with a cause on record', change: null },
  ];

  return (
    <div className="mn ol" data-hide-side={hideSide || undefined}>
      <Sidebar hidden={hideSide} page="hindcast" onOpenPalette={() => setPaletteOpen(true)} theme={theme} onToggleTheme={toggleTheme} />

      <section className="mn-detail ol-pane">
        <TopBar
          page="hindcast"
          serviceId={serviceId}
          onService={(id) => rescope({ serviceId: id })}
          weeks={weeks}
          onWeeks={(w) => rescope({ weeks: w })}
          cause={cause}
          onClearCause={() => setCause(null)}
          hideSide={hideSide}
          onToggleSide={() => setHideSide((hidden) => !hidden)}
          today={new Date(TODAY).toISOString()}
        />

        <div className="ol-scroll">
          <div className="ol-grid" data-view="hindcast" data-animate={motion ?? undefined}>
            <p className="ol-lead" data-area="lead">
              {cause ? (
                <>
                  <b>{CAUSE_LABEL[cause]}</b> caused <b>{num(k.tickets.value)}</b> {plural(k.tickets.value, 'ticket')} {scopeName} in the last {weeksWord}, and{' '}
                  <b>{num(k.incidents.value)}</b> of them became incidents. Median fix: <b>{span(k.medianMins.value)}</b>.
                </>
              ) : (
                <>
                  <b>{num(k.tickets.value)}</b> tickets {scopeName} in the last {weeksWord}, and <b>{num(k.incidents.value)}</b> became incidents.{' '}
                  {top && top.count > 0 && (
                    <>
                      <b>{top.label}</b> caused the most, {pct(top.share)}.{' '}
                    </>
                  )}
                  <b>{confident}</b> {plural(confident, 'pattern repeats', 'patterns repeat')} reliably enough to forecast.
                </>
              )}
            </p>

            <Kpis tiles={tiles} />

            <Panel
              area="volume"
              index={5}
              title="Tickets, week by week"
              meta={cause ? CAUSE_LABEL[cause] : undefined}
              actions={
                <ul className="ol-legend" aria-label="Key">
                  {OUTCOMES.map((o) => (
                    <li key={o}>
                      <i style={{ background: OUTCOME_TONE[o] }} />
                      {OUTCOME_LABEL[o]}
                    </li>
                  ))}
                </ul>
              }
              table={<VolumeTable weeks={hc.weeks} />}
            >
              <VolumeChart weeks={hc.weeks} />
            </Panel>

            <Panel area="causes" index={6} title="Root causes" meta="Pick one to narrow the page" actions={<span className="ol-keyhint"><kbd>J</kbd><kbd>K</kbd></span>}>
              <CauseList causes={hc.causes} selected={cause} onSelect={setCause} />
            </Panel>

            <Panel area="tickets" index={7} title="Tickets" meta={`${num(hc.tickets.length)} · newest first`}>
              <TicketList tickets={hc.tickets} query={query} onQuery={setQuery} searchRef={searchRef} />
            </Panel>

            <Panel area="patterns" index={8} title="What repeats" meta="These become the forecast">
              <PatternList ref={listRef} patterns={hc.patterns} flashId={flash} onForecast={toForecast} />
            </Panel>

            <Panel area="heat" index={9} title="When they arrive" meta="Weekday by hour">
              <Heatmap heat={hc.heat} max={hc.heatMax} />
            </Panel>
          </div>
        </div>

        <footer className="ol-keys" aria-label="Keyboard shortcuts">
          <span>
            <kbd>J</kbd>
            <kbd>K</kbd> Root cause
          </span>
          <span>
            <kbd>/</kbd> Search tickets
          </span>
          <span>
            <kbd>Esc</kbd> Clear
          </span>
          <span>
            <kbd>[</kbd> Sidebar
          </span>
          <span>
            <kbd>⌘K</kbd> Commands
          </span>
        </footer>
      </section>

      <AnalysisPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        page="hindcast"
        onService={(id) => {
          snapNextChange();
          rescope({ serviceId: id });
        }}
        onWeeks={(w) => {
          snapNextChange();
          rescope({ weeks: w });
        }}
        onCause={(c) => {
          snapNextChange();
          setCause(c);
        }}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}
