/* The hindcast page. This file owns the page's state and wires the pieces together:
 *
 *   Sidebar       navigation (shared with the other pages)
 *   ServiceList   every service, the noisiest first: the service filter and the per-service breakdown
 *   ReportBar     the chapters and the lookback, stuck to the top of the report
 *   the report    five chapters, in reading order: Verdict, Sources, CaughtBy, TuneNext, Method
 *   HindcastPalette / Tour   on top when opened
 *
 * The state is small: which service, how many completed weeks. Both live in the address
 * (#/hindcast/holonet/12), so a hindcast can be linked to. Everything on the page is read
 * from one HindcastReport for that scope (see model/types.ts). */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PaneToggles } from '../../components/PaneToggles';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';
import { navigate } from '../../lib/route';
import { HINDCAST_TOUR } from '../../../tours/hindcast';
import { Tour } from '../../../tours/Tour';
import { tourMode, useTour } from '../../../tours/useTour';
import { CaughtBy } from './components/CaughtBy/CaughtBy';
import { Method } from './components/Method/Method';
import { HindcastPalette } from './components/Palette/HindcastPalette';
import { ReportBar } from './components/ReportBar/ReportBar';
import { ServiceList } from './components/ServiceList/ServiceList';
import { Sources } from './components/Sources/Sources';
import { TuneNext } from './components/TuneNext/TuneNext';
import { Verdict } from './components/Verdict/Verdict';
import { isService } from './data/mockData';
import { useChapters } from './hooks/useChapters';
import { useHindcast } from './hooks/useHindcast';
import { CHAPTERS, DEFAULT_LOOKBACK, LOOKBACKS } from './model/labels';
import type { Lookback } from './model/types';
import './components/charts/charts.css';
import './HindcastPage.css';

export function HindcastPage({ serviceId: fromAddress, weeks: weeksFromAddress }: { serviceId?: string; weeks?: string }) {
  const [serviceId, setServiceId] = useState(isService(fromAddress) ? fromAddress! : 'all');
  const [weeks, setWeeks] = useState<Lookback>(LOOKBACKS.find((w) => String(w) === weeksFromAddress) ?? DEFAULT_LOOKBACK);
  const [query, setQuery] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [hideList, setHideList] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tour = useTour(HINDCAST_TOUR.length, { auto: false, seenKey: 'mn-hindcast-tour-seen' });

  const report = useHindcast(serviceId, weeks);
  const chapters = useChapters(scrollRef);

  // Keep the address in step, without adding a Back step for every J and K.
  useEffect(() => {
    navigate(`#/hindcast${serviceId === 'all' && weeks === DEFAULT_LOOKBACK ? '' : `/${serviceId}/${weeks}`}`, true);
  }, [serviceId, weeks]);

  // A different service is a different report: start it from the top.
  const selectService = (id: string) => {
    setServiceId(id);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  // Match on the service's name and unit, so "death star" finds every service in that unit.
  const q = query.trim().toLowerCase();
  const shown = report.services.filter((s) => `${s.name} ${s.unit}`.toLowerCase().includes(q));

  /** Move the selection up or down the list. "All services" is the row above the first service. */
  const move = (step: number) => {
    // A service nobody cancelled a ticket for has no report, so J and K step over it.
    const ids = [...(q ? [] : ['all']), ...shown.filter((s) => s.cancelled > 0).map((s) => s.id)];
    const next = ids[Math.min(ids.length - 1, Math.max(0, ids.indexOf(serviceId) + step))];
    if (next && next !== serviceId) selectService(next);
  };

  const startTour = () => {
    setHideSide(false);
    setHideList(false);
    setPaletteOpen(false);
    setQuery('');
    scrollRef.current?.scrollTo({ top: 0 });
    tour.start();
  };

  const openRule = (ruleId: string) => navigate(`#/rules/${ruleId}`);

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
      ...Object.fromEntries(CHAPTERS.map((chapter, i) => [String(i + 1), () => chapters.jump(chapter.id, 'key')])),
    },
  });

  return (
    <div className="mn hc" inert={tour.open} data-hide-side={hideSide || undefined} data-hide-list={hideList || undefined}>
      <Sidebar
        hidden={hideSide}
        page="hindcast"
        onOpenPalette={() => setPaletteOpen(true)}
        onStartTour={startTour}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <ServiceList
        hidden={hideList}
        report={report}
        shown={shown}
        query={query}
        onQuery={setQuery}
        selectedId={serviceId}
        onSelect={selectService}
        searchRef={searchRef}
      />

      <section className="mn-detail">
        <div className="hc-scroll" ref={scrollRef}>
          <ReportBar
            toolbar={
              <PaneToggles
                hideSide={hideSide}
                hideList={hideList}
                onToggleSide={() => setHideSide((hidden) => !hidden)}
                onToggleList={() => setHideList((hidden) => !hidden)}
                listLabel="Service list"
              />
            }
            active={chapters.active}
            scrolled={chapters.scrolled}
            onJump={(id) => chapters.jump(id, 'pointer')}
            weeks={weeks}
            onWeeks={setWeeks}
          />
          <article className="hc-report" aria-label={`Hindcast: ${report.title}`}>
            <Verdict report={report} />
            <Sources report={report} onSelectService={selectService} />
            <CaughtBy report={report} onOpenRule={openRule} />
            <TuneNext report={report} onOpenRule={openRule} />
            <Method report={report} />
          </article>
        </div>
      </section>

      <HindcastPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        services={report.services.filter((s) => s.cancelled > 0)}
        onService={selectService}
        onWeeks={setWeeks}
        onChapter={(id) => chapters.jump(id, 'key')}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        onStartTour={startTour}
      />

      {/* Rendered into <body>, outside the page, which is inert while the tour shows. */}
      {tour.open &&
        createPortal(
          <Tour steps={HINDCAST_TOUR} index={tour.index} onIndex={tour.go} onDone={tour.finish} lite={tourMode()} />,
          document.body,
        )}
    </div>
  );
}
