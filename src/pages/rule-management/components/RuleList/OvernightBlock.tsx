/* What the last three refreshes found, pinned above the rules: one row per pattern no rule covers
 * yet, under the night that found it, newest first. A pattern nobody decides on moves to the
 * rules at its fourth refresh. While it's there, a grey glow breathes inside its edge (the Border beam
 * package, pulse-inner, mono: it waits on a decision, so it breathes rather than travels),
 * and the block goes away once every suggestion is proposed or dismissed. */

import { BorderBeam } from 'border-beam';
import { ChevronDown } from 'lucide-react';
import type { Theme } from '../../../../hooks/useTheme';
import { pct } from '../../../../lib/format';
import { groupById } from '../../data/mockData';
import type { RefreshNight } from '../../data/overnightData';
import type { Suggested } from '../../hooks/useSuggestions';

/* On a light card the package's mono greys are pushed towards white by its default glow
 * brightness (1.3) and disappear. Turned down and a little wider, they read as a soft grey
 * glow, as quiet as mono is on dark. (Both are the package's own props, tuned by eye.) */
const LIGHT_TUNING = { brightness: 0.45, glowSize: 1.4 };
import { isLowConfidence } from '../../model/policy';
import { REFRESH_WINDOW } from '../../model/suggestions';
import './OvernightBlock.css';

export function OvernightBlock({
  items,
  nights,
  collapsed,
  leaving,
  onToggle,
  selectedId,
  onSelect,
  theme,
}: {
  items: Suggested[];
  /** The nights it has room for, newest first. */
  nights: RefreshNight[];
  collapsed: boolean;
  /** Its last suggestion has just been dealt with: it is fading out, and no longer takes clicks. */
  leaving?: boolean;
  onToggle: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** The beam is tuned for the surface it sits on. */
  theme: Theme;
}) {
  return (
    // The beam's wrapper is the block's outer box: it takes the block's place in the list and its
    // exit, so the glow fades out with it. Its corner radius is read from the card inside.
    <BorderBeam
      size="pulse-inner"
      colorVariant="mono"
      theme={theme}
      {...(theme === 'light' ? LIGHT_TUNING : {})}
      active={!leaving}
      className="mn-overnight-beam"
      data-leaving={leaving || undefined}
      data-tour="overnight"
    >
    <div className="mn-overnight" data-collapsed={collapsed || undefined} inert={leaving}>
      <button className="mn-overnight-head" aria-expanded={!collapsed} onClick={onToggle}>
        <ChevronDown size={13} />
        <span className="mn-overnight-title">
          Found overnight <b>{items.length}</b>
        </span>
        <span className="mn-overnight-sum">Last {REFRESH_WINDOW} nights</span>
        <kbd>O</kbd>
      </button>

      {!collapsed &&
        nights.map((night) => {
          const here = items.filter((item) => item.suggestion.daysAgo === night.daysAgo);
          const inPatterns = here.reduce((n, item) => n + item.match.matched.length, 0);
          return (
            <section key={night.daysAgo} className="mn-overnight-night" aria-label={night.label}>
              <div className="mn-overnight-night-head">
                <span className="mn-overnight-night-name">{night.label}</span>
                {night.daysAgo > 0 && <span>{night.date}</span>}
                {here.length === 0 ? (
                  <span className="mn-overnight-night-note">Nothing waiting</span>
                ) : night.daysAgo === REFRESH_WINDOW - 1 ? (
                  <span className="mn-overnight-night-note" data-last>
                    Moves to rules tomorrow
                  </span>
                ) : (
                  <span className="mn-overnight-night-note">
                    {inPatterns} of {night.total} inc
                  </span>
                )}
              </div>
              {here.map(({ suggestion, match, rule }) => {
                const real = match.real.length;
                return (
                  <div
                    key={suggestion.id}
                    role="option"
                    aria-selected={suggestion.id === selectedId}
                    className="mn-row"
                    data-selected={suggestion.id === selectedId || undefined}
                    onClick={() => onSelect(suggestion.id)}
                  >
                    <span className="mn-dot" data-status="suggested" aria-label="Suggested" />
                    <div className="mn-row-main">
                      <div className="mn-row-name">{suggestion.name}</div>
                      <div className="mn-row-meta">
                        {real > 0 ? <span className="mn-bad">Hides {real} that needed a person</span> : <span>{groupById(suggestion.groupId).name}</span>}
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
