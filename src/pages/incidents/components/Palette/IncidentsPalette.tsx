/* The ⌘K command menu on this page: find an incident by its number or title, keep one kind
 * of ending, or go to another page, without the mouse. cmdk handles the search and arrow
 * keys; the look is shared with the other pages' menus (styles/palette.css). */

import { Command } from 'cmdk';
import { Bell, CalendarClock, CircleHelp, Filter, History, Moon, Search, Sun } from 'lucide-react';
import type { Theme } from '../../../../hooks/useTheme';
import { END_SHORT, END_TABS } from '../../model/lifecycle';
import type { EndFilter, Lifecycle } from '../../model/types';

export function IncidentsPalette({
  open,
  onOpenChange,
  lives,
  onSelect,
  onFilter,
  onNavigate,
  theme,
  onToggleTheme,
  onStartTour,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Every incident, newest first. */
  lives: Lifecycle[];
  onSelect: (id: string) => void;
  onFilter: (filter: EndFilter) => void;
  /** Go to another page, e.g. '#/rules'. */
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
        <Command.Input placeholder="Find an incident or run a command…" />
      </div>
      <Command.List className="mn-palette-list">
        <Command.Empty className="mn-palette-empty">No results</Command.Empty>

        <Command.Group heading="Incident">
          {lives.map((life) => (
            <Command.Item
              key={life.incident.id}
              value={`incident ${life.incident.id} ${life.incident.title} ${life.incident.ci}`}
              onSelect={run(() => onSelect(life.incident.id))}
            >
              <span className="mn-mono mn-subtle">{life.incident.id}</span>
              <span className="mn-truncate">{life.incident.title}</span>
              <span className="mn-palette-meta">{END_SHORT[life.end]}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Show">
          {END_TABS.map((tab) => (
            <Command.Item key={tab.key} value={`show incidents ${tab.label}`} onSelect={run(() => onFilter(tab.key))}>
              {tab.key === 'all' ? 'All incidents' : `${tab.label} only`}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Go to">
          <Command.Item value="go to alerts stream" onSelect={run(() => onNavigate('#/alerts'))}>
            <Bell size={15} />
            Alerts
          </Command.Item>
          <Command.Item value="go to rules rule management" onSelect={run(() => onNavigate('#/rules'))}>
            <Filter size={15} />
            Rules
          </Command.Item>
          <Command.Item value="go to hindcast replay" onSelect={run(() => onNavigate('#/hindcast'))}>
            <History size={15} />
            Hindcast
          </Command.Item>
          <Command.Item value="go to change windows maintenance schedule" onSelect={run(() => onNavigate('#/changes'))}>
            <CalendarClock size={15} />
            Change windows
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
      </Command.List>
    </Command.Dialog>
  );
}
