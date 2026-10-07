/* The sidebar's shortcuts to the groups you pinned. The full list of groups is the picker
 * beside the page title (GroupPicker); the sidebar only holds the few you chose. */

import { groupCounts, type GroupBy, type ViewState } from '../../model/browse';
import type { Pin } from '../../hooks/usePinnedGroups';
import type { Rule } from '../../model/types';
import './PinnedGroups.css';

export function PinnedGroups({
  rules,
  pins,
  view,
  onSelect,
}: {
  rules: Rule[];
  pins: Pin[];
  view: ViewState;
  onSelect: (pin: Pin) => void;
}) {
  const counts = { assignment: groupCounts(rules, 'assignment'), service: groupCounts(rules, 'service') };
  const find = (by: GroupBy, id: string) => counts[by].find((c) => c.group.id === id);

  return (
    <>
      <div className="mn-side-label">Pinned groups</div>
      {pins.length === 0 && <div className="mn-pins-empty">Pin a group from the filter beside “Rules” to keep it here.</div>}
      <div className="mn-groups">
        {pins.map((pin) => {
          const row = find(pin.by, pin.id);
          if (!row) return null; // a pinned group that no longer exists
          return (
            <button
              key={`${pin.by}:${pin.id}`}
              className="mn-group"
              data-active={(view.groupBy === pin.by && view.groupId === pin.id) || undefined}
              title={row.group.name}
              onClick={() => onSelect(pin)}
            >
              <span className="mn-truncate">{row.group.name}</span>
              {row.proposed > 0 && <span className="mn-dot" data-status="proposed" aria-label={`${row.proposed} proposed`} />}
              <span className="mn-count">{row.total}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
