/* The list column: every service, loudest first, by the chosen measure over the chosen
 * lookback. Each row carries its other two figures in the meta line, and a meter scaled to
 * the loudest. When the ranking changes, rows slide to their new place. */

import { useEffect, useRef } from 'react';
import { num } from '../../../../lib/format';
import { useFlip } from '../../../hindcast/hooks/useFlip';
import { LOOKBACKS, MEASURES, measureOf, valueOf, words } from '../../model/talkers';
import type { Lookback, Measure, Talker } from '../../model/types';
import './ServiceList.css';

export function ServiceList({
  order,
  picked,
  measure,
  weeks,
  onPick,
  onMeasure,
  onWeeks,
}: {
  /** Loudest first. */
  order: Talker[];
  picked: string;
  measure: Measure;
  weeks: Lookback;
  onPick: (id: string) => void;
  onMeasure: (m: Measure) => void;
  onWeeks: (w: Lookback) => void;
}) {
  const listRef = useRef<HTMLElement>(null);
  useFlip(listRef, order.map((t) => t.id).join());
  const max = Math.max(1, ...order.map((t) => valueOf(t, measure)));

  // Keep the picked row in view as J and K walk the list.
  useEffect(() => {
    listRef.current?.querySelector(`[data-flip="${picked}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [picked]);

  return (
    <>
      <header className="sv-list-head">
        <h1>Services</h1>
        <p>Who raised the most over the last {weeks} weeks.</p>
        <div className="sv-list-controls">
          <Seg label="Rank by" options={MEASURES.map((m) => ({ key: m.key, label: m.label }))} value={measure} onChange={onMeasure} />
          <Seg label="Lookback" options={LOOKBACKS.map((w) => ({ key: w, label: `${w}w` }))} value={weeks} onChange={onWeeks} />
        </div>
      </header>

      <nav className="sv-rows" ref={listRef} aria-label={`Services, ranked by ${measureOf(measure).many}`}>
        {order.map((t, i) => (
          <button key={t.id} data-flip={t.id} className="sv-row" data-selected={t.id === picked || undefined} aria-current={t.id === picked || undefined} onClick={() => onPick(t.id)}>
            <span className="sv-rank">{i + 1}</span>
            <span className="sv-row-main">
              <span className="sv-row-name mn-truncate">{t.name}</span>
              <span className="sv-row-meta mn-truncate">
                {MEASURES.filter((m) => m.key !== measure)
                  .map((m) => `${num(valueOf(t, m.key))} ${words(valueOf(t, m.key), m.key)}`)
                  .join(' · ')}
              </span>
            </span>
            <span className="sv-row-fig">
              <b>{num(valueOf(t, measure))}</b>
              <span className="sv-meter" aria-hidden>
                <span style={{ transform: `scaleX(${valueOf(t, measure) / max})` }} />
              </span>
            </span>
          </button>
        ))}
      </nav>

      <footer className="sv-list-foot">
        <span>
          <kbd>J</kbd> <kbd>K</kbd> Navigate
        </span>
        <span>
          <kbd>S</kbd> Rank by
        </span>
        <span>
          <kbd>⌘K</kbd> Commands
        </span>
      </footer>
    </>
  );
}

/** A segmented control in a sunken well: choosing a mode, not a page. */
function Seg<T extends string | number>({ label, options, value, onChange }: { label: string; options: { key: T; label: string }[]; value: T; onChange: (key: T) => void }) {
  return (
    <div className="sv-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.key} className="mn-tab" role="radio" aria-checked={o.key === value} data-active={o.key === value || undefined} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
