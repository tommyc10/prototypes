/* The forecast: what the next few weeks should hold, on one screen. This file owns the page's
 * state and wires the pieces together:
 *
 *   Sidebar          navigation (shared with the other pages)
 *   TopBar           the page's name, and its scope: service, lookback and horizon
 *   the grid         headline figures, tickets a week with the forecast and its range, where
 *                    they should land, the days ahead, the predictions, and causes before and after
 *   AnalysisPalette  on top when opened
 *
 * It's built from the hindcast (src/pages/hindcast): the same tickets, and the patterns the
 * hindcast finds, projected forward as predictions with the same evidence. A prediction links
 * back to its pattern there, and a pattern links here, ringing its prediction.
 *
 * Scope lives in the address (#/forecast/holonet/26/8) and is shared with the hindcast for the
 * session. Every figure is read from model/forecast.ts. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';
import { num, pct } from '../../lib/format';
import { navigate } from '../../lib/route';
import { Counting, Kpis, type KpiTile } from '../hindcast/components/Kpis/Kpis';
import { AnalysisPalette } from '../hindcast/components/Palette/AnalysisPalette';
import { Panel } from '../hindcast/components/Panel/Panel';
import { TopBar } from '../hindcast/components/TopBar/TopBar';
import { TICKETS, serviceName } from '../hindcast/data/mockData';
import { useEntrance } from '../hindcast/hooks/useEntrance';
import { snapNextChange } from '../hindcast/hooks/useTween';
import { asPattern, useScope } from '../hindcast/hooks/useScope';
import { DEFAULT_HORIZON, DEFAULT_LOOKBACK, TODAY, change, dayMonth, plural, weekdayDate } from '../hindcast/model/labels';
import { CauseOutlook, CauseOutlookTable } from './components/charts/CauseOutlook';
import { ForecastChart, ForecastLegend, ForecastTable } from './components/charts/ForecastChart';
import { PredictionList } from './components/PredictionList/PredictionList';
import { RiskCalendar } from './components/RiskCalendar/RiskCalendar';
import { ServiceRisk, ServiceRiskTable } from './components/ServiceRisk/ServiceRisk';
import { forecast as runForecast } from './model/forecast';
import '../hindcast/components/charts/charts.css';
import './components/charts/charts.css';
import '../hindcast/layout.css';

/** A pattern's prediction id: PAT-04 → PRD-04. */
const predictionOf = (patternId: string) => `PRD-${patternId.slice(4)}`;

