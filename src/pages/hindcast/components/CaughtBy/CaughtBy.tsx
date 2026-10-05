/* Chapter three: what would have caught it.
 *   two contributor lists   the rules that matched, and the change windows that had noise
 *   recurring windows       the windows that come round again, week by week
 * A rule's row opens that rule on the Rules page. */

import { ArrowUpRight } from 'lucide-react';
import { num } from '../../../../lib/format';
import type { HindcastReport, WindowContribution } from '../../model/types';
import { Figure } from '../charts/Figure';
import { HeatStrip } from '../charts/HeatStrip';
import { dayMonth } from '../charts/WeeklyColumns';
import { Chapter } from '../common/Chapter';
import './CaughtBy.css';

export function CaughtBy({ report, onOpenRule }: { report: HindcastReport; onOpenRule: (ruleId: string) => void }) {
  const { rules, windows, totals } = report;
  const serviceName = (id: string) => report.services.find((s) => s.id === id)?.name ?? '';
  const all = report.scope.serviceId === 'all';
  const maxRule = Math.max(1, ...rules.map((r) => r.caught));
  const maxWindow = Math.max(1, ...windows.map((w) => w.caught));
  const recurring = windows.filter((w) => w.recurring);

  return (
    <Chapter id="caught-by">
      <div className="hc-grid" data-cols="2">
        <section className="hc-fig" data-tour="hc-rules">
          <h3 className="hc-h3">
            Rules that matched
            <span className="mn-subtle">
              {num(totals.split.rule)} tickets · {rules.length} {rules.length === 1 ? 'rule' : 'rules'}
            </span>
          </h3>
          {rules.length ? (
            <ul className="hc-ranks">
              {rules.map((rule) => (
                <li key={rule.ruleId}>
                  <button className="hc-rank-row" onClick={() => onOpenRule(rule.ruleId)} title={`Open ${rule.ruleId} in Rules`}>
                    <span className="hc-rank-id mn-mono">{rule.ruleId}</span>
                    <span className="hc-rank-main">
                      <span className="hc-rank-name mn-truncate">{rule.name}</span>
                      <span className="hc-rank-meta mn-truncate">
                        {all && `${serviceName(rule.serviceId)} · `}
                        {rule.worked ? `${num(rule.worked)} worked ${rule.worked === 1 ? 'ticket' : 'tickets'} also matched` : 'no worked ticket matched'}
                      </span>
                    </span>
                    <span className="hc-rank-bar">
                      <i data-tone="rule" style={{ width: `${(rule.caught / maxRule) * 100}%` }} />
                    </span>
                    <span className="hc-rank-val">{num(rule.caught)}</span>
                    <ArrowUpRight className="hc-rank-go" size={13} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hc-none">No active rule matched a cancelled ticket in this window.</p>
          )}
        </section>

        <section className="hc-fig">
          <h3 className="hc-h3">
            Change windows with noise
            <span className="mn-subtle">
              {num(totals.split.window)} tickets · {windows.length} {windows.length === 1 ? 'window' : 'windows'}
            </span>
          </h3>
          {windows.length ? (
            <ul className="hc-ranks">
              {windows.map((w) => (
                <li key={w.id}>
                  <div className="hc-rank-row">
                    <span className="hc-rank-id mn-mono">{w.id}</span>
                    <span className="hc-rank-main">
                      <span className="hc-rank-name mn-truncate">{w.name}</span>
                      <span className="hc-rank-meta mn-truncate">
                        {all && `${serviceName(w.serviceId)} · `}
                        {w.schedule}
                      </span>
                    </span>
                    <span className="hc-rank-bar">
                      <i data-tone="window" style={{ width: `${(w.caught / maxWindow) * 100}%` }} />
                    </span>
                    <span className="hc-rank-val">{num(w.caught)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hc-none">No cancelled ticket fell inside a change window.</p>
          )}
        </section>
      </div>

      {recurring.length > 0 && <Recurring windows={recurring} starts={report.weekly.map((w) => w.start)} />}
    </Chapter>
  );
}

/** The windows that come round again: when a window makes noise every time it runs, the fix is the change, not the alert. */
function Recurring({ windows, starts }: { windows: WindowContribution[]; starts: string[] }) {
  const max = Math.max(1, ...windows.flatMap((w) => w.weekly));
  const perRun = (w: WindowContribution) => (w.occurrences ? w.caught / w.occurrences : 0);
  const fmt = (n: number) => (n >= 10 ? Math.round(n).toString() : n.toFixed(1));
  return (
    <Figure
      title="Recurring change windows"
      note="tickets cancelled inside each window, by week"
      table={{
        head: ['Change window', 'Schedule', 'Runs', 'Tickets', 'Per run', ...starts.map(dayMonth)],
        rows: windows.map((w) => [`${w.id} ${w.name}`, w.schedule, num(w.occurrences), num(w.caught), fmt(perRun(w)), ...w.weekly.map(num)]),
      }}
    >
      <div className="hc-recur" data-tour="hc-recurring">
        <div className="hc-recur-row hc-recur-head" aria-hidden>
          <span>Window</span>
          <span className="hc-recur-axis">
            <span>{dayMonth(starts[0])}</span>
            <span>{dayMonth(starts[starts.length - 1])}</span>
          </span>
          <span>Runs</span>
          <span>Per run</span>
          <span>Tickets</span>
        </div>
        {windows.map((w) => (
          <div className="hc-recur-row" key={w.id}>
            <span className="hc-rank-main">
              <span className="hc-rank-name mn-truncate">{w.name}</span>
              <span className="hc-rank-meta mn-truncate">
                <span className="mn-mono">{w.id}</span> · {w.schedule}
              </span>
            </span>
            <HeatStrip values={w.weekly} starts={starts} max={max} label={w.name} />
            <span className="hc-recur-num mn-subtle">{num(w.occurrences)}</span>
            <span className="hc-recur-num mn-subtle">{fmt(perRun(w))}</span>
            <span className="hc-recur-num">{num(w.caught)}</span>
          </div>
        ))}
        <div className="hc-scale" aria-hidden>
          <span>Fewer</span>
          {[0.22, 0.48, 0.74, 1].map((heat) => (
            <i key={heat} style={{ opacity: heat }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </Figure>
  );
}
