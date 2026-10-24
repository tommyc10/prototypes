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
import { REACHED, STATIONS, STATION_ASKS, STATION_LABEL, clockFace, took } from '../../model/lifecycle';
import type { End, Lifecycle, StationId } from '../../model/types';
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

/** A word-sized shape: sits in the text's own line, so the line keeps its real height. */
const Word = ({ w }: { w: number | string }) => <span className="mn-skel ic-skel-text" style={{ width: w }} />;

/** The sections while the journey is on its way: one for each checkpoint the incident will
 *  turn out to have reached, each in the real section's layout and as tall as what lands in it.
 *  How it ended (the list row knows) decides both: how far it got, and what each section holds
 *  (a held incident's change window takes two lines, a suppressed one's rule shows its
 *  conditions, an enriched one has the ticket before and after, a delivered one its steps).
 *  The row also knows whether a rule fits it and whether it was real, so the rules section shows
 *  its conditions, and the warning, when they'll land. Opened by its number alone, nothing is
 *  known yet, so four plain sections stand in. */
export function StagesSkeleton({ end, rule, real }: { end?: End; rule?: boolean; real?: boolean }) {
  const count = end ? REACHED[end] : 4;
  // Lines of finding per checkpoint, and what else lands under them.
  const lines: Record<StationId, number> = {
    raised: 2,
    windows: end === 'held' ? 2 : 1,
    rules: rule ? 2 : 1,
    duplicates: end === 'folded' ? 2 : 1,
    enrichment: 2,
    delivered: 1,
  };
  const extra: Partial<Record<StationId, ReactNode>> = {
    rules: rule && (
      <>
      <dl className="ic-match">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <dt>
              <Word w={150 - i * 30} />
            </dt>
            <dd>
              <Word w={90 + i * 20} />
            </dd>
          </div>
        ))}
      </dl>
      {real && (
        <div className="ic-callout">
          <span className="mn-skel" data-shape="pill" style={{ width: 14, height: 14 }} />
          <span className="ic-skel-para">
            <span className="mn-skel" style={{ width: '96%' }} />
            <span className="mn-skel" style={{ width: '62%' }} />
          </span>
        </div>
      )}
      </>
    ),
    enrichment: (end === 'enriching' || end === 'delivered') && (
      <div className="ic-diff">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className={i === 0 ? 'ic-diff-head' : undefined}>
            <span>
              <Word w={i === 0 ? 34 : 70 + ((i * 17) % 40)} />
            </span>
            <span>
              <Word w={i === 0 ? 60 : 56 + ((i * 11) % 30)} />
            </span>
            <span>
              <Word w={i === 0 ? 96 : `${50 + ((i * 23) % 40)}%`} />
            </span>
          </div>
        ))}
      </div>
    ),
    delivered: (
      <ol className="ic-steps">
        {[0, 1].map((i) => (
          <li key={i}>
            <time>
              <Word w={40} />
            </time>
            <span>
              <Word w={200 - i * 40} />
            </span>
          </li>
        ))}
      </ol>
    ),
  };

  return (
    <div className="ic-stages" data-skeleton data-tour="ic-stages" aria-hidden>
      {STATIONS.slice(0, count).map((station, i) => (
        <section key={station}>
          <header>
            <span className="ic-stage-number mn-skel" data-shape="pill" />
            <h3>
              <Word w={STATION_LABEL[station].length * 8.6} />
            </h3>
            <span className="ic-stage-asks">
              <Word w={Math.min(260, STATION_ASKS[station].length * 6.2)} />
            </span>
            <time>
              <Word w={52} />
            </time>
          </header>
          <div className="ic-stage-body">
            <div className="ic-skel-para">
              <span className="mn-skel" style={{ width: lines[station] > 1 ? '94%' : `${70 + ((i * 13) % 20)}%` }} />
              {lines[station] > 1 && <span className="mn-skel" style={{ width: `${48 + ((i * 17) % 30)}%` }} />}
              {/* On a narrow pane the words wrap to one line more. */}
              <span className="mn-skel ic-skel-narrow" style={{ width: `${36 + ((i * 19) % 30)}%` }} />
            </div>
            {extra[station]}
          </div>
        </section>
      ))}
      {count < STATIONS.length && (
        <p className="ic-unreached">
          <Word w={280} />
        </p>
      )}
    </div>
  );
}
