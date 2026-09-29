/* What the rule hides (or would hide) over its evidence window, shown before you decide. */

import { estimateImpact } from '../../model/policy';
import type { Rule } from '../../model/types';
import './ImpactCard.css';

const HEADING = { active: 'Impact so far', proposed: 'If approved', inactive: 'If activated' } as const;

export function ImpactCard({ rule }: { rule: Rule }) {
  const impact = estimateImpact(rule);
  return (
    <section className="mn-sec">
      <h3>
        {HEADING[rule.status]}
        <span className="mn-subtle">{rule.evidence.window.toLowerCase()}</span>
      </h3>
      <div className="mn-backtest mn-impact">
        <div>
          <b>{impact.suppressed}</b>
          <span>incidents hidden</span>
        </div>
        <div data-bad={impact.escalated > 0 || undefined}>
          <b>{impact.escalated}</b>
          <span>escalated</span>
        </div>
        <div>
          <b>{impact.hoursSaved}h</b>
          <span>time saved</span>
        </div>
      </div>
    </section>
  );
}
