/* One incident, opened from any incident row. It's a popup over the page, so the rule stays
 * where it was underneath, and it answers the reviewer's question: was this noise, or a
 * real incident the rule would have hidden?
 *
 *   verdict   one line: what kind of incident this was, and what the rule does to it
 *   stats     the four numbers, in the same cards the rule uses
 *   cards     why the rule matched, resolution, timeline, and the CI's other incidents
 *
 * The popup is the browser's own <dialog>, opened with showModal(). That gives us, for free:
 * focus kept inside it, Esc to close, the page behind made unclickable, and a ::backdrop
 * to dim it. The action buttons stay in the header, so the decision is one click away. */

import { useLayoutEffect, useMemo, useRef } from 'react';
import { AlertTriangle, BellOff, Server, Wrench, X } from 'lucide-react';
import { clockTime, duration, shortDate } from '../../../../lib/format';
import { allIncidents, groupById, incidentDetail } from '../../data/mockData';
import { RESOLUTION_LABEL } from '../../model/labels';
import type { RelatedIncident, Rule, RuleAction } from '../../model/types';
import { ActionButtons } from '../common/ActionButtons';
import { IncidentList } from './IncidentList';
import './IncidentsPanel.css'; // the header row is shared with the incident list
import '../RuleDetail/History.css'; // the timeline is the rule history's
import './IncidentView.css';

/** How many other incidents on the same CI to list. */
const ALSO_SHOWN = 5;

