/* The Services page: who the top talkers are. Every service ranked by the tickets it raised,
 * the incidents among them, or the rules written for it, over the last 4, 12 or 26 weeks; the
 * picked one in full in the pane. It owns almost no data of its own: the counts are the
 * hindcast's tickets and the Rules page's rules (model/talkers.ts), so all three pages agree.
 *
 *   Sidebar          navigation (shared with the other pages)
 *   ServiceList      the ranking, and its two mode controls
 *   ServiceDetail    the picked service, and the way into the Hindcast and the Rules page
 *   ServicesPalette  on top when opened
 *
 * The picked service is in the address (#/services/holonet), so it can be linked to. */

import { useEffect, useMemo, useState } from 'react';
import { PaneToggles } from '../../components/PaneToggles';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';
import { num } from '../../lib/format';
import { navigate } from '../../lib/route';
import { ServicesPalette } from './components/Palette/ServicesPalette';
import { ServiceDetail } from './components/ServiceDetail/ServiceDetail';
import { ServiceList } from './components/ServiceList/ServiceList';
import { useTalkers } from './hooks/useTalkers';
import { DEFAULT_LOOKBACK, hrefs, nextMeasure, ranked, valueOf, words } from './model/talkers';
import type { Lookback, Measure } from './model/types';
import './ServicesPage.css';

export function ServicesPage({ initialId }: { /** Open on this service (a link from another page). */ initialId?: string }) {
  const [measure, setMeasure] = useState<Measure>('tickets');
  const [weeks, setWeeks] = useState<Lookback>(DEFAULT_LOOKBACK);
  const list = useTalkers(weeks);
  const order = useMemo(() => ranked(list, measure), [list, measure]);
  const [picked, setPicked] = useState(() => (list.some((t) => t.id === initialId) ? initialId! : order[0]!.id));
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [hideList, setHideList] = useState(false);
  const [theme, toggleTheme] = useTheme();

  // Keep the address in step, without adding a Back step for every pick.
  useEffect(() => {
    navigate(hrefs.service(picked), true);
  }, [picked]);

  const at = order.findIndex((t) => t.id === picked);
  const t = order[at]!;
  const step = (by: number) => setPicked(order[Math.max(0, Math.min(order.length - 1, at + by))]!.id);

  useKeyboardShortcuts({
    tourOpen: false,
    paletteOpen,
    onTogglePalette: () => setPaletteOpen((open) => !open),
    keys: {
      j: () => step(1),
      ArrowDown: () => step(1),
      k: () => step(-1),
      ArrowUp: () => step(-1),
      s: () => setMeasure(nextMeasure),
      h: () => navigate(hrefs.hindcast(t.id, weeks)),
      r: () => navigate(hrefs.rules(t.id)),
      '[': () => setHideSide((hidden) => !hidden),
      ']': () => setHideList((hidden) => !hidden),
    },
  });

  const value = valueOf(t, measure);

  return (
    <div className="mn sv" data-hide-side={hideSide || undefined} data-hide-list={hideList || undefined}>
      <Sidebar hidden={hideSide} page="services" onOpenPalette={() => setPaletteOpen(true)} theme={theme} onToggleTheme={toggleTheme} />

      <aside className="mn-list" inert={hideList}>
        <ServiceList order={order} picked={picked} measure={measure} weeks={weeks} onPick={setPicked} onMeasure={setMeasure} onWeeks={setWeeks} />
      </aside>

      <section className="mn-detail sv-pane">
        <div className="sv-top">
          <PaneToggles hideSide={hideSide} hideList={hideList} onToggleSide={() => setHideSide((hidden) => !hidden)} onToggleList={() => setHideList((hidden) => !hidden)} listLabel="Service list" />
        </div>
        <div className="sv-scroll">
          <ServiceDetail key={t.id} t={t} rank={at + 1} of={order.length} measure={measure} weeks={weeks} />
        </div>
        <p className="mn-sr" aria-live="polite">
          {t.name}, {at + 1} of {order.length}: {num(value)} {words(value, measure)}
        </p>
      </section>

      <ServicesPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        services={order}
        measure={measure}
        onPick={setPicked}
        onMeasure={setMeasure}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}
