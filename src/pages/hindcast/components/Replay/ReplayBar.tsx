/* The bar across the top of the hindcast: its name, which of its two views is showing, and
 * that view's scope.
 *
 *   Current replay      today's logic over a service and a lookback
 *   Historical extract  a past run, kept as it was, with its aggregate and its diagnostics
 *
 * Every segmented control has a thumb that slides to the picked option when the pointer picks
 * it; a key moves it at once. */

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, History, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { SERVICES } from '../../data/mockData';
import { EXTRACTS, type Extract } from '../../data/replayData';
import { LOOKBACKS, dayMonth } from '../../model/labels';
import type { Lookback } from '../../model/types';
import '../../../rule-management/components/RuleList/SortMenu.css';
import '../TopBar/TopBar.css';

export type Mode = 'replay' | 'extract';
export type ExtractView = 'aggregate' | 'diagnostics';

/** Set by the page for the one change a key made, so the thumb lands at once. */
let snapThumb = false;
export const snapNextThumb = () => {
  snapThumb = true;
  requestAnimationFrame(() => requestAnimationFrame(() => (snapThumb = false)));
};

export function Thumbed<T extends string | number>({
  label,
  options,
  value,
  onChange,
  render,
  hideLabel,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (v: T) => void;
  render: (v: T) => ReactNode;
  hideLabel?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number; snap: boolean } | null>(null);

  useLayoutEffect(() => {
    const el = track.current?.querySelector<HTMLElement>('[data-active]');
    if (!el) return;
    setThumb((was) => ({ x: el.offsetLeft, w: el.offsetWidth, snap: !was || snapThumb }));
  }, [value]);

  return (
    <div className="ol-seg" role="radiogroup" aria-label={label}>
      {!hideLabel && <span className="ol-seg-label">{label}</span>}
      <div className="mn-tabs ol-seg-track ol-thumbed" ref={track}>
        {thumb && (
          <span
            className="ol-thumb"
            data-snap={thumb.snap || undefined}
            aria-hidden
            style={{ transform: `translateX(${thumb.x - 2}px)`, width: thumb.w } as CSSProperties}
          />
        )}
        {options.map((option) => (
          <button key={String(option)} role="radio" aria-checked={value === option} className="mn-tab" data-active={value === option || undefined} onClick={() => onChange(option)}>
            {render(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Pick<T extends string>({ value, label, items, onPick, className }: { value: T; label: string; items: { id: T; name: string; meta?: string }[]; onPick: (v: T) => void; className?: string }) {
  const current = items.find((i) => i.id === value);
  return (
    <Menu.Root>
      <Menu.Trigger className={`mn-btn ol-service ${className ?? ''}`} aria-label={`${label}: ${current?.name}`}>
        <span className="mn-truncate">{current?.name}</span>
        <ChevronDown size={14} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start">
          <Menu.Popup className="mn-menu">
            <div className="mn-menu-label">{label}</div>
            <Menu.RadioGroup value={value} onValueChange={(v) => onPick(v as T)}>
              {items.map((s) => (
                <Menu.RadioItem key={s.id} value={s.id} className="mn-menu-item" closeOnClick>
                  <Menu.RadioItemIndicator className="mn-menu-ind">
                    <Check size={13} />
                  </Menu.RadioItemIndicator>
                  <span className="ol-menu-text">
                    {s.name}
                    {s.meta && <small>{s.meta}</small>}
                  </span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const extractMeta = (e: Extract) => `${e.id} · ${dayMonth(e.from)} to ${dayMonth(e.to - 1)} · ran ${dayMonth(e.ranAt)}`;

export function ReplayBar({
  mode,
  onMode,
  serviceId,
  onService,
  weeks,
  onWeeks,
  extractId,
  onExtract,
  view,
  onView,
  hideSide,
  onToggleSide,
  asOf,
}: {
  mode: Mode;
  onMode: (m: Mode) => void;
  serviceId: string;
  onService: (id: string) => void;
  weeks: Lookback;
  onWeeks: (w: Lookback) => void;
  extractId: string;
  onExtract: (id: string) => void;
  view: ExtractView;
  onView: (v: ExtractView) => void;
  hideSide: boolean;
  onToggleSide: () => void;
  asOf: number;
}) {
  return (
    <header className="ol-bar ol-rbar">
      <button className="mn-icon-btn" onClick={onToggleSide} aria-pressed={!hideSide} aria-label="Sidebar" title={`${hideSide ? 'Show' : 'Hide'} sidebar  [`}>
        {hideSide ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>

      <h1 className="ol-title">
        <History size={15} />
        Hindcast
      </h1>

      <Thumbed
        label="View"
        hideLabel
        options={['replay', 'extract'] as Mode[]}
        value={mode}
        onChange={onMode}
        render={(m) => (
          <>
            {m === 'replay' ? 'Current replay' : 'Historical extract'}
            <kbd>{m === 'replay' ? 'R' : 'E'}</kbd>
          </>
        )}
      />

      <span className="ol-bar-rule" aria-hidden />

      {mode === 'replay' ? (
        <div className="ol-rbar-scope" key="replay">
          <Pick label="Service" value={serviceId} items={[{ id: 'all', name: 'All services' }, ...SERVICES.map((s) => ({ id: s.id, name: s.name, meta: s.unit }))]} onPick={onService} />
          <Thumbed label="Look back" options={LOOKBACKS} value={weeks} onChange={onWeeks} render={(w) => `${w}w`} />
        </div>
      ) : (
        <div className="ol-rbar-scope" key="extract">
          <Pick label="Extract" className="ol-extract-pick" value={extractId} items={EXTRACTS.map((e) => ({ id: e.id, name: e.title, meta: extractMeta(e) }))} onPick={onExtract} />
          <Thumbed
            label="Show"
            hideLabel
            options={['aggregate', 'diagnostics'] as ExtractView[]}
            value={view}
            onChange={onView}
            render={(v) => (
              <>
                {v === 'aggregate' ? 'Aggregate' : 'Diagnostics'}
                <kbd>{v === 'aggregate' ? 'A' : 'D'}</kbd>
              </>
            )}
          />
        </div>
      )}

      <span className="ol-bar-meta">{mode === 'replay' ? `Rules and windows as of today, ${dayMonth(asOf)}` : 'Frozen: kept as it ran'}</span>
    </header>
  );
}
