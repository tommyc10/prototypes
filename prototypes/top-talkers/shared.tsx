/* Throwaway: the pieces more than one variant uses. */

import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { pct } from '../../src/lib/format';
import { useRulesStore } from '../../src/pages/rule-management/hooks/useRulesStore';
import { MEASURES, talkers, type Measure } from './model';

/** Every service's reading over the lookback, kept in step with the rules store. */
export function useTalkers(weeks: number) {
  const rules = useRulesStore((s) => s.rules);
  return useMemo(() => talkers(rules, weeks), [rules, weeks]);
}

/** Prototype only: renders `children` inside an element of a real page, found by selector,
 *  so a variant can sit where it would live without touching the page's code. */
export function MountInto({ selector, children }: { selector: string; children: ReactNode }) {
  const [host, setHost] = useState<Element | null>(null);
  useLayoutEffect(() => {
    const find = () => {
      const el = document.querySelector(selector);
      if (el && el !== host) setHost(el);
    };
    find();
    const watch = new MutationObserver(find);
    watch.observe(document.body, { childList: true, subtree: true });
    return () => watch.disconnect();
  }, [selector, host]);
  return host ? createPortal(children, host) : null;
}

/** A segmented control in a sunken well: choosing a mode, not a page. */
export function Seg<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="tt-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.key} className="mn-tab" role="radio" aria-checked={o.key === value} data-active={o.key === value || undefined} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MeasureSeg({ value, onChange, without }: { value: Measure; onChange: (m: Measure) => void; without?: Measure }) {
  return <Seg label="Rank by" options={MEASURES.filter((m) => m.key !== without)} value={value} onChange={onChange} />;
}

/** Up or down on the lookback before, in fg-3: a rise isn't a status, so it takes no colour. */
export function Change({ by, against }: { by: number | null; against?: string }) {
  if (by === null) return <span className="tt-change">New</span>;
  if (Math.abs(by) < 0.005) return <span className="tt-change">Level{against && ` ${against}`}</span>;
  const Icon = by > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="tt-change" aria-label={`${by > 0 ? 'Up' : 'Down'} ${pct(Math.abs(by))}${against ? ` ${against}` : ''}`}>
      <Icon size={12} aria-hidden />
      {pct(Math.abs(by))}
      {against && <span> {against}</span>}
    </span>
  );
}

/** A 4px track filled with fg, scaled rather than resized. */
export function Meter({ value, max }: { value: number; max: number }) {
  return (
    <span className="tt-meter" aria-hidden>
      <span style={{ transform: `scaleX(${max ? value / max : 0})` }} />
    </span>
  );
}

/** Week-by-week bars, no axis: the shape of the lookback. The latest week is fg, the rest tone. */
export function WeekBars({ weekly, height = 24 }: { weekly: number[]; height?: number }) {
  const max = Math.max(1, ...weekly);
  return (
    <span className="tt-weeks" style={{ height }} aria-hidden>
      {weekly.map((n, i) => (
        <span key={i} data-now={i === weekly.length - 1 || undefined} style={{ transform: `scaleY(${Math.max(0.04, n / max)})` }} />
      ))}
    </span>
  );
}
