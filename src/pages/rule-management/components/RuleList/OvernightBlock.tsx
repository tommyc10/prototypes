/* What the last three refreshes found, pinned above the rules: one row per pattern no rule covers
 * yet, under the night that found it, newest first. A pattern nobody decides on moves to the
 * rules at its fourth refresh; three pips on each night show how far along it is. The refresh's
 * own health (when it ran, whether a run failed) is kept apart from what it found: in the
 * heading, and on the first line inside. Until someone opens it after a refresh, a grey glow
 * breathes slowly inside its edge (the Border beam package, pulse-inner, mono: it waits on a
 * decision, so it breathes rather than travels). Once it has been looked at, it goes still until
 * the next refresh lands. The block goes away once every suggestion is proposed or dismissed. */

import { useEffect, useState } from 'react';
import { BorderBeam } from 'border-beam';
import { AlertTriangle, ChevronDown, Repeat } from 'lucide-react';
import type { Theme } from '../../../../hooks/useTheme';
import { pct } from '../../../../lib/format';
import { groupById } from '../../data/mockData';
import type { RefreshNight } from '../../data/overnightData';
import type { Suggested } from '../../hooks/useSuggestions';

/* On a light card the package's mono greys are pushed towards white by its default glow
 * brightness (1.3) and disappear. Turned down and a little wider, they read as a soft grey
 * glow, as quiet as mono is on dark. (Both are the package's own props, tuned by eye.) */
const LIGHT_TUNING = { brightness: 0.45, glowSize: 1.4 };

/** One breath, in seconds. The package's 2.3 is a pulse; on a dashboard open all shift it reads as
 * fidgeting. This is closer to someone breathing. */
const BREATH = 4.5;
import { isLowConfidence } from '../../model/policy';
import { REFRESH_WINDOW, nightTime, seenAgainWords, type RefreshRun } from '../../model/suggestions';
import './OvernightBlock.css';

