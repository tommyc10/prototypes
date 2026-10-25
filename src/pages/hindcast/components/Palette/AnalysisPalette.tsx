/* The ⌘K command menu on the hindcast and forecast pages: go to the other one, scope to a
 * service, a lookback or (on the forecast) a horizon, narrow the hindcast to a root cause, or
 * go elsewhere. cmdk handles the search and arrow keys; the look is shared (styles/palette.css).
 * It opens with no animation: it's used all day. */

import { Command } from 'cmdk';
import { Bell, CalendarClock, Filter, History, Moon, Search, Siren, Sun, Telescope, Users } from 'lucide-react';
import type { Theme } from '../../../../hooks/useTheme';
import { SERVICES } from '../../data/mockData';
import { CAUSES, CAUSE_LABEL, HORIZONS, LOOKBACKS } from '../../model/labels';
import type { CauseKey, Horizon, Lookback } from '../../model/types';

export function AnalysisPalette({
  open,
  onOpenChange,
  page,
  onService,
  onWeeks,
  onHorizon,
  onCause,
  onNavigate,
  theme,
  onToggleTheme,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page: 'hindcast' | 'forecast';
  onService: (id: string) => void;
  onWeeks: (weeks: Lookback) => void;
  /** The forecast's horizon; the hindcast leaves it out. */
  onHorizon?: (horizon: Horizon) => void;
  /** The hindcast's root cause filter; the forecast leaves it out. */
  onCause?: (cause: CauseKey) => void;
  onNavigate: (to: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
}) {
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
        <Command.Input placeholder={onCause ? 'Find a service, a cause or a command…' : 'Find a service or a command…'} />
      </div>
      <Command.List className="mn-palette-list">
        <Command.Empty className="mn-palette-empty">No results</Command.Empty>

        <Command.Group heading="Service">
          <Command.Item value="service all services" onSelect={run(() => onService('all'))}>
            All services
          </Command.Item>
          {SERVICES.map((s) => (
            <Command.Item key={s.id} value={`service ${s.name} ${s.unit}`} onSelect={run(() => onService(s.id))}>
              <span className="mn-truncate">{s.name}</span>
              <span className="mn-palette-meta">{s.unit}</span>
            </Command.Item>
          ))}
        </Command.Group>

        {onCause && (
          <Command.Group heading="Root cause">
            {CAUSES.map((key) => (
              <Command.Item key={key} value={`cause root ${CAUSE_LABEL[key]}`} onSelect={run(() => onCause(key))}>
                {CAUSE_LABEL[key]}
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading="Scope">
          {LOOKBACKS.map((w) => (
            <Command.Item key={w} value={`history lookback last ${w} weeks`} onSelect={run(() => onWeeks(w))}>
              Look back {w} weeks
            </Command.Item>
          ))}
          {onHorizon &&
            HORIZONS.map((h) => (
              <Command.Item key={h} value={`horizon forecast ahead next ${h} weeks`} onSelect={run(() => onHorizon(h))}>
                Forecast {h} weeks ahead
              </Command.Item>
            ))}
        </Command.Group>

        <Command.Group heading="Go to">
          {page === 'hindcast' ? (
            <Command.Item value="go to forecast predictions look ahead" onSelect={run(() => onNavigate('#/forecast'))}>
              <Telescope size={15} />
              Forecast
            </Command.Item>
          ) : (
            <Command.Item value="go to hindcast history root cause look back" onSelect={run(() => onNavigate('#/hindcast'))}>
              <History size={15} />
              Hindcast
            </Command.Item>
          )}
          <Command.Item value="go to incidents" onSelect={run(() => onNavigate('#/incidents'))}>
            <Siren size={15} />
            Incidents
          </Command.Item>
          <Command.Item value="go to alerts stream" onSelect={run(() => onNavigate('#/alerts'))}>
            <Bell size={15} />
            Alerts
          </Command.Item>
          <Command.Item value="go to rules" onSelect={run(() => onNavigate('#/rules'))}>
            <Filter size={15} />
            Rules
          </Command.Item>
          <Command.Item value="go to change windows" onSelect={run(() => onNavigate('#/changes'))}>
            <CalendarClock size={15} />
            Change windows
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
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
