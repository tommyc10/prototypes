/* The ⌘K command menu: jump to any rule, or run any command, without the mouse.
 * (Its look is shared with the other pages' menus: see styles/palette.css.)
 * cmdk handles the search and arrow-key selection. Each item's `value` is what the
 * search matches against, which is why "RUL-0419" finds a rule by its id. */

import { Command } from 'cmdk';
import { CalendarClock, Bell, CircleHelp, History, Moon, Search, Sun, Siren } from 'lucide-react';
import { GROUPS } from '../../data/mockData';
import type { Theme } from '../../../../hooks/useTheme';
import { SORT_KEYS, SORT_LABEL, STATUS_TABS, type SortKey, type StatusFilter } from '../../model/browse';
import { ACTION_KEY, ACTION_LABEL } from '../../model/labels';
import { actionsFor } from '../../model/policy';
import type { Rule, RuleAction } from '../../model/types';

export function CommandPalette({
  open,
  onOpenChange,
  rules,
  selected,
  onSelect,
  onStatus,
  onGroup,
  onSort,
  onAction,
  onViewIncidents,
  onNavigate,
  theme,
  onToggleTheme,
  onStartTour,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: Rule[];
  selected: Rule | null;
  onSelect: (id: string) => void;
  onStatus: (status: StatusFilter) => void;
  onGroup: (groupId: string) => void;
  onSort: (key: SortKey) => void;
  onAction: (action: RuleAction) => void;
  onViewIncidents: () => void;
  /** Go to another page, e.g. '#/hindcast'. */
  onNavigate: (to: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onStartTour: () => void;
}) {
  /** Run a command, then close the palette. */
  const run = (fn: () => void) => () => {
    fn();
    onOpenChange(false);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command menu"
      className="mn-palette"
      overlayClassName="mn-palette-overlay"
      contentClassName="mn-palette-content"
    >
      <div className="mn-palette-search">
        <Search size={16} />
        <Command.Input placeholder="Search rules or run a command…" />
      </div>
      <Command.List className="mn-palette-list">
        <Command.Empty className="mn-palette-empty">No results</Command.Empty>

        {/* The selected rule comes first, so ⌘K then ↵ is the fastest way to act. */}
        {selected && (
          <Command.Group heading={selected.id}>
            {actionsFor(selected).map((action) => (
              <Command.Item key={action} value={`${action} ${selected.id}`} onSelect={run(() => onAction(action))}>
                {ACTION_LABEL[action]} rule
                <kbd>{ACTION_KEY[action]}</kbd>
              </Command.Item>
            ))}
            <Command.Item value={`incidents ${selected.id}`} onSelect={run(onViewIncidents)}>
              View all {selected.incidentCount} incidents
            </Command.Item>
          </Command.Group>
        )}

        <Command.Group heading="Rules">
          {rules.map((rule) => (
            <Command.Item key={rule.id} value={`${rule.id} ${rule.name}`} onSelect={run(() => onSelect(rule.id))}>
              <span className="mn-dot" data-status={rule.status} />
              <span className="mn-truncate">{rule.name}</span>
              <span className="mn-palette-meta mn-mono">{rule.id}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Filter">
          {STATUS_TABS.map((tab) => (
            <Command.Item key={tab.key} value={`show ${tab.label}`} onSelect={run(() => onStatus(tab.key))}>
              Show {tab.label.toLowerCase()} rules
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Assignment group">
          <Command.Item value="group all" onSelect={run(() => onGroup('all'))}>
            All groups
          </Command.Item>
          {GROUPS.map((group) => (
            <Command.Item key={group.id} value={`group ${group.name} ${group.unit}`} onSelect={run(() => onGroup(group.id))}>
              {group.name}
              <span className="mn-palette-meta">{group.unit}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Go to">
          <Command.Item value="go to hindcast replay noise" onSelect={run(() => onNavigate('#/hindcast'))}>
            <History size={15} />
            Hindcast
          </Command.Item>
          <Command.Item value="go to alerts stream" onSelect={run(() => onNavigate('#/alerts'))}>
            <Bell size={15} />
            Alerts
          </Command.Item>
          <Command.Item value="go to change windows maintenance schedule" onSelect={run(() => onNavigate('#/changes'))}>
            <CalendarClock size={15} />
            Change windows
          </Command.Item>
          <Command.Item value="go to incidents journey lifecycle" onSelect={run(() => onNavigate('#/incidents'))}>
            <Siren size={15} />
            Incidents
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Preferences">
          <Command.Item value="theme appearance light dark mode" onSelect={run(onToggleTheme)}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            Switch to {theme === 'dark' ? 'light' : 'dark'} theme
          </Command.Item>
          <Command.Item value="tour help guide tutorial onboarding" onSelect={run(onStartTour)}>
            <CircleHelp size={15} />
            Take the tour
            <kbd>?</kbd>
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Sort">
          {SORT_KEYS.map((key) => (
            <Command.Item key={key} value={`sort ${SORT_LABEL[key]}`} onSelect={run(() => onSort(key))}>
              Sort by {SORT_LABEL[key].toLowerCase()}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
