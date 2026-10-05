/* What the three tones mean. Wherever the split bar appears, one of these is in sight. */

import { OUTCOMES, OUTCOME_LABEL, OUTCOME_SHORT } from '../../model/labels';

export function Legend({ short }: { short?: boolean }) {
  return (
    <ul className="hc-legend">
      {OUTCOMES.map((o) => (
        <li key={o}>
          <i data-tone={o} />
          {(short ? OUTCOME_SHORT : OUTCOME_LABEL)[o]}
        </li>
      ))}
    </ul>
  );
}
