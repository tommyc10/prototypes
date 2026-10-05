/* Chapter five: how to read this.
 *   the population   from every ticket down to what was caught, each step a share of the last
 *   the method       what the replay does, in the order it does it
 *   provenance       where the tickets came from, what they were replayed against, and the
 *                    assumptions that the numbers rest on */

import { ChevronRight } from 'lucide-react';
import { num, pct } from '../../../../lib/format';
import { share } from '../../model/labels';
import type { HindcastReport } from '../../model/types';
import { Chapter } from '../common/Chapter';
import './Method.css';

const STEPS = [
  ['Take the noise people found', 'Every ticket a person closed as cancelled in the window. Their call is the ground truth: they looked, and it was nothing.'],
  ['Replay it against today’s logic', 'Each ticket is tested against the rules that are active now and the change windows on the calendar, not the ones that existed when it was raised.'],
  ['First match wins', 'A rule takes the ticket before a change window does, so nothing is counted twice. Whatever matches neither is not caught.'],
  ['Check what else would have gone', 'The same logic is run over the tickets people worked and escalated. Anything it would have suppressed there is the cost.'],
];

const stamp = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function Method({ report }: { report: HindcastReport }) {
  const { totals, headroom, provenance } = report;
  const withinReach = totals.cancelled - headroom.outOfReach;
  const funnel = [
    { label: 'Tickets raised', value: totals.tickets, foot: 'everything in the window' },
    { label: 'Cancelled by hand', value: totals.cancelled, foot: `${pct(share(totals.cancelled, totals.tickets))} of tickets` },
    { label: 'Within reach', value: withinReach, foot: `${pct(share(withinReach, totals.cancelled))} of cancelled` },
    { label: 'Caught today', value: headroom.caught, foot: `${pct(share(headroom.caught, withinReach))} of what’s in reach` },
  ];

  return (
    <Chapter id="method">
      <section className="hc-fig">
        <h3 className="hc-h3">
          The population
          <span className="mn-subtle">each step is a share of the one before</span>
        </h3>
        <ol className="hc-funnel">
          {funnel.map((step, i) => (
            <li key={step.label}>
              {i > 0 && <ChevronRight className="hc-funnel-arrow" size={14} aria-hidden />}
              <div className="hc-stat-label">{step.label}</div>
              <div className="hc-stat-value">{num(step.value)}</div>
              <div className="hc-stat-foot">{step.foot}</div>
            </li>
          ))}
        </ol>
        <p className="hc-note">
          <strong>Within reach</strong> is what the service could have addressed: tickets matched by a rule (active, proposed or
          inactive), raised inside a change window, or following a pattern with a known fix. The rest are one-offs that no
          suppression logic would catch.
        </p>
      </section>

      <div className="hc-grid" data-cols="2">
        <section className="hc-fig">
          <h3 className="hc-h3">How the replay works</h3>
          <ol className="hc-steps">
            {STEPS.map(([title, text], i) => (
              <li key={title}>
                <span className="mn-mono" aria-hidden>
                  {i + 1}
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="hc-fig">
          <h3 className="hc-h3">Provenance and assumptions</h3>
          <dl className="hc-prov">
            <div>
              <dt>Report</dt>
              <dd className="mn-mono">{report.id}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{provenance.source}</dd>
            </div>
            <div>
              <dt>Window</dt>
              <dd>
                {day(report.from)} to {day(report.to)}
              </dd>
            </div>
            <div>
              <dt>Replayed against</dt>
              <dd>
                {provenance.activeRules} active {provenance.activeRules === 1 ? 'rule' : 'rules'}, {provenance.changeWindows} change{' '}
                {provenance.changeWindows === 1 ? 'window' : 'windows'}
              </dd>
            </div>
            <div>
              <dt>Also tested</dt>
              <dd>
                {provenance.proposedRules} proposed {provenance.proposedRules === 1 ? 'rule' : 'rules'}
              </dd>
            </div>
            <div>
              <dt>Generated</dt>
              <dd>{stamp(provenance.generatedAt)}</dd>
            </div>
          </dl>
          <ul className="hc-assume">
            {provenance.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </section>
      </div>
    </Chapter>
  );
}
