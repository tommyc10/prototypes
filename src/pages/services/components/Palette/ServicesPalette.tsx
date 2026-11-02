/* The ⌘K command menu on the Services page: jump to a service, rank by something else, or go
 * to another page. cmdk handles the search and arrow keys; the look is shared with the other
 * pages' menus (styles/palette.css). */

import { Command } from 'cmdk';
import { ArrowDownWideNarrow, Bell, CalendarClock, Filter, History, House, LayoutGrid, Moon, Search, Siren, Sun, Telescope, Users } from 'lucide-react';
import { HalloweenCommand } from '../../../../components/Halloween/HalloweenCommand';
import type { Theme } from '../../../../hooks/useTheme';
import { MEASURES } from '../../model/talkers';
import type { Measure, Talker } from '../../model/types';

export function ServicesPalette({
  open,
  onOpenChange,
  services,
  measure,
  onPick,
  onMeasure,
  onNavigate,
  theme,
  onToggleTheme,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Loudest first. */
  services: Talker[];
  measure: Measure;
  onPick: (id: string) => void;
  onMeasure: (m: Measure) => void;
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
        <Command.Input placeholder="Find a service, or run a command…" />
      </div>
      <Command.List className="mn-palette-list">
        <Command.Empty className="mn-palette-empty">No results</Command.Empty>

        <Command.Group heading="Services">
          {services.map((s) => (
            <Command.Item key={s.id} value={`service ${s.name} ${s.unit}`} onSelect={run(() => onPick(s.id))}>
              <LayoutGrid size={15} />
              {s.name}
              <span className="mn-palette-meta">{s.unit}</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Rank by">
          {MEASURES.filter((m) => m.key !== measure).map((m) => (
            <Command.Item key={m.key} value={`rank sort by ${m.many}`} onSelect={run(() => onMeasure(m.key))}>
              <ArrowDownWideNarrow size={15} />
              Rank by {m.many}
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
          <Command.Item value="go to change windows maintenance schedule" onSelect={run(() => onNavigate('#/changes'))}>
            <CalendarClock size={15} />
            Change windows
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
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
