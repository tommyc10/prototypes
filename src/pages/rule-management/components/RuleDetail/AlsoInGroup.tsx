/* The other rules in the same assignment group, so you can spot overlaps.
 * Clicking one opens it. */

import { pct } from '../../../../lib/format';
import { groupById } from '../../data/mockData';
import { statusLabel } from '../../model/labels';
import { isLowConfidence } from '../../model/policy';
import type { Rule } from '../../model/types';
import './AlsoInGroup.css';

export function AlsoInGroup({ rule, rules, onSelect }: { rule: Rule; rules: Rule[]; onSelect: (id: string) => void }) {
  const siblings = rules.filter((r) => r.groupId === rule.groupId && r.id !== rule.id);
  return (
    <section className="mn-sec">
      <h3>
        Also in {groupById(rule.groupId).name} <span className="mn-subtle">{siblings.length}</span>
      </h3>
      {siblings.length ? (
        <div className="mn-siblings">
          {siblings.map((r) => (
            <button key={r.id} className="mn-sibling" onClick={() => onSelect(r.id)}>
              <span className="mn-dot" data-status={r.status} aria-label={statusLabel(r)} />
              <span className="mn-truncate">{r.name}</span>
              <span className="mn-row-conf" data-low={isLowConfidence(r) || undefined}>
                {pct(r.confidence)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mn-p mn-subtle">No other rules suppress incidents for this group.</p>
      )}
    </section>
  );
}
