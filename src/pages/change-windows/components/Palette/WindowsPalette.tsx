/* The ⌘K command menu on this page: jump to a window, or go to another page, without the
 * mouse. cmdk handles the search and arrow keys; the look
 * is shared with the other pages' menus (styles/palette.css). */

import { Command } from 'cmdk';
import { Bell, CalendarClock, CircleHelp, Filter, History, Moon, Search, Siren, Sun, Telescope, Users } from 'lucide-react';
import { HalloweenCommand } from '../../../../components/Halloween/HalloweenCommand';
import type { Theme } from '../../../../hooks/useTheme';
import type { ChangeWindow } from '../../model/types';
import { timing } from '../../model/windows';

export function WindowsPalette({
  open,
  onOpenChange,
  windows,
  now,
  onSelect,
  onNavigate,
  theme,
  onToggleTheme,
  onStartTour,
  planFor,
  onPlan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Every window, in list order. */
  windows: ChangeWindow[];
  now: number;
  onSelect: (key: string) => void;
  /** Go to another page, e.g. '#/rules'. */
  onNavigate: (to: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onStartTour: () => void;
  /** The picked window, when a maintenance plan can be started or changed for it. */
  planFor?: ChangeWindow | null;
  onPlan?: () => void;
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
        <Command.Input placeholder="Find a change window or run a command…" />
      </div>
      <Command.List className="mn-palette-list">
        <Command.Empty className="mn-palette-empty">No results</Command.Empty>

        {planFor && onPlan && (
          <Command.Group heading="This window">
            <Command.Item value={`plan maintenance soften suppress ${planFor.id}`} onSelect={run(onPlan)}>
              <CalendarClock size={15} />
              <span className="mn-truncate">Plan maintenance for {planFor.id}</span>
              <kbd>M</kbd>
            </Command.Item>
          </Command.Group>
        )}

        <Command.Group heading="Change window">
          {windows.map((w) => (
            <Command.Item key={w.key} value={`window ${w.id} ${w.name} ${w.key}`} onSelect={run(() => onSelect(w.key))}>
              <span className="mn-truncate">{w.name}</span>
              <span className="mn-palette-meta">{timing(w, now)}</span>
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
          <Command.Item value="go to hindcast history root cause" onSelect={run(() => onNavigate('#/hindcast'))}>
            <History size={15} />
            Hindcast
          </Command.Item>
          <Command.Item value="go to forecast predictions look ahead" onSelect={run(() => onNavigate('#/forecast'))}>
            <Telescope size={15} />
            Forecast
          </Command.Item>
          <Command.Item value="go to incidents journey lifecycle" onSelect={run(() => onNavigate('#/incidents'))}>
            <Siren size={15} />
            Incidents
          </Command.Item>
          <Command.Item value="go to access people users permissions invite" onSelect={run(() => onNavigate('#/access'))}>
            <Users size={15} />
            Access
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Preferences">
          <Command.Item value="theme appearance light dark mode" onSelect={run(onToggleTheme)}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            Switch to {theme === 'dark' ? 'light' : 'dark'} theme
          </Command.Item>
          <HalloweenCommand run={run} />
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