export function IncidentView({
  rule,
  incident,
  onOpen,
  onAction,
  onClose,
}: {
  rule: Rule;
  incident: RelatedIncident;
  /** Open another incident in its place (the "also on this CI" rows). */
  onOpen: (incident: RelatedIncident) => void;
  onAction: (action: RuleAction) => void;
  onClose: () => void;
}) {
  const group = groupById(rule.groupId);
  const detail = useMemo(() => incidentDetail(rule, incident), [rule, incident]);
  const sameCi = useMemo(
    () => allIncidents(rule).filter((i) => i.ci === incident.ci && i.id !== incident.id),
    [rule, incident],
  );
  const closedAt = detail.events[detail.events.length - 1].at;
  const hides = rule.status === 'active' ? 'hides' : 'would hide';

  // Open as a modal when it appears. Closing it before it's removed hands focus back to the row.
  // Focus starts on Close, not on Approve: a stray Enter shouldn't begin a decision.
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const el = dialog.current!;
    el.showModal();
    closeButton.current?.focus();
    return () => el.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="mn-inc-modal"
      aria-label={`Incident ${incident.id}`}
      // Esc: let the page close it, so React stays in charge of what's open.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click on the dimmed area lands on the dialog itself, not on anything inside it.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <header className="mn-inc-head">
        <div className="mn-inc-title">
          <div>Incident</div>
          <div className="mn-subtle mn-truncate">
            Matched by {rule.id} · {rule.name}
          </div>
        </div>
        <div className="mn-inc-actions">
          <ActionButtons rule={rule} onAction={onAction} />
        </div>
        <button ref={closeButton} className="mn-icon-btn" onClick={onClose} aria-label="Close" title="Close (Esc)">
          <X size={15} />
        </button>
      </header>

      {/* `key` starts each incident scrolled to the top, without opening the popup again. */}
      <div className="mn-inc-body" key={incident.id}>
        <div className="mn-inc-layout">
          <header className="mn-inc-top">
            <div className="mn-detail-top">
              <span className="mn-mono mn-subtle">{incident.id}</span>
              <span className="mn-badge" data-res={incident.resolution}>
                {RESOLUTION_LABEL[incident.resolution]}
              </span>
            </div>
            <h2 className="mn-title">{incident.title}</h2>
            <div className="mn-scope">
              <Server size={14} />
              <span className="mn-mono">{incident.ci}</span>
              <span className="mn-subtle">
                · {group.name} · {group.unit}
              </span>
              <span className="mn-sep" />
              Opened {shortDate(incident.openedAt)}, {clockTime(incident.openedAt)}
            </div>
          </header>

          <Verdict incident={incident} hides={hides} />

          <div className="mn-stats">
            <div className="mn-stat" data-tone={incident.resolution === 'escalated' ? 'bad' : undefined}>
              <div className="mn-stat-label">Open for</div>
              <div className="mn-stat-value">{duration(incident.minutesOpen)}</div>
              <div className="mn-stat-foot mn-subtle">rule median {rule.evidence.medianClear}</div>
            </div>
            <div className="mn-stat" data-tone={detail.priority <= 2 ? 'bad' : undefined}>
              <div className="mn-stat-label">Priority</div>
              <div className="mn-stat-value">P{detail.priority}</div>
              <div className="mn-stat-foot mn-subtle">when it closed</div>
            </div>
            <div className="mn-stat">
              <div className="mn-stat-label">Alerts</div>
              <div className="mn-stat-value">{detail.alertCount}</div>
              <div className="mn-stat-foot mn-subtle">folded into this incident</div>
            </div>
            <div className="mn-stat">
              <div className="mn-stat-label">On this CI</div>
              <div className="mn-stat-value">{sameCi.length + 1}</div>
              <div className="mn-stat-foot mn-subtle">{rule.evidence.window.toLowerCase()}</div>
            </div>
          </div>

          <section className="mn-inc-card" data-area="matched">
            <h3>Why the rule matched</h3>
            {/* Each condition as the rule wrote it, then the value this incident had. */}
            <dl className="mn-inc-match">
              {detail.matched.map((c) => (
                <div key={c.field}>
                  <dt>
                    {c.field} <span className="mn-subtle">{c.op}</span> {c.value}
                  </dt>
                  <dd>{c.actual}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mn-inc-card" data-area="timeline">
            <h3>Timeline</h3>
            <ol className="mn-timeline">
              {[...detail.events].reverse().map((event) => (
                <li key={event.at + event.text}>
                  <div className="mn-tl-head">
                    <strong>{event.actor}</strong>
                    <span className="mn-subtle mn-tl-time">{clockTime(event.at)}</span>
                  </div>
                  <p>{event.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mn-inc-card" data-area="resolution">
            <h3>Resolution</h3>
            <p className="mn-inc-note">{detail.closeNote}</p>
            <dl className="mn-inc-facts">
              <div>
                <dt>Outcome</dt>
                <dd>{RESOLUTION_LABEL[incident.resolution]}</dd>
              </div>
              <div>
                <dt>Closed</dt>
                <dd>
                  {shortDate(closedAt)}, {clockTime(closedAt)}
                </dd>
              </div>
              <div>
                <dt>Handled by</dt>
                <dd>{detail.handledBy}</dd>
              </div>
            </dl>
          </section>

          <section className="mn-inc-card" data-area="also">
            <h3>
              Also on this CI <span className="mn-subtle">{sameCi.length}</span>
            </h3>
            {sameCi.length ? (
              <IncidentList incidents={sameCi.slice(0, ALSO_SHOWN)} wide={false} onOpen={onOpen} />
            ) : (
              <p className="mn-inc-note">Nothing else on this CI matched the rule.</p>
            )}
          </section>
        </div>
      </div>
    </dialog>
  );
}

/** The one-line answer: what kind of incident this was, and what the rule does to it. */
function Verdict({ incident, hides }: { incident: RelatedIncident; hides: string }) {
  const open = duration(incident.minutesOpen);
  if (incident.resolution === 'escalated') {
    return (
      <div className="mn-inc-verdict" data-tone="bad">
        <AlertTriangle size={14} />
        <span>
          <strong>A real incident.</strong> It was escalated and took {open} to resolve. This rule {hides} alerts like it.
        </span>
      </div>
    );
  }
  if (incident.resolution === 'worked') {
    return (
      <div className="mn-inc-verdict">
        <Wrench size={14} />
        <span>
          <strong>Someone had to work this.</strong> A minor fault, fixed in {open}. This rule {hides} alerts like it.
        </span>
      </div>
    );
  }
  return (
    <div className="mn-inc-verdict">
      <BellOff size={14} />
      <span>
        <strong>Noise.</strong> Closed after {open} with nothing done. This is what the rule is meant to hide.
      </span>
    </div>
  );
}