export function OvernightBlock({
  items,
  nights,
  runs,
  collapsed,
  leaving,
  leavingId,
  onToggle,
  selectedId,
  onSelect,
  theme,
}: {
  items: Suggested[];
  /** The nights it has room for, newest first: the last three refreshes that succeeded. */
  nights: RefreshNight[];
  /** This morning's runs, in order. The last one says whether the refresh is healthy. */
  runs: RefreshRun[];
  collapsed: boolean;
  /** Its last suggestion has just been dealt with: it is fading out, and no longer takes clicks. */
  leaving?: boolean;
  /** A suggestion just dealt with by pointer, still on screen for its exit. */
  leavingId?: string | null;
  onToggle: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** The beam is tuned for the surface it sits on. */
  theme: Theme;
}) {
  const latest = runs[runs.length - 1];
  const failed = runs.filter((run) => !run.ok);
  // The refresh someone last opened the block after. A newer one makes it breathe again.
  const [lookedAt, setLookedAt] = useState<string | null>(null);
  useEffect(() => {
    if (!collapsed) setLookedAt(latest.at);
  }, [collapsed, latest.at]);
  const breathing = !leaving && lookedAt !== latest.at;

  // What makes it worth opening now, for the heading when it's folded away.
  const open = items.filter((item) => item.suggestion.id !== leavingId);
  const risky = open.filter((item) => item.match.real.length > 0).length;
  const due = open.filter((item) => item.suggestion.daysAgo === REFRESH_WINDOW - 1).length;
  // The heading has room for a few characters, so the sentence goes in the tooltip and to screen readers.
  const urgent =
    risky > 0
      ? { bad: true, short: String(risky), long: `${risky} ${risky === 1 ? 'hides incidents' : 'hide incidents'} that needed a person` }
      : due > 0
        ? { bad: false, short: `· ${due} due`, long: `${due} ${due === 1 ? 'moves' : 'move'} to the rules at the next refresh` }
        : null;
  return (
    // The beam's wrapper is the block's outer box: it takes the block's place in the list and its
    // exit, so the glow fades out with it. Its corner radius is read from the card inside.
    <BorderBeam
      size="pulse-inner"
      colorVariant="mono"
      theme={theme}
      {...(theme === 'light' ? LIGHT_TUNING : {})}
      duration={BREATH}
      active={breathing}
      className="mn-overnight-beam"
      data-leaving={leaving || undefined}
      data-tour="overnight"
    >
    <div className="mn-overnight" data-collapsed={collapsed || undefined} inert={leaving}>
      <button className="mn-overnight-head" aria-expanded={!collapsed} onClick={onToggle}>
        <ChevronDown size={13} />
        <span className="mn-overnight-title">
          Found overnight <b>{open.length}</b>
        </span>
        {collapsed && urgent && (
          <span className="mn-overnight-urgent" data-bad={urgent.bad || undefined} title={urgent.long} aria-label={urgent.long}>
            {urgent.bad && <AlertTriangle size={12} aria-hidden="true" />}
            <span aria-hidden="true">{urgent.short}</span>
          </span>
        )}
        <span className="mn-overnight-sum" data-failed={!latest.ok || undefined}>
          {latest.ok ? `Refreshed ${nightTime(latest.at)}` : `Refresh failed ${nightTime(latest.at)}`}
        </span>
        <kbd>O</kbd>
      </button>

      {!collapsed && (
        <div className="mn-overnight-status" title={failed.map((run) => `${nightTime(run.at)}: ${run.note}`).join('\n') || undefined}>
          {latest.ok ? (
            <span>
              {nights[0].total} incidents read
              {failed.length > 0 && `, after ${failed.length === 1 ? 'one failed run' : `${failed.length} failed runs`}`}
            </span>
          ) : (
            <span className="mn-overnight-status-warn">{latest.note}. Nothing has aged; these are the last {REFRESH_WINDOW} refreshes that ran.</span>
          )}
        </div>
      )}

      {!collapsed &&
        nights.map((night) => {
          const here = items.filter((item) => item.suggestion.daysAgo === night.daysAgo);
          const inPatterns = here.reduce((n, item) => n + item.match.matched.length, 0);
          const last = night.daysAgo === REFRESH_WINDOW - 1;
          return (
            <section key={night.daysAgo} className="mn-overnight-night" aria-label={night.label}>
              <div className="mn-overnight-night-head">
                <span className="mn-overnight-night-name">{night.label}</span>
                {night.daysAgo > 0 && <span>{night.date}</span>}
                {here.length === 0 ? (
                  <span className="mn-overnight-night-note">{night.found === 0 ? 'Ran, nothing new' : 'All decided'}</span>
                ) : last ? (
                  <span className="mn-overnight-night-note" data-last>
                    Moves to rules at next refresh
                  </span>
                ) : (
                  <span className="mn-overnight-night-note">
                    {inPatterns} of {night.total} inc
                  </span>
                )}
                <Age refresh={night.daysAgo + 1} />
              </div>
              {here.map(({ suggestion, match, rule }) => {
                const real = match.real.length;
                const seen = seenAgainWords(suggestion);
                return (
                  <div
                    key={suggestion.id}
                    role="option"
                    aria-selected={suggestion.id === selectedId}
                    className="mn-row"
                    data-selected={suggestion.id === selectedId || undefined}
                    data-leaving={suggestion.id === leavingId || undefined}
                    onClick={() => onSelect(suggestion.id)}
                  >
                    <span className="mn-dot" data-status="suggested" aria-label="Suggested" />
                    <div className="mn-row-main">
                      <div className="mn-row-name">{suggestion.name}</div>
                      <div className="mn-row-meta">
                        {real > 0 ? <span className="mn-bad">Hides {real} that needed a person</span> : <span>{groupById(suggestion.groupId).name}</span>}
                        {/* The warning matters more: with one, the re-sighting waits for the detail pane. */}
                        {seen && real === 0 && (
                          <span className="mn-overnight-seen">
                            <Repeat size={12} aria-hidden="true" />
                            Seen again {seen}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mn-row-side">
                      <span className="mn-row-conf" data-low={isLowConfidence(rule) || undefined}>
                        {pct(suggestion.confidence)}
                      </span>
                      <span className="mn-subtle">{match.matched.length} inc</span>
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}
    </div>
    </BorderBeam>
  );
}

/** How many of its refreshes a night has used: one pip each, all three on the night that moves next. */
function Age({ refresh }: { refresh: number }) {
  return (
    <span
      className="mn-overnight-age"
      role="img"
      aria-label={`Refresh ${refresh} of ${REFRESH_WINDOW}`}
      title={`Refresh ${refresh} of ${REFRESH_WINDOW}`}
      data-full={refresh >= REFRESH_WINDOW || undefined}
    >
      {Array.from({ length: REFRESH_WINDOW }, (_, i) => (
        <i key={i} data-on={i < refresh || undefined} />
      ))}
    </span>
  );
}
