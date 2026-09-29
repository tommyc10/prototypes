/* The sidebar: brand, ⌘K button, navigation, the assignment groups (with a search box),
 * the signed-in user and the theme switch. It owns the group search text, because
 * nothing else needs it. */

import { useState } from 'react';
import { Bell, BookText, Filter, LayoutGrid, Moon, Search, Siren, Sun } from 'lucide-react';
import { groupCounts } from '../../model/browse';
import type { Rule } from '../../model/types';
import type { Theme } from '../../hooks/useTheme';
import './Sidebar.css';

export function Sidebar({
  hidden,
  rules,
  groupId,
  onSelectGroup,
  onOpenPalette,
  theme,
  onToggleTheme,
}: {
  hidden: boolean;
  rules: Rule[];
  groupId: string;
  onSelectGroup: (groupId: string) => void;
  onOpenPalette: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const [groupQuery, setGroupQuery] = useState('');

  // Match on the group's name and unit, so "death star" finds every group in that unit.
  const q = groupQuery.trim().toLowerCase();
  const shownGroups = groupCounts(rules).filter(({ group }) => `${group.name} ${group.unit}`.toLowerCase().includes(q));

  return (
    <aside className="mn-side" inert={hidden}>
      <div className="mn-brand">
        <div className="mn-brand-mark" aria-hidden>
          <svg viewBox="0 0 24 24" width="14" height="14">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </div>
        Imperial Ops
      </div>

      <button className="mn-jump" onClick={onOpenPalette}>
        <Search size={14} />
        <span>Search or jump to…</span>
        <kbd>⌘K</kbd>
      </button>

      <nav className="mn-nav">
        <a className="mn-nav-item"><Siren size={16} /> Incidents</a>
        <a className="mn-nav-item"><Bell size={16} /> Alerts</a>
        <a className="mn-nav-item" data-active><Filter size={16} /> Rules</a>
        <a className="mn-nav-item"><LayoutGrid size={16} /> Services</a>
        <a className="mn-nav-item"><BookText size={16} /> Audit log</a>
      </nav>

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
      <div className="mn-groups">
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

      <div className="mn-user">
        <div className="mn-avatar">AP</div>
        <div className="mn-user-text">
          <div>Admiral Piett</div>
          <div className="mn-subtle">Rule governor</div>
        </div>
        <button
          className="mn-icon-btn mn-theme-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </aside>
  );
}
