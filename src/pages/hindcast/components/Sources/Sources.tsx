/* Chapter two: where the noise came from.
 *   the lead       the top noise maker (or the service in scope), as a claim with its evidence
 *   the tickets    behind an expander: the actual hand-cancelled tickets
 *   two breakdowns what drove the cancellations, and what kind of ticket they were */

import { useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { num, pct } from '../../../../lib/format';
import { OUTCOMES, OUTCOME_LABEL, caught, share, total } from '../../model/labels';
import type { BreakdownRow, HindcastReport } from '../../model/types';
import { BreakdownBars } from '../charts/BreakdownBars';
import { Figure, type FigureTable } from '../charts/Figure';
import { Legend } from '../charts/Legend';
import { SplitBar } from '../charts/SplitBar';
import { Chapter } from '../common/Chapter';
import { Prose } from '../common/Prose';
import { TicketBrowser } from './TicketBrowser';
import './Sources.css';

const asTable = (first: string, rows: BreakdownRow[]): FigureTable => ({
  head: [first, 'Cancelled', ...OUTCOMES.map((o) => OUTCOME_LABEL[o]), 'Caught'],
  rows: rows.map((r) => [r.label, num(total(r.split)), ...OUTCOMES.map((o) => num(r.split[o])), pct(share(caught(r.split), total(r.split)))]),
});

export function Sources({ report, onSelectService }: { report: HindcastReport; onSelectService: (serviceId: string) => void }) {
  const { lead } = report;
  const all = report.scope.serviceId === 'all';
  const [open, setOpen] = useState(false);
  const { service } = lead;

  return (
    <Chapter id="sources">
      <section className="hc-lead" data-tour="hc-lead">
        <header className="hc-lead-head">
          <span className="hc-lead-rank" aria-hidden>
            {lead.rank}
          </span>
          <div className="hc-lead-name">
            <div className="mn-subtle">{all ? 'Top noise maker' : `Ranked ${lead.rank} of ${report.services.length} by manual cancellations`}</div>
            <h3>
              {service.name} <span className="mn-subtle">{service.unit}</span>
            </h3>
          </div>
          {all && (
            <button className="mn-btn hc-lead-open" onClick={() => onSelectService(service.id)}>
              Open its hindcast
              <ArrowRight size={14} />
            </button>
          )}
        </header>

        <Prose className="hc-lead-claim" text={lead.claim} />

        <div className="mn-backtest hc-well">
          <div>
            <b>{num(service.cancelled)}</b>
            <span>cancelled by hand</span>
          </div>
          <div>
            <b>{num(service.split.rule)}</b>
            <span>caught by an active rule</span>
          </div>
          <div>
            <b>{num(service.split.window)}</b>
            <span>caught by a change window</span>
          </div>
          <div>
            <b>{num(service.split.missed)}</b>
            <span>not caught</span>
          </div>
        </div>
        <SplitBar split={service.split} />

        <button className="hc-expander" aria-expanded={open} onClick={() => setOpen(!open)}>
          <ChevronRight size={14} />
          {open ? 'Hide' : 'Show'} the {num(lead.tickets.length)} cancelled tickets
        </button>
        {open && <TicketBrowser key={service.id} tickets={lead.tickets} />}
      </section>

      <div className="hc-grid" data-cols="2">
        <Figure title="What drove the cancellations" note="the reason the operator gave" table={asTable('Reason', report.reasons)}>
          <BreakdownBars rows={report.reasons} />
          <div className="hc-fig-foot">
            <Legend />
          </div>
        </Figure>
        <Figure title="Cancelled tickets by category" note="tickets" table={asTable('Category', report.categories)}>
          <BreakdownBars rows={report.categories} />
          <div className="hc-fig-foot">
            <Legend />
          </div>
        </Figure>
      </div>
    </Chapter>
  );
}
