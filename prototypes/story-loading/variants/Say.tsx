/* Say: words only. What's known is shown, and the sentence where the verdict will land says
 * what's being fetched, with a slow light across it. No shapes stand in for what's coming. */

import { KnownHead, type WaitingProps } from '../shared';
import './variants.css';

export function SayWaiting({ id, row }: WaitingProps) {
  const says = `Fetching the journey of ${id}…`;
  return (
    <KnownHead
      row={row}
      verdict={
        <p className="ic-verdict sl-shimmer" role="status" data-text={says}>
          {says}
        </p>
      }
    />
  );
}
