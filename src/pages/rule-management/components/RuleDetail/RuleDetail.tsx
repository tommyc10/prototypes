/* The selected rule. Each section is built once, then arranged by the pane's width:
 *   narrow: one column, with a floating action bar at the bottom
 *   wide:   content, plus a decision rail on the right
 *   ultra:  two content columns (the full incident list gets its own), plus the rail */

import { ShieldCheck } from 'lucide-react';
import { groupById } from '../../data/mockData';
import type { Decision } from '../../hooks/useDecision';
import type { PaneMode } from '../../hooks/usePaneMode';
import { SOURCE_LABEL, statusLabel } from '../../model/labels';
import type { Rule, RuleAction } from '../../model/types';
import { ActionButtons } from '../common/ActionButtons';
import { WeeklyBars } from '../common/WeeklyBars';
import { Composer } from '../Composer/Composer';
import { IncidentBrowser } from '../Incidents/IncidentBrowser';
import { IncidentList } from '../Incidents/IncidentList';
import { AlsoInGroup } from './AlsoInGroup';
import { DecisionCard } from './DecisionCard';
import { Evidence } from './Evidence';
import { History } from './History';
import { ImpactCard } from './ImpactCard';
import { Stats } from './Stats';
import './RuleDetail.css';

export function RuleDetail({
  rule,
  rules,
  mode,
  decision,
  composerVia,
  onAction,
  onSelect,
  onViewIncidents,
}: {
  rule: Rule;
  rules: Rule[];
  mode: PaneMode;
  decision: Decision;
  composerVia: 'key' | 'pointer';
  onAction: (action: RuleAction) => void;
  onSelect: (id: string) => void;
  onViewIncidents: () => void;
}) {
  const group = groupById(rule.groupId);
  const wide = mode !== 'narrow';
  const composing = decision.target?.rule.id === rule.id ? decision.target : null;

  const header = (
    <>
      <div className="mn-detail-top">
        <span className="mn-mono mn-subtle">{rule.id}</span>
        <span className="mn-badge" data-status={rule.status}>
          <span className="mn-dot" data-status={rule.status} />
          {statusLabel(rule)}
        </span>
      </div>
      <h2 className="mn-title">{rule.name}</h2>
      <div className="mn-scope">
        <ShieldCheck size={14} />
        Scoped to <strong>{group.name}</strong>
        <span className="mn-subtle">· {group.unit}</span>
        <span className="mn-sep" />
        {rule.source === 'operator' ? rule.sourceDetail : `${SOURCE_LABEL[rule.source]} · ${rule.sourceDetail.split(' ').pop()}`}
      </div>
    </>
  );

  const volume = (
    <section className="mn-sec">
      <h3>
        Matched incidents per week <span className="mn-subtle">{rule.incidentCount} total</span>
      </h3>
      <WeeklyBars data={rule.evidence.weekly} height={mode === 'ultra' ? 120 : 72} />
    </section>
  );

  // With room to spare (ultra), show every incident inline instead of a sample behind "View all".
  const incidents =
    mode === 'ultra' ? (
      <section className="mn-sec">
        <h3>
          Matched incidents <span className="mn-subtle">{rule.incidentCount}</span>
        </h3>
        <IncidentBrowser key={rule.id} rule={rule} wide={false} pageSize={15} />
      </section>
    ) : (
      <section className="mn-sec">
        <h3>
          Related incidents
          <button className="mn-link" onClick={onViewIncidents}>
            View all {rule.incidentCount}
          </button>
        </h3>
        <IncidentList incidents={rule.related} wide={wide} />
      </section>
    );

  // `key` gives each rule-and-action its own fresh form.
  const composer = composing && (
    <Composer
      key={`${rule.id}-${composing.action}`}
      rule={rule}
      action={composing.action}
      decision={decision}
      via={composerVia}
      docked={wide}
    />
  );

  if (!wide) {
    return (
      <div className="mn-detail-inner">
        <div className="mn-detail-scroll" data-floating>
          {header}
          <Stats rule={rule} />
          <Evidence rule={rule} />
          {volume}
          {incidents}
          <History rule={rule} />
        </div>
        {composer || (
          <div className="mn-actionbar">
            <span className="mn-subtle mn-actionbar-note">Every change needs a written reason</span>
            <ActionButtons rule={rule} onAction={onAction} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mn-detail-inner">
      <div className="mn-detail-scroll">
        <div className="mn-wide" data-mode={mode}>
          <header className="mn-wide-head">{header}</header>
          {mode === 'ultra' ? (
            <>
              <div className="mn-col">
                <Stats rule={rule} />
                <Evidence rule={rule} />
                {volume}
              </div>
              <div className="mn-col">{incidents}</div>
            </>
          ) : (
            <div className="mn-col">
              <Stats rule={rule} />
              <Evidence rule={rule} />
              {volume}
              {incidents}
            </div>
          )}
          <aside className="mn-rail" aria-label="Decision">
            <div className="mn-rail-card">{composer || <DecisionCard rule={rule} onAction={onAction} />}</div>
            <ImpactCard rule={rule} />
            <History rule={rule} />
            <AlsoInGroup rule={rule} rules={rules} onSelect={onSelect} />
          </aside>
        </div>
      </div>
    </div>
  );
}
