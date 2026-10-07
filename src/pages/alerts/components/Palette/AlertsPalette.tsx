/* The ⌘K command menu on this page: the stream's controls, the feed's tabs and the way to
 * the other pages, without the mouse. cmdk handles the search and arrow keys; the look is
 * shared with the other pages' menus (styles/palette.css). */

import { Command } from 'cmdk';
import { CalendarClock, CircleHelp, Filter, History, Moon, Search, Sun, Siren } from 'lucide-react';
import type { Theme } from '../../../../hooks/useTheme';
import { FEED_TABS } from '../../model/labels';
import type { FeedFilter } from '../../model/types';

export function AlertsPalette({
  open,
  onOpenChange,
  live,
  preview,
  onToggleLive,
  onTogglePreview,
  onFilter,
  onNavigate,
  theme,
  onToggleTheme,
  onStartTour,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  live: boolean;
  preview: boolean;
  onToggleLive: () => void;
  onTogglePreview: () => void;
  onFilter: (filter: FeedFilter) => void;
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
        <Command.Input placeholder="Run a command…" />
      </div>
      <Command.List className="mn-palette-list">
        <Command.Empty className="mn-palette-empty">No results</Command.Empty>

        <Command.Group heading="Stream">
          <Command.Item value="stream pause live resume play" onSelect={run(onToggleLive)}>
            {live ? 'Pause the stream' : 'Go back to live'}
            <kbd>Space</kbd>
          </Command.Item>
          <Command.Item value="stream preview proposed rules what would be hidden" onSelect={run(onTogglePreview)}>
            {preview ? 'Stop previewing proposed rules' : 'Preview proposed rules'}
            <kbd>P</kbd>
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Show">
          {FEED_TABS.map((tab) => (
            <Command.Item key={tab.key} value={`show alerts ${tab.label}`} onSelect={run(() => onFilter(tab.key))}>
              {tab.key === 'all' ? 'All alerts' : `${tab.label} only`}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Go to">
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
      </Command.List>
    </Command.Dialog>
  );
}
