/* The ⌘K command menu on this page: open a person, start an invitation, or go to another
 * page, without the mouse. cmdk handles the search and arrow keys; the look is shared with
 * the other pages' menus (styles/palette.css). */

import { Command } from 'cmdk';
import { Bell, CalendarClock, Filter, History, House, Moon, Search, Siren, Sun, Telescope, UserPlus } from 'lucide-react';
import type { Theme } from '../../../../hooks/useTheme';
import type { Person } from '../../model/types';

export function AccessPalette({
  open,
  onOpenChange,
  people,
  onSelect,
  onInvite,
  onNavigate,
  theme,
  onToggleTheme,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  people: Person[];
  onSelect: (person: Person) => void;
  onInvite: () => void;
  /** Go to another page, e.g. '#/rules'. */
  onNavigate: (to: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
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
        <Command.Input placeholder="Find a person or run a command…" />
      </div>
      <Command.List className="mn-palette-list">
        <Command.Empty className="mn-palette-empty">No results</Command.Empty>

        <Command.Group heading="Actions">
          <Command.Item value="invite people add person grant access email" onSelect={run(onInvite)}>
            <UserPlus size={15} />
            Invite people
            <kbd>N</kbd>
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Person">
          {people.map((p) => (
            <Command.Item key={p.id} value={`person ${p.name} ${p.email}`} onSelect={run(() => onSelect(p))}>
              <span className="mn-truncate">{p.name}</span>
              <span className="mn-palette-meta">{p.status === 'invited' ? 'Invited' : p.email}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Go to">
          <Command.Item value="go to home" onSelect={run(() => onNavigate('#/'))}>
            <House size={15} />
            Home
          </Command.Item>
          <Command.Item value="go to incidents journey lifecycle" onSelect={run(() => onNavigate('#/incidents'))}>
            <Siren size={15} />
            Incidents
          </Command.Item>
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
          <Command.Item value="go to change windows" onSelect={run(() => onNavigate('#/changes'))}>
            <CalendarClock size={15} />
            Change windows
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Preferences">
          <Command.Item value="theme appearance light dark mode" onSelect={run(onToggleTheme)}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            Switch to {theme === 'dark' ? 'light' : 'dark'} theme
          </Command.Item>
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
