/* Why the rule was proposed: the summary, a warning if it matched a real incident,
 * the conditions it matches on (written like code), and a few key facts. */

import { AlertTriangle } from 'lucide-react';
import { shortDate } from '../../../../lib/format';
import { groupById } from '../../data/mockData';
import type { Rule } from '../../model/types';
import './Evidence.css';

export function Evidence({ rule }: { rule: Rule }) {
  const group = groupById(rule.groupId);
  const escalated = rule.related.filter((i) => i.resolution === 'escalated');

  return (
    <section className="mn-sec" data-tour="evidence">
      <h3>Evidence</h3>
      <p className="mn-p">{rule.evidence.summary}</p>
      {escalated.length > 0 && (
        <div className="mn-callout">
          <AlertTriangle size={14} />
          <span>
            Matched a real incident: <strong>{escalated[0].title}</strong> <span className="mn-mono">{escalated[0].id}</span>
          </span>
        </div>
      )}
      <div className="mn-code">
        {rule.evidence.conditions.map((c, i) => (
          <div key={i}>
            <span className="mn-code-kw">{i === 0 ? 'where' : '  and'}</span> {c.field}{' '}
            <span className="mn-code-op">{c.op}</span> <span className="mn-code-val">{c.value}</span>
          </div>
        ))}
        {/* Every rule is locked to one assignment group. */}
        <div>
          <span className="mn-code-kw">  and</span> assignment_group <span className="mn-code-op">=</span>{' '}
          <span className="mn-code-val">{group.name}</span> <span className="mn-code-cm">// scope, locked</span>
        </div>
      </div>
      <dl className="mn-kv">
        <div>
          <dt>Median clear</dt>
          <dd>{rule.evidence.medianClear}</dd>
        </div>
        <div>
          <dt>Recurrence</dt>
          <dd>{rule.evidence.recurrence}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{shortDate(rule.createdAt)}</dd>
        </div>
      </dl>
    </section>
  );
}
