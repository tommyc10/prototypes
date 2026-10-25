/* The sidebar's shortcuts to the groups you pinned, on every page. The full list of groups is
 * the picker beside the Rules page's title (GroupPicker); the sidebar only holds the few you
 * chose. On the Rules page a pin filters the list in place; anywhere else it opens the Rules
 * page already filtered (#/rules?group=…). */

import { navigate } from '../../lib/route';
import { pinParam, samePin, usePinnedGroups, type Pin } from '../../pages/rule-management/hooks/usePinnedGroups';
import { useRulesStore } from '../../pages/rule-management/hooks/useRulesStore';
import { groupCounts, type GroupBy } from '../../pages/rule-management/model/browse';
import './PinnedGroups.css';

export function PinnedGroups({
  activePin,
  onPin,
  hint,
}: {
  /** The group the page is filtered to, if it's one of the pins. */
  activePin?: Pin | null;
  /** The Rules page filters itself; without this, a pin opens the Rules page. */
  onPin?: (pin: Pin) => void;
  /** Say how to pin when there are none (on the Rules page, where the picker is). */
  hint?: boolean;
}) {
  const rules = useRulesStore((s) => s.rules);
  const [pins] = usePinnedGroups();
  if (!pins.length && !hint) return null;

  const counts = { assignment: groupCounts(rules, 'assignment'), service: groupCounts(rules, 'service') };
  const find = (by: GroupBy, id: string) => counts[by].find((c) => c.group.id === id);
  const pick = (pin: Pin) => (onPin ? onPin(pin) : navigate(`#/rules?group=${pinParam(pin)}`));

  return (
    <section className="mn-nav-section" aria-labelledby="mn-nav-pinned">
      <div className="mn-nav-label" id="mn-nav-pinned">
        Pinned
      </div>
      {pins.length === 0 && <div className="mn-pins-empty">Pin a group from the filter beside “Rules” to keep it here.</div>}
      <div className="mn-groups">
        {pins.map((pin) => {
          const row = find(pin.by, pin.id);
          if (!row) return null; // a pinned group that no longer exists
          return (
            <button
              key={`${pin.by}:${pin.id}`}
              className="mn-group"
              data-active={(activePin && samePin(activePin, pin)) || undefined}
              title={`${row.group.name}: ${row.total} rules${row.proposed ? `, ${row.proposed} waiting` : ''}`}
              onClick={() => pick(pin)}
            >
              <span className="mn-truncate">{row.group.name}</span>
              {row.proposed > 0 && <span className="mn-dot" data-status="proposed" aria-label={`${row.proposed} waiting`} />}
              <span className="mn-count">{row.total}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
