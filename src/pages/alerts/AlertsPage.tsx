/* The alerts page: the stream of alerts as it arrives, and what the rules do to it.
 * This file owns the page's state and wires the pieces together:
 *
 *   Sidebar       navigation (shared with the other pages)
 *   AlertFeed     every alert up to the playhead, newest first: search and the outcome tabs
 *   StreamBar     live or rewound, the preview switch, pause
 *   Tally         the hour in four numbers
 *   Waterline     the chart: one dot per alert, seen above the line, hidden below it
 *   AlertTrace    the picked alert, and what happened to it
 *   RulesAtWork   the rules behind the stream
 *   AlertsPalette / Tour   on top when opened
 *
 * The state is small. `playhead` is where the stream is rewound to (null = live), `preview`
 * shows what the proposed rules would hide, and the rest is what the reader picked: an
 * alert, a tab, a search, a rule. Everything on the page is worked out from the last hour
 * of alerts and those few choices. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PaneToggles } from '../../components/PaneToggles';
import { Sidebar } from '../../components/Sidebar/Sidebar';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useTheme } from '../../hooks/useTheme';
import { num } from '../../lib/format';
import { navigate } from '../../lib/route';
import { ALERTS_TOUR } from '../../../tours/alerts';
import { Tour } from '../../../tours/Tour';
import { tourMode, useTour } from '../../../tours/useTour';
import { useRulesStore } from '../rule-management/hooks/useRulesStore';
import { AlertFeed } from './components/AlertFeed/AlertFeed';
import { AlertTrace } from './components/AlertTrace/AlertTrace';
import { AlertsPalette } from './components/Palette/AlertsPalette';
import { RulesAtWork } from './components/RulesAtWork/RulesAtWork';
import { StreamBar } from './components/StreamBar/StreamBar';
import { Tally } from './components/Tally/Tally';
import { Waterline } from './components/Waterline/Waterline';
import { MINUTE, WINDOW } from './data/mockData';
import { clock, useAlertStream } from './hooks/useAlertStream';
import { rulesAtWork, tally } from './model/stream';
import type { FeedFilter } from './model/types';
import './AlertsPage.css';

export function AlertsPage() {
  const rules = useRulesStore((s) => s.rules);
  const { now, alerts } = useAlertStream();
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [query, setQuery] = useState('');
  const [ruleId, setRuleId] = useState<string | null>(null);
  const [focusRuleId, setFocusRuleId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hideSide, setHideSide] = useState(false);
  const [hideList, setHideList] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const tour = useTour(ALERTS_TOUR.length, { auto: false, seenKey: 'mn-alerts-tour-seen' });

  const live = playhead === null;
  // The hour keeps sliding while the stream is rewound; a playhead that falls off its start comes with it.
  const cursor = live ? now : Math.max(playhead, now - WINDOW + MINUTE);

  // Everything up to the playhead: what the numbers, the feed and the rules list describe.
  const upTo = useMemo(() => alerts.filter((a) => a.at <= cursor), [alerts, cursor]);
  const counts = useMemo(() => tally(upTo), [upTo]);
  const atWork = useMemo(() => rulesAtWork(upTo), [upTo]);
  const proposed = rules.filter((r) => r.status === 'proposed').length;
  const scopedRule = rules.find((r) => r.id === ruleId) ?? null;

  // The feed: narrowed to a rule and the search first, so the tab counts describe what they found.
  const feed = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const found = upTo.filter((a) => {
      if (ruleId && a.ruleId !== ruleId) return false;
      const haystack = `${a.id} ${a.title} ${a.ci} ${a.source} ${a.ruleId ?? ''} ${a.rule?.name ?? ''}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
    const tabs: Record<FeedFilter, number> = { all: found.length, paged: 0, folded: 0, hidden: 0 };
    for (const a of found) tabs[a.outcome]++;
    const shown = (filter === 'all' ? found : found.filter((a) => a.outcome === filter)).reverse(); // newest first
    return { tabs, shown };
  }, [upTo, query, ruleId, filter]);

  // With nothing picked, follow the latest alert that reached a person: the one worth a look.
  const picked = upTo.find((a) => a.id === selectedId) ?? null;
  const latest = useMemo(() => [...upTo].reverse().find((a) => a.outcome === 'paged') ?? null, [upTo]);
  const shownAlert = picked ?? latest;

  // A picked alert that slides out of the hour is let go.
  useEffect(() => {
    if (selectedId && !alerts.some((a) => a.id === selectedId)) setSelectedId(null);
  }, [alerts, selectedId]);

  /** Move the selection up or down the feed. */
  const move = (step: number) => {
    const i = feed.shown.findIndex((a) => a.id === shownAlert?.id);
    const next = feed.shown[Math.min(feed.shown.length - 1, Math.max(0, i + step))];
    if (next) setSelectedId(next.id);
  };

  /** Rewind or advance the playhead by a minute. Stepping past now goes back to live. */
  const step = (minutes: number) => {
    const to = cursor + minutes * MINUTE;
    setPlayhead(to >= clock() ? null : Math.max(to, clock() - WINDOW + MINUTE));
  };

  const toggleLive = () => setPlayhead(live ? clock() : null);
  const togglePreview = () => proposed > 0 && setPreview((on) => !on);
  const openRule = (id: string) => navigate(`#/rules/${id}`);

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
      ArrowLeft: () => step(-1),
      ArrowRight: () => step(1),
      ' ': toggleLive,
      p: togglePreview,
      '/': () => searchRef.current?.focus(),
      // Esc lets go, one thing at a time: the picked alert, then the rule, then the rewind.
      Escape: () => (selectedId ? setSelectedId(null) : ruleId ? setRuleId(null) : setPlayhead(null)),
      '[': () => setHideSide((hidden) => !hidden),
      ']': () => setHideList((hidden) => !hidden),
      '?': startTour,
    },
  });

  return (
    <div className="mn al" inert={tour.open} data-hide-side={hideSide || undefined} data-hide-list={hideList || undefined}>
      <Sidebar
        hidden={hideSide}
        page="alerts"
        onOpenPalette={() => setPaletteOpen(true)}
        onStartTour={startTour}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <AlertFeed
        hidden={hideList}
        alerts={feed.shown}
        counts={feed.tabs}
        filter={filter}
        onFilter={setFilter}
        query={query}
        onQuery={setQuery}
        rule={scopedRule}
        onClearRule={() => setRuleId(null)}
        selectedId={shownAlert?.id ?? null}
        onSelect={setSelectedId}
        preview={preview}
        live={live}
        searchRef={searchRef}
      />

      <section className="mn-detail">
        <div className="al-scroll">
          <StreamBar
            toolbar={
              <PaneToggles
                hideSide={hideSide}
                hideList={hideList}
                onToggleSide={() => setHideSide((hidden) => !hidden)}
                onToggleList={() => setHideList((hidden) => !hidden)}
                listLabel="Alert list"
              />
            }
            clock={clock}
            playhead={live ? null : cursor}
            preview={preview}
            proposedCount={proposed}
            onPreview={togglePreview}
            onLive={() => setPlayhead(null)}
            onPause={() => setPlayhead(clock())}
          />

          <div className="al-page">
            <Tally counts={counts} rewound={!live} />

            <Waterline
              alerts={alerts}
              counts={counts}
              clock={clock}
              playhead={live ? null : cursor}
              preview={preview}
              selectedId={shownAlert?.id ?? null}
              focusRuleId={focusRuleId ?? ruleId}
              theme={theme}
              onSelect={setSelectedId}
              onScrub={setPlayhead}
            />

            {/* Always here, so switching the preview changes its words and not the page's layout. */}
            <p className="al-verdict" data-tone={preview && counts.wouldHidePaged > 0 ? 'bad' : undefined} aria-live="polite">
              {!preview ? (
                <>
                  Every dot is one alert. The ones above the line were seen by a person; the ones below were hidden by a rule. Press{' '}
                  <kbd>P</kbd> to see what the {proposed} proposed {proposed === 1 ? 'rule' : 'rules'} would add to that, and drag across the
                  chart to rewind.
                </>
              ) : counts.wouldHide === 0 ? (
                <>The proposed rules fit nothing in this stretch.</>
              ) : (
                <>
                  <strong>
                    With the proposed rules on, {num(counts.wouldHide)} more {counts.wouldHide === 1 ? 'alert' : 'alerts'} would be hidden.
                  </strong>{' '}
                  {counts.wouldHidePaged > 0 ? (
                    <>
                      {num(counts.wouldHidePaged)} of them opened an incident: those are pages that would stop arriving. They're the red
                      rings.
                    </>
                  ) : (
                    <>None of them opened an incident.</>
                  )}
                </>
              )}
            </p>

            <div className="al-below">
              <AlertTrace
                alert={shownAlert}
                following={!picked}
                activeRules={rules.filter((r) => r.status === 'active').length}
                onOpenRule={openRule}
              />
              <RulesAtWork
                rows={atWork}
                selectedId={ruleId}
                onFocus={setFocusRuleId}
                onSelect={(id) => setRuleId(id === ruleId ? null : id)}
                onOpenRule={openRule}
              />
            </div>
          </div>
        </div>
      </section>

      <AlertsPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        live={live}
        preview={preview}
        onToggleLive={toggleLive}
        onTogglePreview={togglePreview}
        onFilter={setFilter}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        onStartTour={startTour}
      />

      {/* Rendered into <body>, outside the page, which is inert while the tour shows. */}
      {tour.open &&
        createPortal(
          <Tour steps={ALERTS_TOUR} index={tour.index} onIndex={tour.go} onDone={tour.finish} lite={tourMode()} />,
          document.body,
        )}
    </div>
  );
}
