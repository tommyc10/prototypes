/* The page's one recurring mark: a thin bar split three ways, by what would have caught the
 * tickets. Rule first, then change window, then what slipped through; always that order and
 * always those three tones, so it reads the same in the list, the charts and the tooltips.
 *
 * `of` is what a full-length bar stands for. Leave it out and the bar fills its track (a
 * part-to-whole meter); pass the largest row's total and the bars rank against each other. */

import { num } from '../../../../lib/format';
import { OUTCOMES, OUTCOME_LABEL, total } from '../../model/labels';
import type { Split } from '../../model/types';

export function SplitBar({ split, of, size = 'md' }: { split: Split; of?: number; size?: 'sm' | 'md' | 'lg' }) {
  const sum = total(split);
  const label = OUTCOMES.map((o) => `${num(split[o])} ${OUTCOME_LABEL[o].toLowerCase()}`).join(', ');
  return (
    <div className="hc-split" data-size={size} data-whole={of === undefined || undefined} role="img" aria-label={label}>
      <div className="hc-split-fill" style={{ width: `${of ? (sum / of) * 100 : 100}%` }}>
        {OUTCOMES.map((o) => split[o] > 0 && <span key={o} data-outcome={o} style={{ flexGrow: split[o] }} />)}
      </div>
    </div>
  );
}
