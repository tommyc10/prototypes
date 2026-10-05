/* The cancelled tickets themselves: the evidence under the numbers. Filter by what would have
 * caught them, and read a page at a time. Give it a `key` of the service's id, so switching
 * services starts with a fresh filter. */

import { useState } from 'react';
import { num, shortDate } from '../../../../lib/format';
import { OUTCOMES, OUTCOME_SHORT, REASON_LABEL } from '../../model/labels';
import type { CancelledTicket, Outcome } from '../../model/types';

export function TicketBrowser({ tickets, pageSize = 8 }: { tickets: CancelledTicket[]; pageSize?: number }) {
  const [outcome, setOutcome] = useState<Outcome | 'all'>('all');
  const [shown, setShown] = useState(pageSize);
  const matching = outcome === 'all' ? tickets : tickets.filter((t) => t.outcome === outcome);
  const countOf = (o: Outcome) => tickets.filter((t) => t.outcome === o).length;

  return (
    <div className="hc-tickets">
      <div className="mn-tabs" role="tablist" aria-label="Filter by outcome">
        {(['all', ...OUTCOMES] as const).map((o) => (
          <button
            key={o}
            role="tab"
            aria-selected={outcome === o}
            className="mn-tab"
            data-active={outcome === o || undefined}
            onClick={() => {
              setOutcome(o);
              setShown(pageSize);
            }}
          >
            {o === 'all' ? 'All' : OUTCOME_SHORT[o]}
            <span>{num(o === 'all' ? tickets.length : countOf(o))}</span>
          </button>
        ))}
      </div>

      {matching.length ? (
        <ul className="hc-ticket-list">
          {matching.slice(0, shown).map((ticket) => (
            <li key={ticket.id}>
              <span className="mn-mono mn-subtle">{ticket.id}</span>
              <span className="mn-truncate">{ticket.title}</span>
              <span className="hc-ticket-reason mn-subtle mn-truncate">{REASON_LABEL[ticket.reason]}</span>
              <span className="hc-ticket-by" data-outcome-text={ticket.outcome}>
                <i className="hc-swatch" data-tone={ticket.outcome} />
                {ticket.by ? <span className="mn-mono">{ticket.by}</span> : 'Not caught'}
              </span>
              <span className="mn-subtle hc-ticket-date">{shortDate(ticket.openedAt)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mn-empty">No tickets match</div>
      )}

      {shown < matching.length && (
        <div className="hc-more">
          <button className="mn-btn" onClick={() => setShown(shown + pageSize * 3)}>
            Show more <span className="mn-subtle">{num(matching.length - shown)} left</span>
          </button>
        </div>
      )}
    </div>
  );
}
