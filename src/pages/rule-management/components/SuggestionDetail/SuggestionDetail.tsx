/* The selected overnight suggestion. It is laid out exactly like a rule (see RuleDetail) and
 * built from the same sections, because it is the rule it would become. What differs is the
 * decision: propose it, which puts it in the queue for approval, or dismiss it. */

import type { ReactNode } from 'react';
import { AlertTriangle, Bot, ShieldCheck } from 'lucide-react';
import { ago } from '../../../../lib/format';
import { groupById } from '../../data/mockData';
import type { Suggested } from '../../hooks/useSuggestions';
import type { PaneMode } from '../../hooks/usePaneMode';
import { SOURCE_LABEL } from '../../model/labels';
import { canTighten, thresholdLabel } from '../../model/suggestions';
import type { RelatedIncident, Rule } from '../../model/types';
import { NightBars } from '../common/NightBars';
import { IncidentList } from '../Incidents/IncidentList';
import { AlsoInGroup } from '../RuleDetail/AlsoInGroup';
import { Evidence } from '../RuleDetail/Evidence';
import { ImpactCard } from '../RuleDetail/ImpactCard';
import { Stats } from '../RuleDetail/Stats';
import './SuggestionDetail.css';

export function SuggestionDetail({
  suggested: { suggestion, threshold, match, rule },
  rules,
  mode,
  toolbar,
  onPropose,
  onDismiss,
  onThreshold,
  onSelect,
  onOpenIncident,
}: {
  suggested: Suggested;
  rules: Rule[];
  mode: PaneMode;
  toolbar?: ReactNode;
  onPropose: () => void;
  onDismiss: () => void;
  /** Move the threshold; `null` puts it back where it was suggested. */
  onThreshold: (value: number | null) => void;
  onSelect: (id: string) => void;
  onOpenIncident: (incident: RelatedIncident) => void;
}) {
  const group = groupById(rule.groupId);
  const wide = mode !== 'narrow';
  const { safe, suggested } = suggestion.threshold;
  const tighten = canTighten(suggestion, match, threshold) && safe !== undefined ? () => onThreshold(safe) : null;

  const header = (
    <>
      <div className="mn-detail-top">
        {toolbar}
        <span className="mn-mono mn-subtle">{suggestion.id}</span>
        <span className="mn-badge">
          <span className="mn-dot" data-status="suggested" />
          Suggested
        </span>
      </div>
      <h2 className="mn-title">{suggestion.name}</h2>
      <div className="mn-scope">
        <ShieldCheck size={14} />
        Would be scoped to <strong>{group.name}</strong>
        <span className="mn-subtle">· {group.unit}</span>
        <span className="mn-sep" />
        {SOURCE_LABEL[suggestion.source]} · found in the 06:00 refresh
      </div>
    </>
  );

  const sections = (
    <>
      <Stats rule={rule} />
      <Evidence rule={rule} onOpenIncident={onOpenIncident} />
      <section className="mn-sec">
        <h3>
          When they came in last night <span className="mn-subtle">{match.matched.length} incidents</span>
        </h3>
        <NightBars halfHours={match.halfHours} />
      </section>
      <section className="mn-sec">
        <h3>
          Incidents it matched{' '}
          <span className="mn-subtle">
            {rule.related.length} of {match.matched.length}
          </span>
        </h3>
        <IncidentList incidents={rule.related} wide={wide} onOpen={onOpenIncident} />
      </section>
    </>
  );

  const buttons = <SuggestionButtons onPropose={onPropose} onDismiss={onDismiss} />;

  if (!wide) {
    return (
      <div className="mn-detail-inner">
        <div className="mn-detail-scroll" data-floating>
          {header}
          {sections}
        </div>
        <div className="mn-actionbar">
          <span className="mn-subtle mn-actionbar-note">Proposing adds it to the queue as {suggestion.ruleId}</span>
          {tighten && (
            <button className="mn-btn mn-btn-ghost" onClick={tighten}>
              Tighten
              <kbd>T</kbd>
            </button>
          )}
          {buttons}
        </div>
      </div>
    );
  }

  return (
    <div className="mn-detail-inner">
      <div className="mn-detail-scroll">
        <div className="mn-wide" data-mode="wide">
          <header className="mn-wide-head">{header}</header>
          <div className="mn-col">{sections}</div>
          <aside className="mn-rail" aria-label="Decision">
            <div className="mn-rail-card">
              <div className="mn-decide">
                <div className="mn-proposer">
                  <span className="mn-proposer-avatar" aria-hidden="true">
                    <Bot size={16} />
                  </span>
                  <div className="mn-proposer-text">
                    <div className="mn-proposer-name">{suggestion.sourceDetail}</div>
                    <div className="mn-subtle">Rule engine · found {ago(rule.createdAt)}</div>
                  </div>
                </div>
                <div className="mn-decide-title">Suggestion</div>
                <p>
                  Not a rule yet. Proposing adds it to the queue as <span className="mn-mono">{suggestion.ruleId}</span>, where it waits for approval
                  like any other.
                </p>
                <div className="mn-decide-actions">{buttons}</div>
                {tighten && safe !== undefined && (
                  <p className="mn-decide-note mn-suggest-risk">
                    <AlertTriangle size={13} />
                    <span>
                      It hides an incident that needed a person.{' '}
                      <button className="mn-link" onClick={tighten}>
                        Tighten to under {thresholdLabel(suggestion, safe)}
                      </button>{' '}
                      <kbd>T</kbd>
                    </span>
                  </p>
                )}
                <p className="mn-decide-foot">
                  {threshold === suggested ? (
                    `Seen on ${suggestion.nights} of the last 7 nights.`
                  ) : (
                    <>
                      Tightened from the suggested {thresholdLabel(suggestion, suggested)}.{' '}
                      <button className="mn-link" onClick={() => onThreshold(null)}>
                        Put it back
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
            <ImpactCard rule={rule} />
            <AlsoInGroup rule={rule} rules={rules} onSelect={onSelect} />
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Propose and Dismiss. Also used on an incident opened from a suggestion. */
export function SuggestionButtons({ onPropose, onDismiss }: { onPropose: () => void; onDismiss: () => void }) {
  return (
    <>
      <button className="mn-btn" data-variant="primary" onClick={onPropose}>
        Propose
        <kbd>P</kbd>
      </button>
      <button className="mn-btn" onClick={onDismiss}>
        Dismiss
        <kbd>X</kbd>
      </button>
    </>
  );
}
