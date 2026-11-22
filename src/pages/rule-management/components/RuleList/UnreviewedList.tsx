/* The Unreviewed tab: overnight suggestions whose three refreshes passed with no decision. They
 * stay suggestions, not rules, so the proposed rules are only ever ones a person put forward.
 * P proposes one (it joins Proposed), X dismisses it, T tightens it, as in the overnight block. */

import type { Suggested } from '../../hooks/useSuggestions';
import { REFRESH_WINDOW } from '../../model/suggestions';
import { SuggestionRow } from './SuggestionRow';

export function UnreviewedList({
  items,
  leavingId,
  filtered,
  selectedId,
  onSelect,
  onClear,
}: {
  items: Suggested[];
  /** A suggestion just dealt with by pointer, still on screen for its exit. */
  leavingId?: string | null;
  /** A search or group filter is narrowing what shows. */
  filtered: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  if (items.length === 0) {
    return filtered ? (
      <div className="mn-empty">
        <div>No unreviewed suggestions match</div>
        <button className="mn-btn" onClick={onClear}>
          Clear filters
        </button>
      </div>
    ) : (
      <div className="mn-empty">
        <div>Nothing unreviewed</div>
        <div>Overnight suggestions nobody decides on within {REFRESH_WINDOW} refreshes wait here</div>
      </div>
    );
  }
  return items.map((item) => (
    <SuggestionRow
      key={item.suggestion.id}
      item={item}
      selected={item.suggestion.id === selectedId}
      leaving={item.suggestion.id === leavingId}
      showNight
      onSelect={onSelect}
    />
  ));
}
