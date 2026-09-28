import { useRef, useState, type CSSProperties } from 'react';

/** Keeps the last non-null value so popups can finish their exit animation with content. */
export function useLatest<T>(value: T | null) {
  const ref = useRef(value);
  if (value !== null) ref.current = value;
  return ref.current;
}
import { NOW, type Rule } from './data';
import { useRules, validate, type RuleAction } from './store';

/* ---------- Weekly incident bars ----------
 * Single series, so no legend: the caption names it. Bars cap at 24px with a
 * 2px surface gap, 4px rounded data-end, square at the baseline. The latest
 * week wears the accent, earlier weeks the de-emphasis hue. The whole column is
 * the hit target (hover + keyboard focus); the tooltip leads with the value.
 * Colors come from the host variant via --wb-bar, --wb-now, --wb-grid,
 * --wb-tip-bg, --wb-tip-fg. */

const weekLabel = (i: number, n: number) => {
  const d = new Date(NOW);
  d.setUTCDate(d.getUTCDate() - (n - 1 - i) * 7);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export function WeeklyBars({
  data,
  height = 72,
  className,
  style,
}: {
  data: number[];
  height?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data);
  return (
    <div className={`wb ${className ?? ''}`} style={style}>
      <div className="wb-plot" style={{ height }} onPointerLeave={() => setHover(null)}>
        {data.map((v, i) => (
          <div
            key={i}
            className="wb-col"
            tabIndex={0}
            aria-label={`Week of ${weekLabel(i, data.length)}: ${v} incidents`}
            data-hover={hover === i || undefined}
            onPointerEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
          >
            <div
              className="wb-bar"
              data-now={i === data.length - 1 || undefined}
              style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
            />
            {hover === i && (
              <div className="wb-tip" data-edge={i > data.length - 4 ? 'end' : i < 3 ? 'start' : undefined}>
                <strong>{v}</strong>
                <span>wk of {weekLabel(i, data.length)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="wb-axis">
        <span>{weekLabel(0, data.length)}</span>
        <span>This week</span>
      </div>
    </div>
  );
}

/* ---------- Decision form state ----------
 * Every action needs a written reason; turning on a low-confidence rule also
 * needs an explicit override. Variants render this however they like. */

export function useDecision(onDone?: (rule: Rule, action: RuleAction) => void) {
  const apply = useRules((s) => s.apply);
  const [target, setTarget] = useState<{ rule: Rule; action: RuleAction } | null>(null);
  const [reason, setReason] = useState('');
  const [override, setOverride] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const check = target ? validate(target.rule, target.action, reason, override) : null;

  return {
    target,
    reason,
    setReason,
    override,
    setOverride,
    attempted,
    check,
    open(rule: Rule, action: RuleAction) {
      setTarget({ rule, action });
      setReason('');
      setOverride(false);
      setAttempted(false);
    },
    close() {
      setTarget(null);
    },
    submit() {
      if (!target || !check) return false;
      setAttempted(true);
      if (!check.ok) return false;
      const updated = apply(target.rule.id, target.action, reason, override);
      onDone?.(updated, target.action);
      setTarget(null);
      return true;
    },
  };
}
