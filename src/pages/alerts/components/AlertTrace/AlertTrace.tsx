/* One alert, and what happened to it, in the order it happened: it arrived, the rules were
 * checked, and it was hidden, folded or sent to a person. If a proposed rule fits it, this
 * is where the page says what approving that rule would have done to this exact alert. */

import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { groupById } from '../../../rule-management/data/mockData';
import { statusLabel } from '../../../rule-management/model/labels';
import { OUTCOME_LABEL, SEVERITY_LABEL } from '../../model/labels';
import type { StreamAlert } from '../../model/types';
import './AlertTrace.css';

const clockFace = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function AlertTrace({
  alert,
  following,
  activeRules,
  onOpenRule,
}: {
  alert: StreamAlert | null;
  /** Nothing is picked, so this is showing the latest alert to reach a person. */
  following: boolean;
  /** How many rules are switched on, for "checked against 8 active rules". */
  activeRules: number;
  onOpenRule: (ruleId: string) => void;
}) {
  if (!alert) {
    return (
      <section className="al-trace" data-tour="al-trace">
        <h2>Alert</h2>
        <p className="al-note">Nothing has reached a person in this stretch. Pick any alert to see what happened to it.</p>
      </section>
    );
  }

  const group = groupById(alert.groupId);
  const { rule } = alert;
  const hidden = alert.outcome === 'hidden';

  return (
    <section className="al-trace" data-tour="al-trace">
      <h2>
        {following ? 'Latest to reach a person' : 'Alert'}
        <span className="mn-mono mn-subtle">{alert.id}</span>
      </h2>

      <div className="al-trace-head">
        <i data-kind={alert.outcome} aria-hidden />
        <div>
          <div className="al-trace-title">{alert.title}</div>
          <div className="al-trace-sub">
            {OUTCOME_LABEL[alert.outcome]} · {SEVERITY_LABEL[alert.severity]} · {group.name}
          </div>
        </div>
      </div>

      {alert.wouldHide && rule && (
        <div className="al-callout" data-tone={alert.outcome === 'paged' ? 'bad' : undefined}>
          <AlertTriangle size={14} />
          <span>
            {alert.outcome === 'paged' ? (
              <>
                <strong>This one paged someone.</strong> <span className="mn-mono">{rule.id}</span> is proposed, and it fits. Approving it
                would have hidden this alert.
              </>
            ) : (
              <>
                <span className="mn-mono">{rule.id}</span> is proposed, and it fits. Approving it would hide alerts like this one.
              </>
            )}
          </span>
          <button className="mn-link" onClick={() => onOpenRule(rule.id)}>
            Review
          </button>
        </div>
      )}

      <ol className="al-steps">
        <li>
          <div className="al-step-head">
            <strong>Received</strong>
            <time className="mn-mono mn-subtle">{clockFace(alert.at)}</time>
          </div>
          <p>
            {alert.source} raised it on <span className="mn-mono">{alert.ci}</span>.
          </p>
        </li>
        <li>
          <div className="al-step-head">
            <strong>Rules checked</strong>
          </div>
          {rule ? (
            <p>
              {hidden ? 'It fits ' : 'No active rule fits. It would fit '}
              <button className="al-rule-link" onClick={() => onOpenRule(rule.id)}>
                <span className="mn-mono">{rule.id}</span> {rule.name}
                <ArrowUpRight size={12} />
              </button>
              {hidden ? ', which is active.' : `, which is ${statusLabel(rule).toLowerCase()}.`}
            </p>
          ) : (
            <p>
              Checked against {activeRules} active {activeRules === 1 ? 'rule' : 'rules'}. None fit, and none are proposed for it.
            </p>
          )}
        </li>
        <li data-outcome={alert.outcome}>
          <div className="al-step-head">
            <strong>{OUTCOME_LABEL[alert.outcome]}</strong>
          </div>
          <p>
            {hidden && 'It stopped here. No incident was opened and nobody was told.'}
            {alert.outcome === 'folded' && (
              <>
                Added to <span className="mn-mono">{alert.incidentId}</span>, which was already open. Nobody was paged again.
              </>
            )}
            {alert.outcome === 'paged' && (
              <>
                Opened <span className="mn-mono">{alert.incidentId}</span> for {group.name}. The on-call was paged.
              </>
            )}
          </p>
        </li>
      </ol>
    </section>
  );
}
