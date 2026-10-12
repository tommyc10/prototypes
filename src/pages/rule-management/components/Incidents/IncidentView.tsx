/* One incident, opened from any incident row. It's a popup over the page, so the rule stays
 * where it was underneath, and it answers the reviewer's question: was this noise, or a
 * real incident the rule would have hidden?
 *
 *   journey   the incident as the line it travelled, from the first alert to the moment it
 *             closed, with the time between each step. The verdict is where the line ends.
 *   columns   under the line: why the rule matched, how it ended, the CI's other incidents
 *
 * Nothing is in a card: the line carries the story and hairlines divide the rest.
 *
 * The popup is the browser's own <dialog>, opened with showModal(). That gives us, for free:
 * focus kept inside it, Esc to close, the page behind made unclickable, and a ::backdrop
 * to dim it. The action buttons stay in the header, so the decision is one click away. */

import { useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { AlertTriangle, BellOff, ChevronLeft, ChevronRight, Wrench, X, type LucideIcon } from 'lucide-react';
import { clockTime, duration, shortDate } from '../../../../lib/format';
import { allIncidents, groupById, incidentDetail } from '../../data/mockData';
import { RESOLUTION_LABEL } from '../../model/labels';
import type { RelatedIncident, Rule, RuleAction } from '../../model/types';
import { ActionButtons } from '../common/ActionButtons';
import './IncidentsPanel.css'; // the header row is shared with the incident list
import './IncidentView.css';

/** How many other incidents on the same CI to list. */
const ALSO_SHOWN = 4;

/** How long the popup takes to fade out; the exit in IncidentView.css is the same length. */
const EXIT_MS = 150;

export function IncidentView({
  rule,
  incident,
  onOpen,
  onStep,
  onAction,
  actions,
  onClose,
}: {
  rule: Rule;
  incident: RelatedIncident;
  /** Open another incident in its place (the "also on this CI" rows). */
  onOpen: (incident: RelatedIncident) => void;
  /** Move to the next (1) or previous (-1) of the rule's incidents, without closing. */
  onStep: (by: number) => void;
  onAction: (action: RuleAction) => void;
  /** Buttons to show in place of the rule's own (a suggestion's Propose and Dismiss). */
  actions?: ReactNode;
  onClose: () => void;
}) {
  const group = groupById(rule.groupId);
  const detail = useMemo(() => incidentDetail(rule, incident), [rule, incident]);
  const sameCi = useMemo(
    () => allIncidents(rule).filter((i) => i.ci === incident.ci && i.id !== incident.id),
    [rule, incident],
  );
  const { events } = detail;
  const verdict = verdictFor(incident, rule.status === 'active' ? 'hides' : 'would hide');
  // Where it sits among the rule's sample; -1 for one opened from "also on this CI".
  const position = rule.related.findIndex((i) => i.id === incident.id);

  // Open as a modal when it appears. Closing it before it's removed hands focus back to the row.
  // Focus starts on Close, not on Approve: a stray Enter shouldn't begin a decision.
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const leaving = useRef<number | undefined>(undefined);
  useLayoutEffect(() => {
    const el = dialog.current!;
    el.showModal();
    closeButton.current?.focus();
    return () => {
      clearTimeout(leaving.current);
      el.close();
    };
  }, []);

  // Closed with the pointer: it fades out the way it came, then the page is told. Esc, and
  // Enter on Close, skip this: what the keyboard closes goes at once.
  const dismiss = () => {
    const el = dialog.current!;
    if (!el.open) return;
    el.close();
    leaving.current = window.setTimeout(onClose, EXIT_MS);
  };
  // Another incident opened in its place while it was fading out: it stays.
  useLayoutEffect(() => {
    const el = dialog.current!;
    if (el.open) return;
    clearTimeout(leaving.current);
    el.showModal();
  }, [incident]);

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
      onClick={(e) => e.target === e.currentTarget && dismiss()}
    >
      <header className="mn-inc-head">
        <span className="mn-inc-pager">
          <button className="mn-icon-btn" onClick={() => onStep(-1)} disabled={position <= 0} aria-label="Previous incident" title="Previous (K)">
            <ChevronLeft size={15} />
          </button>
          <span>{position === -1 ? 'Same CI' : `${position + 1} of ${rule.related.length}`}</span>
          <button
            className="mn-icon-btn"
            onClick={() => onStep(1)}
            disabled={position === rule.related.length - 1}
            aria-label="Next incident"
            title="Next (J)"
          >
            <ChevronRight size={15} />
          </button>
        </span>
        <div className="mn-inc-title">
          <div className="mn-subtle mn-truncate">
            Matched by {rule.id} · {rule.name}
          </div>
        </div>
        <a className="mn-link" href={`#/incidents/${incident.id}`}>
          Its whole journey
        </a>
        <div className="mn-inc-actions">
          {actions ?? <ActionButtons rule={rule} onAction={onAction} />}
        </div>
        <button ref={closeButton} className="mn-icon-btn" onClick={(e) => (e.detail ? dismiss() : onClose())} aria-label="Close" title="Close (Esc)">
          <X size={15} />
        </button>
      </header>

      {/* `key` starts each incident scrolled to the top and draws its line afresh, without opening the popup again. */}
      <div className="mn-inc-body" key={incident.id}>
        <header className="mn-inc-top">
          <div>
            <div className="mn-inc-meta">
              <span className="mn-mono">{incident.id}</span>
              <span>
                <span className="mn-mono">{incident.ci}</span> · {group.name}, {group.unit} · {shortDate(incident.openedAt)}
              </span>
            </div>
            <h2 className="mn-title">{incident.title}</h2>
          </div>
          <span className="mn-badge" data-res={incident.resolution}>
            {RESOLUTION_LABEL[incident.resolution]}
          </span>
        </header>

        {/* One column per event, and a wider one for the last. Each stop draws the stretch of
            line that leads to the next, labelled with how long that stretch took. */}
        <ol
          className="mn-inc-journey"
          data-tone={verdict.tone}
          style={{ gridTemplateColumns: `repeat(${events.length - 1}, minmax(0, 1fr)) minmax(0, 1.4fr)` }}
        >
          {events.map((event, i) => {
            const last = i === events.length - 1;
            return (
              // The first event is the alert; from the second on, the incident is open.
              <li key={event.at + event.text} data-last={last || undefined} data-open={i >= 1 || undefined} style={{ '--i': i } as CSSProperties}>
                <span className="mn-inc-time">{clockTime(event.at)}</span>
                <span className="mn-inc-rail">
                  <span className="mn-inc-dot">{last && <verdict.Icon size={13} />}</span>
                  {!last && (
                    <>
                      <span className="mn-inc-line" />
                      <span className="mn-inc-gap">{between(event.at, events[i + 1].at)}</span>
                    </>
                  )}
                </span>
                {last ? (
                  <p className="mn-inc-verdict">
                    <strong>{verdict.strong}</strong> {verdict.rest}
                  </p>
                ) : (
                  <>
                    <strong>{event.actor}</strong>
                    <p>{event.text}</p>
                  </>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mn-inc-cols">
          <section>
            <h3>Why the rule matched</h3>
            {/* Each condition as the rule wrote it, then the value this incident had. */}
            <dl className="mn-inc-match">
              {detail.matched.map((c) => (
                <div key={c.field}>
                  <dt>
                    {c.field} {c.op} {c.value}
                  </dt>
                  <dd>{c.actual}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3>How it ended</h3>
            <p className="mn-inc-note">{detail.closeNote}</p>
            <dl className="mn-inc-facts">
              <div>
                <dt>Open for</dt>
                <dd data-bad={incident.resolution === 'escalated' || undefined}>
                  {duration(incident.minutesOpen)} <span>median {rule.evidence.medianClear}</span>
                </dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd data-bad={detail.priority <= 2 || undefined}>P{detail.priority}</dd>
              </div>
              <div>
                <dt>Alerts</dt>
                <dd>{detail.alertCount}</dd>
              </div>
              <div>
                <dt>Handled by</dt>
                <dd>{detail.handledBy}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3>
              Also on this CI <span className="mn-subtle">{sameCi.length}</span>
            </h3>
            {sameCi.length ? (
              <div className="mn-inc-also">
                {sameCi.slice(0, ALSO_SHOWN).map((other) => (
                  <button key={other.id} onClick={() => onOpen(other)}>
                    <span className="mn-mono">{other.id}</span>
                    <span className="mn-truncate">{other.title}</span>
                    <span data-bad={other.resolution === 'escalated' || undefined}>{RESOLUTION_LABEL[other.resolution]}</span>
                    <span>{shortDate(other.openedAt)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mn-inc-note">Nothing else on this CI matched the rule.</p>
            )}
          </section>
        </div>
      </div>
    </dialog>
  );
}

/** How long one stretch of the line took. Never less than a minute, so no stretch reads "0m". */
const between = (from: string, to: string) => duration(Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000)));

/** Where the line ends: what kind of incident this was, and what the rule does to it. */
function verdictFor(incident: RelatedIncident, hides: string): { tone?: 'bad'; Icon: LucideIcon; strong: string; rest: string } {
  const open = duration(incident.minutesOpen);
  if (incident.resolution === 'escalated') {
    return { tone: 'bad', Icon: AlertTriangle, strong: 'A real incident.', rest: `It was escalated and took ${open} to resolve. This rule ${hides} alerts like it.` };
  }
  if (incident.resolution === 'worked') {
    return { Icon: Wrench, strong: 'Someone had to work this.', rest: `A minor fault, fixed in ${open}. This rule ${hides} alerts like it.` };
  }
  return { Icon: BellOff, strong: 'Noise.', rest: `Closed after ${open} with nothing done. This is what the rule is meant to hide.` };
}
