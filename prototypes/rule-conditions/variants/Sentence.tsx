/* Sentence: the conditions as one sentence you can read aloud.
 *
 *   "Catches Reactor Core incidents where the CI starts with superlaser-tributary- and the
 *    sequence is pre-charge."
 *
 * The values are the only bright words, so the eye lands on them; the rest is quiet. Hover
 * or focus a value for the condition exactly as stored. The group comes first, because it's
 * the one thing no rule can reach past. */

import { groupById } from '../../../src/pages/rule-management/data/mockData';
import { plain } from '../describe';
import type { VariantProps } from '../main';

export function Sentence({ rule }: VariantProps) {
  const group = groupById(rule.groupId);
  const parts = rule.evidence.conditions.map(plain);
  return (
    <div className="pc-sentence">
      <span className="pc-kicker">What it catches</span>
      <p>
        Catches{' '}
        <span className="pc-val" tabIndex={0}>
          {group.name}
          <span className="pc-tip mn-mono" role="tooltip">
            assignment_group = {group.name} · locked
          </span>
        </span>{' '}
        incidents where{' '}
        {parts.map((p, i) => (
          <span key={p.raw}>
            {i > 0 && (i === parts.length - 1 ? ' and ' : ', ')}
            {p.lead}{' '}
            <span className="pc-val" data-mono={p.mono || undefined} tabIndex={0}>
              {p.values.length > 1 ? `${p.values.slice(0, -1).join(', ')} or ${p.values[p.values.length - 1]}` : p.values[0]}
              <span className="pc-tip mn-mono" role="tooltip">
                {p.raw}
              </span>
            </span>
          </span>
        ))}
        .
      </p>
    </div>
  );
}
