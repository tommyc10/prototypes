/* The assignment groups, in the sidebar under the navigation: a search box and one row per
 * group. It owns the group search text, because nothing else needs it. */

import { useState } from 'react';
import { Search } from 'lucide-react';
import { groupCounts } from '../../model/browse';
import type { Rule } from '../../model/types';
import './GroupNav.css';

export function GroupNav({
  rules,
  groupId,
  onSelectGroup,
}: {
  rules: Rule[];
  groupId: string;
  onSelectGroup: (groupId: string) => void;
}) {
  const [groupQuery, setGroupQuery] = useState('');

  // Match on the group's name and unit, so "death star" finds every group in that unit.
  const q = groupQuery.trim().toLowerCase();
  const shownGroups = groupCounts(rules).filter(({ group }) => `${group.name} ${group.unit}`.toLowerCase().includes(q));

  return (
    <>
      <div className="mn-side-label">Assignment groups</div>
      <label className="mn-search mn-group-search">
        <Search size={13} />
        <input
          value={groupQuery}
          onChange={(e) => setGroupQuery(e.target.value)}
          onKeyDown={(e) => {
            // Enter picks the top match; Esc clears. (The page's key handler then leaves the input.)
            if (e.key === 'Enter' && shownGroups.length) onSelectGroup(shownGroups[0].group.id);
            if (e.key === 'Escape') setGroupQuery('');
          }}
          placeholder="Find a group"
          aria-label="Find an assignment group"
        />
      </label>
      <div className="mn-groups" data-tour="groups">
        <button className="mn-group" data-active={groupId === 'all' || undefined} onClick={() => onSelectGroup('all')}>
          <span>All groups</span>
          <span className="mn-count">{rules.length}</span>
        </button>
        {shownGroups.length === 0 && <div className="mn-groups-empty">No groups match</div>}
        {shownGroups.map(({ group, total, proposed }) => (
          <button
            key={group.id}
            className="mn-group"
            data-active={groupId === group.id || undefined}
            onClick={() => onSelectGroup(group.id)}
          >
            <span className="mn-truncate">{group.name}</span>
            {proposed > 0 && <span className="mn-dot" data-status="proposed" aria-label={`${proposed} proposed`} />}
            <span className="mn-count">{total}</span>
          </button>
        ))}
      </div>
    </>
  );
}
