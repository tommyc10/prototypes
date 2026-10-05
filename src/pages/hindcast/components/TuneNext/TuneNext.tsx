/* Chapter four: what to change.
 *   what this tells us    a few sentences, written from the figures
 *   headroom              how much more is within reach, and how much never will be
 *   what to tune next     the changes worth making, ranked by what they would have caught
 *   proposed rules        every proposed rule, replayed as if it had been active
 * Anything about a rule opens that rule on the Rules page, where the decision is made. */

import { AlertTriangle, ArrowUpRight, Check } from 'lucide-react';
import { num, pct } from '../../../../lib/format';
import { TUNING_LABEL, VERDICT_LABEL, share } from '../../model/labels';
import type { HindcastReport } from '../../model/types';
import { Chapter } from '../common/Chapter';
import { Prose } from '../common/Prose';
import './TuneNext.css';

export function TuneNext({ report, onOpenRule }: { report: HindcastReport; onOpenRule: (ruleId: string) => void }) {
  const { headroom, tuning, proposed, totals } = report;
  const of = (n: number) => pct(share(n, totals.cancelled));
  const maxCatch = Math.max(1, ...proposed.map((p) => p.wouldCatch));
  const reach = [
    { tone: 'rule', label: 'Caught today', value: headroom.caught },
    { tone: 'proposed', label: 'Proposed rules that validate', value: headroom.proposed },
    { tone: 'tuning', label: 'Other tuning could reach', value: headroom.tuning },
    { tone: 'missed', label: 'Out of reach', value: headroom.outOfReach },
  ];

  return (
    <Chapter id="tune-next">
      {report.findings.length > 0 && (
        <section className="hc-fig">
          <h3 className="hc-h3">What this tells us</h3>
          <ol className="hc-findings">
            {report.findings.map((finding, i) => (
              <li key={i}>
                <span className="mn-mono" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Prose text={finding} />
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="hc-fig" data-tour="hc-headroom">
        <h3 className="hc-h3">
          Headroom
          <span className="mn-subtle">of {num(totals.cancelled)} cancelled by hand</span>
        </h3>
        <div className="hc-reach" role="img" aria-label={reach.map((r) => `${r.label}: ${num(r.value)}`).join(', ')}>
          {reach.map((r) => r.value > 0 && <span key={r.tone} data-tone={r.tone} style={{ flexGrow: r.value }} />)}
        </div>
        <div className="hc-reach-key">
          {reach.map((r) => (
            <div key={r.tone}>
              <div className="hc-stat-label">
                <i className="hc-swatch" data-tone={r.tone} />
                {r.label}
              </div>
              <div className="hc-reach-val">
                {num(r.value)} <span>{of(r.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="hc-fig">
        <h3 className="hc-h3">
          What to tune next
          <span className="mn-subtle">ranked by what each would have caught</span>
        </h3>
        {tuning.length ? (
          <ol className="hc-actions">
            {tuning.map((action, i) => {
              const body = (
                <>
                  <span className="hc-action-n mn-mono">{i + 1}</span>
                  <span className="hc-action-main">
                    <span className="hc-action-title">
                      <span className="hc-kind" data-kind={action.kind}>
                        {TUNING_LABEL[action.kind]}
                      </span>
                      {action.title}
                    </span>
                    <span className="hc-action-detail">{action.detail}</span>
                  </span>
                  <span className="hc-action-gain">
                    <b>+{num(action.gain)}</b>
                    <span>{action.gain === 1 ? 'ticket' : 'tickets'}</span>
                  </span>
                  {action.ruleId ? <ArrowUpRight className="hc-rank-go" size={13} /> : <span />}
                </>
              );
              return (
                <li key={action.id}>
                  {action.ruleId ? (
                    <button className="hc-action" onClick={() => onOpenRule(action.ruleId!)} title={`Open ${action.ruleId} in Rules`}>
                      {body}
                    </button>
                  ) : (
                    <div className="hc-action">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="hc-none">Nothing to tune: no proposed rule, inactive rule or known pattern would have caught more.</p>
        )}
      </section>

      <section className="hc-fig" data-tour="hc-proposed">
        <h3 className="hc-h3">
          Proposed rule validation
          <span className="mn-subtle">replayed as if each had been active</span>
        </h3>
        {proposed.length ? (
          <div className="hc-table-wrap">
            <table className="hc-table hc-proposed">
              <thead>
                <tr>
                  <th scope="col">Rule</th>
                  <th scope="col">Confidence</th>
                  <th scope="col">Would also catch</th>
                  <th scope="col">Worked</th>
                  <th scope="col">Escalated</th>
                  <th scope="col">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {proposed.map((p) => (
                  <tr key={p.ruleId} tabIndex={0} onClick={() => onOpenRule(p.ruleId)} onKeyDown={(e) => e.key === 'Enter' && onOpenRule(p.ruleId)} title={`Open ${p.ruleId} in Rules`}>
                    <th scope="row">
                      <span className="hc-proposed-rule">
                        <span className="mn-dot" data-status="proposed" />
                        <span className="mn-mono mn-subtle">{p.ruleId}</span>
                        <span className="mn-truncate">{p.name}</span>
                      </span>
                    </th>
                    <td data-low={p.verdict === 'review' || undefined}>{pct(p.confidence)}</td>
                    <td>
                      <span className="hc-proposed-catch">
                        <span className="hc-rank-bar">
                          <i data-tone="proposed" style={{ width: `${(p.wouldCatch / maxCatch) * 100}%` }} />
                        </span>
                        {num(p.wouldCatch)}
                      </span>
                    </td>
                    <td>{num(p.worked)}</td>
                    <td data-bad={p.escalated > 0 || undefined}>{num(p.escalated)}</td>
                    <td>
                      <span className="hc-verdict" data-verdict={p.verdict}>
                        {p.verdict === 'validated' ? <Check size={12} /> : <AlertTriangle size={12} />}
                        {VERDICT_LABEL[p.verdict]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="hc-none">No proposed rule matched a ticket in this window.</p>
        )}
        <p className="hc-note">
          A proposal <strong>validates</strong> when it clears the 60% confidence floor and matched no escalated ticket. Matching one
          makes it <strong>unsafe</strong>, however much noise it would catch.
        </p>
      </section>
    </Chapter>
  );
}
