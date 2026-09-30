/* The row of number cards at the top of a rule: confidence, purity, incidents, escalated. */

import type { ReactNode } from 'react';
import { pct } from '../../../../lib/format';
import { LOW_CONFIDENCE, isLowConfidence } from '../../model/policy';
import type { Rule } from '../../model/types';
import './Stats.css';

export function Stats({ rule }: { rule: Rule }) {
  const low = isLowConfidence(rule);
  return (
    <div className="mn-stats" data-tour="stats">
      <Stat label="Confidence" value={pct(rule.confidence)} meter={rule.confidence} tone={low ? 'warn' : undefined}>
        {low && <span className="mn-chip-warn">Below {pct(LOW_CONFIDENCE)}</span>}
      </Stat>
      <Stat label="Purity" value={pct(rule.purity)} meter={rule.purity} />
      <Stat label="Incidents" value={String(rule.incidentCount)}>
        <span className="mn-subtle">{rule.evidence.window.toLowerCase()}</span>
      </Stat>
      <Stat label="Escalated" value={String(rule.evidence.escalations)} tone={rule.evidence.escalations ? 'bad' : undefined}>
        <span className="mn-subtle">real incidents matched</span>
      </Stat>
    </div>
  );
}

/** One card. `meter` (0–1) draws a bar under the number; `tone` colours it. */
function Stat({
  label,
  value,
  meter,
  tone,
  children,
}: {
  label: string;
  value: string;
  meter?: number;
  tone?: 'warn' | 'bad';
  children?: ReactNode;
}) {
  return (
    <div className="mn-stat" data-tone={tone}>
      <div className="mn-stat-label">{label}</div>
      <div className="mn-stat-value">{value}</div>
      {meter !== undefined && (
        <div className="mn-meter" aria-hidden>
          <span style={{ transform: `scaleX(${meter})` }} />
        </div>
      )}
      {children && <div className="mn-stat-foot">{children}</div>}
    </div>
  );
}
