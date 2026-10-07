/* The journey again, in full: one section per checkpoint the incident reached, in order,
 * with the evidence for what that checkpoint decided. The checkpoints it never reached
 * are a single line at the end, so the page is as long as the journey was.
 *
 * The enrichment section is the ticket before and after: what it said when it was raised,
 * and what the Imperial Ops team added. That's the work the page exists to show. */

import type { ReactNode } from 'react';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { groupById } from '../../../rule-management/data/mockData';
import { statusLabel } from '../../../rule-management/model/labels';
import { STATION_ASKS, STATION_LABEL, clockFace, took } from '../../model/lifecycle';
import type { Lifecycle, StationId } from '../../model/types';
import './Stages.css';

export function Stages({ life, activeRules, onOpenRule, onOpenWindow, onOpenIncident }: {
  life: Lifecycle;
  /** How many rules are switched on, for "checked against 8 active rules". */
  activeRules: number;
  onOpenRule: (ruleId: string) => void;
  onOpenWindow: (windowId: string) => void;
  onOpenIncident: (incidentId: string) => void;
}) {
  const { incident, rule, stations } = life;
  const group = groupById(life.groupId);
  const reached = stations.filter((s) => s.state !== 'unreached');
  const unreached = stations.filter((s) => s.state === 'unreached');

  const body: Record<StationId, ReactNode> = {
    raised: (
      <>
        <p>
          A monitor raised it on <span className="mn-mono">{incident.ci}</span> at P{life.raisedAt}, from {life.alertCount}{' '}
          {life.alertCount === 1 ? 'alert' : 'alerts'}. Nothing was known about it yet beyond its title and where it came from.
        </p>
      </>
    ),

    windows: life.window ? (
      <p>
        It was raised while{' '}
        <button className="ic-link" onClick={() => onOpenWindow(life.window!.id)}>
          <span className="mn-mono">{life.window.id}</span> {life.window.name}
          <ArrowUpRight size={12} />
        </button>{' '}
        was in place for {group.name}. Alerts from the things being worked on are expected, so it was held back and nobody was told.
      </p>
    ) : (
      <p>No change window covered {incident.ci} when it was raised, so this wasn't planned work.</p>
    ),

    rules: rule ? (
      <>
        <p>
          It fits{' '}
          <button className="ic-link" onClick={() => onOpenRule(rule.id)}>
            <span className="mn-mono">{rule.id}</span> {rule.name}
            <ArrowUpRight size={12} />
          </button>
          , which is {statusLabel(rule).toLowerCase()}.{' '}
          {rule.status === 'active' ? 'An active rule suppresses what it fits, so the journey ended here.' : 'Only an active rule suppresses, so it carried on.'}
        </p>
        {/* Each condition as the rule wrote it, then the value this incident had. */}
        <dl className="ic-match">
          {life.matched.map((c) => (
            <div key={c.field}>
              <dt>
                {c.field} <span className="mn-subtle">{c.op}</span> {c.value}
              </dt>
              <dd>{c.actual}</dd>
            </div>
          ))}
        </dl>
        {life.real && (
          <div className="ic-callout" data-tone={rule.status === 'active' ? 'bad' : undefined}>
            <AlertTriangle size={14} />
            <span>
              {rule.status === 'active' ? (
                <>
                  <strong>This was a real incident, and the rule hid it.</strong> Someone had to work it. The rule is matching more than noise.
                </>
              ) : (
                <>
                  <strong>This was a real incident.</strong> Had {rule.id} been active, it would have been suppressed here and never reached anyone.
                </>
              )}
            </span>
            <button className="mn-link" onClick={() => onOpenRule(rule.id)}>
              Review
            </button>
          </div>
        )}
      </>
    ) : (
      <p>
        Checked against {activeRules} active {activeRules === 1 ? 'rule' : 'rules'}. None fit, and none are proposed for it. Nothing says this is
        noise.
      </p>
    ),

    duplicates: life.foldedInto ? (
      <p>
        The same fault on the same CI was already open as{' '}
        <button className="ic-link" onClick={() => onOpenIncident(life.foldedInto!)}>
          <span className="mn-mono">{life.foldedInto}</span>
          <ArrowUpRight size={12} />
        </button>
        . This one was added to it instead of paging anyone a second time.
      </p>
    ) : (
      <p>Nothing like it was open on {incident.ci}, so it stood as its own incident.</p>
    ),

    enrichment: life.enrichment ? (
      <>
        <p>
          {life.enrichment.doneAt ? (
            <>
              It wasn't noise, so it went to the Imperial Ops team. <strong>{life.enrichment.by}</strong> enriched it in{' '}
              {took(life.enrichment.doneAt - life.enrichment.sentAt)}, so the owner got a ticket they could act on.
            </>
          ) : (
            <>
              It isn't noise, so it's with the Imperial Ops team. <strong>{life.enrichment.by}</strong> picked it up and is enriching it now.
            </>
          )}
        </p>
        {/* The ticket, before and after. */}
        <div className="ic-diff" role="table" aria-label="The ticket as raised, and after enrichment">
          <div className="ic-diff-head" role="row">
            <span role="columnheader">Field</span>
            <span role="columnheader">As raised</span>
            <span role="columnheader">After enrichment</span>
          </div>
          {life.enrichment.fields.map((field) => (
            <div key={field.label} role="row" data-waiting={field.after === undefined || undefined}>
              <span role="cell">{field.label}</span>
              <span role="cell">{field.before}</span>
              <span role="cell">{field.after ?? 'Not yet'}</span>
            </div>
          ))}
        </div>
      </>
    ) : (
      <p>
        It passed every check, but it cleared on its own after {took(incident.minutesOpen * 60_000)}, before anyone triaged it. Nothing was sent
        to the Imperial Ops team, because there was nothing left to enrich.
      </p>
    ),

    delivered: (
      <>
        <p>
          Handed to {group.name} at P{life.priority}, with everything the team added.
        </p>
        <ol className="ic-steps">
          {life.steps.map((step) => (
            <li key={step.at}>
              <time className="mn-mono">{clockFace(step.at)}</time>
              <span>
                <strong>{step.actor}</strong> {step.text}
              </span>
            </li>
          ))}
        </ol>
      </>
    ),
  };

  return (
    <div className="ic-stages" data-tour="ic-stages">
      {reached.map((station, i) => (
        <section key={station.id} id={`ic-${station.id}`} data-state={station.state}>
          <header>
            <span className="ic-stage-number">{i + 1}</span>
            <h3>{STATION_LABEL[station.id]}</h3>
            <span className="ic-stage-asks">{STATION_ASKS[station.id]}</span>
            <time className="mn-mono">{clockFace(station.at!)}</time>
          </header>
          <div className="ic-stage-body">{body[station.id]}</div>
        </section>
      ))}
      {unreached.length > 0 && (
        <p className="ic-unreached">
          Never reached: {unreached.map((s) => STATION_LABEL[s.id]).join(', ')}. {life.end === 'noise' ? 'There was nothing to deliver.' : 'The journey ended before them.'}
        </p>
      )}
    </div>
  );
}
