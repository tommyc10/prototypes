/* One overnight suggestion as a row: in the overnight block under the night that found it, or in
 * the Unreviewed tab once its three refreshes have passed. The block's rows say when a later night
 * saw the pattern again; Unreviewed's say which night found it, since there is no night heading. */

import { Moon, Repeat } from 'lucide-react';
import { pct } from '../../../../lib/format';
import { groupById } from '../../data/mockData';
import type { Suggested } from '../../hooks/useSuggestions';
import { isLowConfidence } from '../../model/policy';
import { nightDate, seenAgainWords } from '../../model/suggestions';
import './SuggestionRow.css';

export function SuggestionRow({
  item: { suggestion, match, rule },
  selected,
  leaving,
  showNight,
  onSelect,
}: {
  item: Suggested;
  selected: boolean;
  /** Just proposed or dismissed with the pointer: on screen for its exit. */
  leaving: boolean;
  /** Say which night found it (Unreviewed), instead of when it was seen again (the block). */
  showNight?: boolean;
  onSelect: (id: string) => void;
}) {
  const real = match.real.length;
  const seen = seenAgainWords(suggestion);
  return (
    <div
      role="option"
      aria-selected={selected}
      className="mn-row mn-suggest-row"
      data-selected={selected || undefined}
      data-leaving={leaving || undefined}
      onClick={() => onSelect(suggestion.id)}
    >
      <span className="mn-dot" data-status="suggested" aria-label="Suggested" />
      <div className="mn-row-main">
        <div className="mn-row-name">{suggestion.name}</div>
        <div className="mn-row-meta">
          {real > 0 ? <span className="mn-bad">Hides {real} that needed a person</span> : <span>{groupById(suggestion.groupId).name}</span>}
          {/* The warning matters more: with one, the rest waits for the detail pane. */}
          {real === 0 && showNight ? (
            <span className="mn-suggest-row-note">
              <Moon size={12} aria-hidden="true" />
              Night of {nightDate(suggestion.nightStart)}
            </span>
          ) : (
            real === 0 &&
            seen && (
              <span className="mn-suggest-row-note">
                <Repeat size={12} aria-hidden="true" />
                Seen again {seen}
              </span>
            )
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
}
