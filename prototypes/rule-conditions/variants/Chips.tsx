/* Chips: the conditions as compact pills, one press from the detail.
 *
 * Each pill reads as a filter you'd set yourself ("Sequence is pre-charge"), so the whole
 * rule fits on a line or two. Press one and it opens underneath: the condition in a
 * sentence, what it keeps out (how many incidents the rule would catch without it), and the
 * condition exactly as stored. The lock pill is the group, which no rule can reach past. */

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { num } from '../../../src/lib/format';
import { groupById } from '../../../src/pages/rule-management/data/mockData';
import { plain, span, without } from '../describe';
import type { VariantProps } from '../main';

export function Chips({ rule }: VariantProps) {
  const group = groupById(rule.groupId);
  const parts = rule.evidence.conditions.map(plain);
  const missing = without(rule);
  // Which pill is open, for which rule: moving to another rule closes it.
  const [open, setOpen] = useState<{ rule: string; i: number } | null>(null);
  const at = open?.rule === rule.id ? open.i : null;
  const toggle = (i: number) => setOpen(at === i ? null : { rule: rule.id, i });
  const picked = at !== null && at < parts.length ? parts[at] : null;

  return (
    <div className="pc-chips">
      <div className="pc-chip-row" role="group" aria-label="What it matches">
        {parts.map((p, i) => (
          <button key={p.raw} className="pc-chip" aria-expanded={at === i} data-open={at === i || undefined} onClick={() => toggle(i)}>
            <span className="pc-op">{p.label}</span> <span className="pc-op">{p.op}</span>{' '}
            <b data-mono={p.mono || undefined}>{p.values.join(', ')}</b>
          </button>
        ))}
        <button className="pc-chip" data-lock aria-expanded={at === parts.length} data-open={at === parts.length || undefined} onClick={() => toggle(parts.length)}>
          <Lock size={12} />
          <b>{group.name}</b>
        </button>
      </div>

      {at !== null && (
        <div className="pc-chip-detail" key={at}>
          {picked ? (
            <>
              <p>
                It only matches when {picked.lead} <b>{picked.values.join(' or ')}</b>.
              </p>
              <div className="pc-without">
                <div>
                  <span>With it</span>
                  <i style={{ transform: `scaleX(${rule.incidentCount / missing[at]})` }} />
                  <b>{num(rule.incidentCount)}</b>
                </div>
                <div>
                  <span>Without it</span>
                  <i data-more style={{ transform: 'scaleX(1)' }} />
                  <b>{num(missing[at])}</b>
                </div>
              </div>
              <p className="pc-chip-note">
                Without it the rule would catch <b>{num(missing[at] - rule.incidentCount)}</b> more incidents in {span(rule)}. As stored:{' '}
                <span className="mn-mono">{picked.raw}</span>
              </p>
            </>
          ) : (
            <p>
              Every rule is locked to the group it was made for. This one can only ever match <b>{group.name}</b>’s incidents, whatever its other conditions say.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