export function ForecastPage({
  serviceId: serviceFromAddress,
  weeks: weeksFromAddress,
  horizon: horizonFromAddress,
  focus,
}: {
  serviceId?: string;
  weeks?: string;
  horizon?: string;
  focus?: string;
}) {
  const [{ serviceId, weeks, horizon }, setScope] = useScope({ serviceId: serviceFromAddress, weeks: weeksFromAddress, horizon: horizonFromAddress });
  const arrivedOn = asPattern(focus);
  const [lit, setLit] = useState<string | null>(arrivedOn && predictionOf(arrivedOn));
  const [flash, setFlash] = useState<string | null>(arrivedOn);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const listRef = useRef<HTMLDivElement>(null);

  const fc = useMemo(() => runForecast(TICKETS, { serviceId, weeks, horizon }), [serviceId, weeks, horizon]);
  // Arriving from a pattern, the reader is mid-task: no story, just the page and its ring.
  const motion = useEntrance(!arrivedOn);

  // Keep the address in step, without adding a Back step for every change.
  useEffect(() => {
    const scoped = serviceId !== 'all' || weeks !== DEFAULT_LOOKBACK || horizon !== DEFAULT_HORIZON;
    navigate(`#/forecast${scoped ? `/${serviceId}/${weeks}/${horizon}` : ''}`, true);
  }, [serviceId, weeks, horizon]);

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

  /** Open a prediction's pattern, and its evidence, on the hindcast page. */
  const toHindcast = (patternId: string) => navigate(`#/hindcast/${serviceId}/${weeks}/${patternId}`);

  const step = (by: number) => {
    const ids = fc.predictions.map((p) => p.id);
    const at = lit ? ids.indexOf(lit) : by > 0 ? -1 : ids.length;
    const next = ids[Math.max(0, Math.min(ids.length - 1, at + by))] ?? null;
    setLit(next);
    if (next) listRef.current?.querySelector<HTMLElement>(`[data-pattern="PAT-${next.slice(4)}"]`)?.scrollIntoView({ block: 'nearest' });
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
      Escape: () => setLit(null),
      '[': () => setHideSide((hidden) => !hidden),
    },
  });

  const weeksWord = `${weeks} weeks`;
  const t = fc.totals;
  const moved = change(t.expected, t.previous);
  const scopeName = serviceId === 'all' ? 'across every service' : `for ${serviceName(serviceId)}`;
  // The headline figures count to their new values when the scope changes, with the charts.
  const due = fc.predictions.reduce((n, p) => n + p.dates.length, 0);
  const round = (v: number) => num(Math.round(v));
  const count = (n: number, show: (v: number) => string) => <Counting numbers={{ n }} render={(v) => show(v.n)} />;

  const tiles: KpiTile[] = [
    {
      label: `Tickets, next ${horizon} weeks`,
      value: (
        <Counting
          numbers={{ expected: t.expected, low: t.low, high: t.high }}
          render={(v) => (
            <>
              {round(v.expected)}
              <small>
                {round(v.low)}–{round(v.high)}
              </small>
            </>
          )}
        />
      ),
      change: moved,
      better: 'down',
      against: `vs last ${horizon} weeks`,
      series: [...fc.history.slice(-8).map((p) => p.actual), ...fc.ahead.map((a) => a.expected)],
      split: Math.min(8, fc.history.length),
    },
    { label: 'Expected incidents', value: count(t.incidents, round), change: change(t.incidents, t.previousIncidents), better: 'down', against: `vs last ${horizon} weeks` },
    {
      label: 'Predictions due',
      value: count(due, round),
      note: `From ${fc.predictions.length} ${plural(fc.predictions.length, 'pattern')} in the hindcast`,
    },
    { label: 'Busiest day', value: weekdayDate(fc.peak.date), note: `About ${num(fc.peak.expected)} tickets expected` },
    { label: 'Forecast accuracy', value: count(fc.accuracy, pct), note: 'A week ahead, last 8 weeks' },
  ];

  return (
    <div className="mn ol" data-hide-side={hideSide || undefined}>
      <Sidebar hidden={hideSide} page="forecast" onOpenPalette={() => setPaletteOpen(true)} theme={theme} onToggleTheme={toggleTheme} />

      <section className="mn-detail ol-pane">
        <TopBar
          page="forecast"
          serviceId={serviceId}
          onService={(id) => rescope({ serviceId: id })}
          weeks={weeks}
          onWeeks={(w) => rescope({ weeks: w })}
          horizon={horizon}
          onHorizon={(h) => rescope({ horizon: h })}
          hideSide={hideSide}
          onToggleSide={() => setHideSide((hidden) => !hidden)}
          today={new Date(TODAY).toISOString()}
        />

        <div className="ol-scroll">
          <div className="ol-grid" data-view="forecast" data-animate={motion ?? undefined}>
            <p className="ol-lead" data-area="lead">
              Expect about <b>{num(t.expected)}</b> tickets {scopeName} in the next {horizon} weeks, likely between {num(t.low)} and {num(t.high)}
              {moved !== null && (
                <>
                  : <b>{pct(Math.abs(moved))} {moved >= 0 ? 'more' : 'fewer'}</b> than the {horizon} just gone
                </>
              )}
              . <b>{fc.predictions.length}</b> {plural(fc.predictions.length, 'pattern')} from the hindcast {plural(fc.predictions.length, 'is', 'are')} due
              {fc.predictions[0] && (
                <>
                  , the first {fc.predictions[0].next === fc.days[0].date ? <b>today</b> : <>on <b>{weekdayDate(fc.predictions[0].next)}</b></>}
                </>
              )}
              .
            </p>

            <Kpis tiles={tiles} />

            <Panel area="outlook" index={5} title="Tickets a week" meta={`Learnt from the last ${weeksWord}`} actions={<ForecastLegend />} table={<ForecastTable history={fc.history} ahead={fc.ahead} />}>
              <ForecastChart history={fc.history} ahead={fc.ahead} />
            </Panel>

            <Panel area="services" index={6} title="Where they’ll land" meta={`Next ${horizon} weeks, likely range`} table={<ServiceRiskTable services={fc.services} />}>
              <ServiceRisk services={fc.services} scoped={serviceId} onScope={(id) => rescope({ serviceId: id })} />
            </Panel>

            <Panel area="calendar" index={7} title="The days ahead" meta={`${dayMonth(fc.days[0].date)} to ${dayMonth(fc.days[fc.days.length - 1].date)}`}>
              <RiskCalendar days={fc.days} predictions={fc.predictions} lit={lit} onLight={setLit} />
            </Panel>

            <Panel area="predictions" index={8} title="Predictions" meta="From the hindcast’s patterns" actions={<span className="ol-keyhint"><kbd>J</kbd><kbd>K</kbd></span>}>
              <PredictionList ref={listRef} predictions={fc.predictions} flashId={flash} lit={lit} onLight={setLit} onHindcast={toHindcast} />
            </Panel>

            <Panel area="next-causes" index={9} title="Causes ahead" meta={`Last vs next ${horizon} weeks`} table={<CauseOutlookTable causes={fc.causes} horizon={horizon} />}>
              <CauseOutlook causes={fc.causes} />
            </Panel>
          </div>
        </div>

        <footer className="ol-keys" aria-label="Keyboard shortcuts">
          <span>
            <kbd>J</kbd>
            <kbd>K</kbd> Prediction
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
        page="forecast"
        onService={(id) => {
          snapNextChange();
          rescope({ serviceId: id });
        }}
        onWeeks={(w) => {
          snapNextChange();
          rescope({ weeks: w });
        }}
        onHorizon={(h) => {
          snapNextChange();
          rescope({ horizon: h });
        }}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}
