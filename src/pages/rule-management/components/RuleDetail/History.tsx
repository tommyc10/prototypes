/* The audit trail, newest first. Entries are only ever added, never edited. */

import { ago } from '../../../../lib/format';
import type { Rule } from '../../model/types';
import './History.css';

export function History({ rule }: { rule: Rule }) {
  return (
    <section className="mn-sec">
      <h3>History</h3>
      <ol className="mn-timeline">
        {[...rule.audit].reverse().map((entry, i) => (
          <li key={i} data-action={entry.action}>
            <div className="mn-tl-head">
              <strong>{entry.actor}</strong>
              <span className="mn-tl-action" data-action={entry.action}>
                {entry.action}
              </span>
              {entry.override && <span className="mn-chip-warn">Override</span>}
              <span className="mn-subtle mn-tl-time">{ago(entry.at)}</span>
            </div>
            <p>{entry.reason}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
