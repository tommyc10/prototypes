/* Spec: the conditions as a labelled table in plain words.
 *
 * A row per condition: what it looks at (a name a person would use, not the field), how it
 * compares (a word), and the value, set as text. The group the rule is locked to is the last
 * row, with a lock, because it's a condition like the others that nobody can change. It's
 * the table recipe, so it sits with the facts beneath it as one section. Hover a row for the
 * condition exactly as stored. */

import { Lock } from 'lucide-react';
import { groupById } from '../../../src/pages/rule-management/data/mockData';
import { plain } from '../describe';
import type { VariantProps } from '../main';

export function Spec({ rule }: VariantProps) {
  const group = groupById(rule.groupId);
  return (
    <dl className="pc-spec" aria-label="What it matches">
      {rule.evidence.conditions.map((c) => {
        const p = plain(c);
        return (
          <div key={p.raw} title={p.raw}>
            <dt>{p.label}</dt>
            <dd className="pc-op">{p.op}</dd>
            <dd>
              {p.values.map((v, i) => (
                <span key={v}>
                  {i > 0 && <span className="pc-op">{i === p.values.length - 1 ? ' or ' : ', '}</span>}
                  <b data-mono={p.mono || undefined}>{v}</b>
                </span>
              ))}
            </dd>
          </div>
        );
      })}
      <div title={`assignment_group = ${group.name}`}>
        <dt>Group</dt>
        <dd className="pc-op">is</dd>
        <dd>
          <b>{group.name}</b>
          <span className="pc-lock">
            <Lock size={11} /> Locked
          </span>
        </dd>
      </div>
    </dl>
  );
}
