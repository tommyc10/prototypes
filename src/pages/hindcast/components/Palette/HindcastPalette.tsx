/* The ⌘K command menu on this page: jump to a service, a lookback or a chapter without the
 * mouse. cmdk handles the search and arrow keys; the look is shared with the Rules page's
 * menu (styles/palette.css). */

import { Command } from 'cmdk';
import { CalendarClock, Bell, CircleHelp, Filter, Moon, Search, Sun, Siren } from 'lucide-react';
import type { Theme } from '../../../../hooks/useTheme';
import { num } from '../../../../lib/format';
import { CHAPTERS, LOOKBACKS, type ChapterId } from '../../model/labels';
import type { Lookback, ServiceRow } from '../../model/types';

export function HindcastPalette({
  open,
  onOpenChange,
  services,
  onService,
  onWeeks,
  onChapter,
  onNavigate,
  theme,
  onToggleTheme,
  onStartTour,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: ServiceRow[];
  onService: (serviceId: string) => void;
  onWeeks: (weeks: Lookback) => void;
  onChapter: (id: ChapterId) => void;
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
        <Command.Input placeholder="Find a service or run a command…" />
      </div>
      <Command.List className="mn-palette-list">
        <Command.Empty className="mn-palette-empty">No results</Command.Empty>

        <Command.Group heading="Service">
          <Command.Item value="service all services" onSelect={run(() => onService('all'))}>
            All services
          </Command.Item>
          {services.map((service) => (
            <Command.Item key={service.id} value={`service ${service.name} ${service.unit}`} onSelect={run(() => onService(service.id))}>
              <span className="mn-truncate">{service.name}</span>
              <span className="mn-palette-meta">{num(service.cancelled)} cancelled</span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Lookback">
          {LOOKBACKS.map((weeks) => (
            <Command.Item key={weeks} value={`lookback last ${weeks} completed weeks`} onSelect={run(() => onWeeks(weeks))}>
              Last {weeks} completed weeks
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Chapter">
          {CHAPTERS.map((chapter, i) => (
            <Command.Item key={chapter.id} value={`chapter ${chapter.label} ${chapter.question}`} onSelect={run(() => onChapter(chapter.id))}>
              {chapter.label}
              <span className="mn-palette-meta">{chapter.question}</span>
              <kbd style={{ marginLeft: 12 }}>{i + 1}</kbd>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Go to">
          <Command.Item value="go to rules rule management" onSelect={run(() => onNavigate('#/rules'))}>
            <Filter size={15} />
            Rules
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
      </Command.List>
    </Command.Dialog>
  );
}
