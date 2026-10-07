/* Chapter one, and the top of the page: the verdict.
 *   the headline     one figure, and a paragraph written from the report's own numbers
 *   the summary      tickets, cancelled by hand, and the three-way split with its bar
 *   week by week     the same split, one column per completed week
 *   classification   every ticket, by what people did and what the engine would do */

import { CalendarRange, History } from 'lucide-react';
import { num, pct } from '../../../../lib/format';
import { OUTCOMES, OUTCOME_LABEL, caught, share, total } from '../../model/labels';
import { pct2 } from '../../model/narrative';
import type { HindcastReport, Verdicts } from '../../model/types';
import { Figure } from '../charts/Figure';
import { Legend } from '../charts/Legend';
import { SplitBar } from '../charts/SplitBar';
import { WeeklyColumns, dayMonth } from '../charts/WeeklyColumns';
import { Prose } from '../common/Prose';
import './Verdict.css';

/** "3 Aug – 27 Sep 2026" */
const range = (from: string, to: string) =>
  `${dayMonth(from)} – ${new Date(to).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}`;

export function Verdict({ report }: { report: HindcastReport }) {
  const { totals, provenance } = report;
  const rate = share(caught(totals.split), totals.cancelled);

  return (
    <section className="hc-chapter" id="verdict" aria-labelledby="verdict-title">
      <header className="hc-head">
        <div className="hc-head-top">
          <span className="mn-mono mn-subtle">{report.id}</span>
          <span className="hc-badge">
            <History size={12} />
            Replay
          </span>
        </div>
        <h2 className="hc-title" id="verdict-title">
          {report.title}
        </h2>
        <div className="hc-scope">
          <CalendarRange size={14} />
          <strong>{range(report.from, report.to)}</strong>
          <span className="mn-subtle">· {report.scope.weeks} completed weeks</span>
          <span className="hc-sep" />
          Replayed against {provenance.activeRules} active {provenance.activeRules === 1 ? 'rule' : 'rules'} and{' '}
          {provenance.changeWindows} change {provenance.changeWindows === 1 ? 'window' : 'windows'}
        </div>
      </header>

      <div className="hc-hero" data-tour="hc-headline">
        <div>
          {/* Green when most would have been caught, amber when little would, plain in between. */}
          <div className="hc-hero-figure" data-level={rate >= 0.6 ? 'good' : rate < 0.3 ? 'low' : undefined}>
            {Math.round(rate * 100)}
            <span>%</span>
          </div>
          <div className="hc-hero-caption">of the tickets cancelled by hand would have been caught</div>
        </div>
        <Prose className="hc-headline" text={report.headline} />
      </div>

      <div className="hc-summary" data-tour="hc-summary">
        <div className="hc-stat">
          <div className="hc-stat-label">Tickets</div>
          <div className="hc-stat-value">{num(totals.tickets)}</div>
          <div className="hc-stat-foot">raised in the window</div>
        </div>
        <div className="hc-stat">
          <div className="hc-stat-label">Cancelled by hand</div>
          <div className="hc-stat-value">{num(totals.cancelled)}</div>
          <div className="hc-stat-foot">{pct(share(totals.cancelled, totals.tickets))} of all tickets</div>
        </div>
        <div className="hc-stat hc-replay">
          <SplitBar split={totals.split} size="lg" />
          <div className="hc-replay-cols">
            {OUTCOMES.map((o) => (
              <div key={o}>
                <div className="hc-stat-label">
                  <i className="hc-swatch" data-tone={o} />
                  {OUTCOME_LABEL[o]}
                </div>
                <div className="hc-stat-value">{num(totals.split[o])}</div>
                <div className="hc-stat-foot">{pct(share(totals.split[o], totals.cancelled))} of cancelled</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Figure
        title="Week by week"
        note="tickets cancelled by hand"
        table={{
          head: ['Week of', 'Tickets', ...OUTCOMES.map((o) => OUTCOME_LABEL[o]), 'Caught'],
          rows: report.weekly.map((w) => [
            dayMonth(w.start),
            num(w.tickets),
            ...OUTCOMES.map((o) => num(w.split[o])),
            pct(share(caught(w.split), total(w.split))),
          ]),
        }}
      >
        <WeeklyColumns weeks={report.weekly} />
        <div className="hc-fig-foot">
          <Legend />
        </div>
      </Figure>

      <Classified report={report} />
    </section>
  );
}

/** Every ticket in the window: what people did with it, against what the engine would do today. */
function Classified({ report }: { report: HindcastReport }) {
  const { classification: c } = report;
  const rows: { label: string; note: string; v: Verdicts; kind: 'noise' | 'worked' | 'escalated' }[] = [
    { label: 'Cancelled by hand', note: 'noise', v: c.cancelled, kind: 'noise' },
    { label: 'Worked', note: 'real, minor', v: c.worked, kind: 'worked' },
    { label: 'Escalated', note: 'real, serious', v: c.escalated, kind: 'escalated' },
  ];
  const hiddenWork = c.worked.rule + c.worked.window;
  const hiddenEscalations = c.escalated.rule + c.escalated.window;
  const allWorked = hiddenWork + c.worked.passed;

  return (
    <section className="hc-fig">
      <h3 className="hc-h3">
        How the engine would classify every ticket
        <span className="mn-subtle">{num(report.totals.tickets)} tickets</span>
      </h3>
      <div className="hc-table-wrap">
        <table className="hc-table hc-matrix">
          <thead>
            <tr>
              <th scope="col">What people did</th>
              <th scope="col">Tickets</th>
              <th scope="col">Suppressed by a rule</th>
              <th scope="col">Covered by a change window</th>
              <th scope="col">Sent to a person</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, note, v, kind }) => {
              // Suppressing noise is the point. Suppressing real work is the cost; an escalation, a failure.
              const tone = (n: number) => (kind === 'noise' ? 'good' : !n ? 'none' : kind === 'worked' ? 'warn' : 'bad');
              return (
                <tr key={label}>
                  <th scope="row">
                    {label} <span className="mn-subtle">{note}</span>
                  </th>
                  <td>{num(v.rule + v.window + v.passed)}</td>
                  <td data-cell={tone(v.rule)}>{num(v.rule)}</td>
                  <td data-cell={tone(v.window)}>{num(v.window)}</td>
                  <td data-cell={kind === 'noise' ? 'missed' : undefined}>{num(v.passed)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="hc-note">
        {hiddenWork ? (
          <>
            The cost of the catch: <strong>{num(hiddenWork)}</strong> minor {hiddenWork === 1 ? 'ticket' : 'tickets'} that people did
            work would have been suppressed too ({pct2(share(hiddenWork, allWorked))} of worked tickets).{' '}
          </>
        ) : (
          <>No ticket that people worked would have been suppressed. </>
        )}
        {hiddenEscalations ? (
          <span className="mn-bad">
            {num(hiddenEscalations)} escalated {hiddenEscalations === 1 ? 'ticket' : 'tickets'} would have been hidden.
          </span>
        ) : (
          <>No escalated ticket would have been hidden.</>
        )}
      </p>
    </section>
  );
}
