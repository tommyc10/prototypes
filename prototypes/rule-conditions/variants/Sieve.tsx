/* Sieve: each condition as a step that narrows the group's incidents.
 *
 * It starts from every incident the group had in the window, and each line keeps only what
 * the one above let through, so you see what every condition is for: a condition that
 * barely narrows anything is doing nothing, and one that does all the work is the one to
 * check. The last line is the rule: what it catches, in green. The bars draw in once, in
 * order, as the incidents fall through. */

import type { CSSProperties } from 'react';
import { Lock } from 'lucide-react';
import { num } from '../../../src/lib/format';
import { groupById } from '../../../src/pages/rule-management/data/mockData';
import { narrowing, plain, span } from '../describe';
import type { VariantProps } from '../main';

export function Sieve({ rule }: VariantProps) {
  const group = groupById(rule.groupId);
  const counts = narrowing(rule);
  const top = counts[0];
  const steps = rule.evidence.conditions.map(plain);
  const last = steps.length;

  return (
    <div className="pc-sieve" role="table" aria-label="How each condition narrows the incidents">
      <div className="pc-sieve-row" role="row" style={{ '--i': 0 } as CSSProperties}>
        <span className="pc-sieve-step" role="cell">
          <Lock size={12} />
          Every <b>{group.name}</b> incident in {span(rule)}
        </span>
        <span className="pc-sieve-track" role="cell">
          <i style={{ transform: 'scaleX(1)' }} />
        </span>
        <span className="pc-sieve-n" role="cell">
          {num(top)}
        </span>
      </div>
      {steps.map((p, i) => {
        const n = counts[i + 1];
        const caught = i + 1 === last;
        return (
          <div key={p.raw} className="pc-sieve-row" role="row" data-caught={caught || undefined} style={{ '--i': i + 1 } as CSSProperties} title={p.raw}>
            <span className="pc-sieve-step" role="cell">
              {p.label}{' '}
              <span className="pc-op">{p.op}</span>{' '}
              <b data-mono={p.mono || undefined}>{p.values.join(', ')}</b>
            </span>
            <span className="pc-sieve-track" role="cell">
              <i style={{ transform: `scaleX(${Math.max(0.004, n / top)})` }} />
            </span>
            <span className="pc-sieve-n" role="cell">
              {num(n)}
              <small>{Math.max(1, Math.round((n / counts[i]) * 100))}% kept</small>
            </span>
          </div>
        );
      })}
      <p className="pc-sieve-foot">
        <b>{num(rule.incidentCount)}</b> {rule.incidentCount === 1 ? 'incident is' : 'incidents are'} what this rule catches. Each line keeps what the one above let through.
      </p>
    </div>
  );
}
