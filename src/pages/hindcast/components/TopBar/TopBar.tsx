/* The bar across the top of the hindcast and the forecast: the page's name, and the scope both
 * read: the service, how far back, and on the forecast how far ahead. A picked root cause shows
 * here as a chip, so the reader always knows the hindcast is narrowed. */

import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, History, PanelLeftClose, PanelLeftOpen, Telescope, X } from 'lucide-react';
import { SERVICES, serviceName } from '../../data/mockData';
import { CAUSE_LABEL, HORIZONS, LOOKBACKS, dayMonth } from '../../model/labels';
import type { CauseKey, Horizon, Lookback } from '../../model/types';
import '../../../rule-management/components/RuleList/SortMenu.css';
import './TopBar.css';

function Segmented<T extends number>({ label, options, value, onChange, unit }: { label: string; options: T[]; value: T; onChange: (v: T) => void; unit: string }) {
  return (
    <div className="ol-seg" role="radiogroup" aria-label={label}>
      <span className="ol-seg-label">{label}</span>
      <div className="mn-tabs ol-seg-track">
        {options.map((option) => (
          <button
            key={option}
            role="radio"
            aria-checked={value === option}
            className="mn-tab"
            data-active={value === option || undefined}
            onClick={() => onChange(option)}
          >
            {option}
            {unit}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TopBar({
  page,
  serviceId,
  onService,
  weeks,
  onWeeks,
  horizon,
  onHorizon,
  cause,
  onClearCause,
  hideSide,
  onToggleSide,
  today,
}: {
  page: 'hindcast' | 'forecast';
  serviceId: string;
  onService: (id: string) => void;
  weeks: Lookback;
  onWeeks: (weeks: Lookback) => void;
  /** The forecast's horizon; the hindcast leaves these out. */
  horizon?: Horizon;
  onHorizon?: (horizon: Horizon) => void;
  /** The hindcast's root cause filter; the forecast leaves these out. */
  cause?: CauseKey | null;
  onClearCause?: () => void;
  hideSide: boolean;
  onToggleSide: () => void;
  today: string;
}) {
  return (
    <header className="ol-bar">
      <button
        className="mn-icon-btn"
        onClick={onToggleSide}
        aria-pressed={!hideSide}
        aria-label="Sidebar"
        title={`${hideSide ? 'Show' : 'Hide'} sidebar  [`}
      >
        {hideSide ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>

      <h1 className="ol-title">
        {page === 'hindcast' ? <History size={15} /> : <Telescope size={15} />}
        {page === 'hindcast' ? 'Hindcast' : 'Forecast'}
      </h1>

      <span className="ol-bar-rule" aria-hidden />

      <Menu.Root>
        <Menu.Trigger className="mn-btn ol-service" aria-label={`Service: ${serviceName(serviceId)}`}>
          <span className="mn-truncate">{serviceName(serviceId)}</span>
          <ChevronDown size={14} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={6} align="start">
            <Menu.Popup className="mn-menu">
              <div className="mn-menu-label">Service</div>
              <Menu.RadioGroup value={serviceId} onValueChange={(v) => onService(v as string)}>
                {[{ id: 'all', name: 'All services' }, ...SERVICES].map((s) => (
                  <Menu.RadioItem key={s.id} value={s.id} className="mn-menu-item" closeOnClick>
                    <Menu.RadioItemIndicator className="mn-menu-ind">
                      <Check size={13} />
                    </Menu.RadioItemIndicator>
                    <span>{s.name}</span>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      <Segmented label="History" options={LOOKBACKS} value={weeks} onChange={onWeeks} unit="w" />
      {horizon && onHorizon && <Segmented label="Ahead" options={HORIZONS} value={horizon} onChange={onHorizon} unit="w" />}

      {cause && onClearCause && (
        <button className="ol-cause-chip" onClick={onClearCause} aria-label={`Clear root cause: ${CAUSE_LABEL[cause]}`} title="Clear  Esc">
          {CAUSE_LABEL[cause]}
          <X size={12} />
        </button>
      )}

      <span className="ol-bar-meta">
        {page === 'hindcast' ? `Completed weeks to ${dayMonth(today)}` : `From ${dayMonth(today)}`}
      </span>
    </header>
  );
}
