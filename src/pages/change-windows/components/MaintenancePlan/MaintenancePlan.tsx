/* The picked window's maintenance plan, in the rail.
 *
 * A window on its own only says what work is planned; it holds nothing back. A plan is what
 * softens the tickets filed against what the window covers while the work runs. So this
 * section says what happens to those tickets now:
 *
 *   no plan   they page as usual, and how many have so far. The one white button: Plan
 *             maintenance (M), which opens the form in place of the section.
 *   a plan    what it does, in one sentence; who set it and why; its tally; and every ticket
 *             filed against the window with what the plan made of it. A held one can be sent
 *             to the queue early. If the work outruns the plan, it says so: new tickets page
 *             again, and another hour is one press away.
 *
 * Softened, never hidden: every ticket stays filed and listed here, and a P1 always pages. */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { usePlansStore } from '../../hooks/usePlansStore';
import type { PlanForm } from '../../hooks/usePlanForm';
import { FATE_TONE, SOFT, fades, planEnd, planLive, planStart, tallyOf, verdictOf, workEnd, workLevel, type Fate, type Tally } from '../../model/plans';
import type { ChangeWindow, MaintenancePlan as Plan, PlanTicket } from '../../model/types';
import { HOUR, UNASSIGNED, groupOf, hourLabel, howLong, inPlace, when } from '../../model/windows';
import { PlanFormView } from './PlanForm';
import './MaintenancePlan.css';

/** How many tickets to list before "Show all". */
const SHOWN = 6;

export function MaintenancePlan({ window: w, plan, tickets, now, form }: { window: ChangeWindow; plan?: Plan; tickets: PlanTicket[]; now: number; form: PlanForm }) {
  const { end, cancel, extend, send } = usePlansStore();
  const [all, setAll] = useState(false);
  const group = groupOf(w.groupId);
  const grouped = group.id !== UNASSIGNED;

  if (form.windowKey === w.key && form.draft) {
    return (
      <section className="cw-plan" data-tour="cw-plan" aria-label="Maintenance plan">
        <PlanFormView window={w} form={form} tickets={tickets} now={now} />
      </section>
    );
  }

  const live = !!plan && planLive(plan, now);
  const before = !!plan && now < planStart(plan);
  const shown = all ? tickets : tickets.slice(0, SHOWN);

  return (
    <section className="cw-plan" data-tour="cw-plan" aria-label="Maintenance plan">
      <div className="cw-plan-head">
        <h3>Maintenance plan</h3>
        {plan && <span className="mn-mono mn-subtle">{plan.id}</span>}
        {plan && <PlanState plan={plan} now={now} />}
        <span className="cw-plan-grow" />
        {plan && (live || before) && (
          <>
            <button className="mn-btn mn-btn-ghost" onClick={() => form.open(w, plan, now, 'pointer')}>
              Change
            </button>
            {before ? (
              <button className="mn-btn" onClick={() => cancel(w.key)}>
                Cancel plan
              </button>
            ) : (
              <button className="mn-btn" onClick={() => end(w.key, now)}>
                End plan
              </button>
            )}
          </>
        )}
      </div>

      {!plan &&
        (w.closedAt ? (
          <p className="cw-plan-say">
            No plan covered it, so {tickets.length ? <>its <b>{tickets.length}</b> {tickets.length === 1 ? 'ticket' : 'tickets'} paged as usual</> : 'anything filed would have paged as usual'}.
          </p>
        ) : (
          <>
            <p className="cw-plan-say">
              No plan, so tickets filed against <span className="mn-mono cw-plan-ci">{w.cis}</span> page {grouped ? <b>{group.name}</b> : 'someone'} as usual.
              {tickets.length > 0 && (
                <>
                  {' '}
                  So far in this window, <b>{tickets.length}</b> {tickets.length === 1 ? 'has' : 'have'}.
                </>
              )}
            </p>
            <button className="mn-btn cw-plan-start" data-variant="primary" onClick={() => form.open(w, undefined, now, 'pointer')}>
              Plan maintenance <kbd>M</kbd>
            </button>
          </>
        ))}

      {plan && (
        <>
          <p className="cw-plan-say">
            <Summary plan={plan} now={now} queue={grouped ? `the ${group.name} queue` : 'the queue'} />
          </p>
          <p className="cw-plan-by">
            Set by {plan.by}: “{plan.reason}”
          </p>

          {/* The work outlived the plan: say so, because new tickets page again. */}
          {inPlace(w, now) && now >= workEnd(plan) && (
            <div className="cw-callout cw-plan-late">
              <AlertTriangle size={14} />
              <span>
                <strong>The work is running late.</strong> The plan stopped softening at {hourLabel(workEnd(plan))}, so new tickets page as usual.
              </span>
              <button className="mn-btn" onClick={() => extend(w.key, now, HOUR)}>
                Extend an hour
              </button>
            </div>
          )}

          {!before && <TallyWell tally={tallyOf(tickets, plan, now)} live={live} />}
        </>
      )}

      {tickets.length > 0 && (
        <>
          <ul className="cw-tickets" aria-label="Tickets filed against it">
            {shown.map((t) => (
              <TicketRow key={t.id} ticket={t} plan={plan} now={now} onSend={() => send(w.key, t.id, now)} />
            ))}
          </ul>
          {tickets.length > SHOWN && (
            <button className="mn-btn mn-btn-ghost cw-tickets-more" onClick={() => setAll(!all)}>
              {all ? 'Show fewer' : `Show all ${tickets.length}`}
            </button>
          )}
        </>
      )}

      {(plan || !w.closedAt) && <p className="cw-plan-never">Every ticket is still filed and can be found. Nothing is hidden, and a P1 always pages.</p>}
    </section>
  );
}

/** Where the plan is in its life, as a badge. */
function PlanState({ plan, now }: { plan: Plan; now: number }) {
  const label =
    now < planStart(plan) ? `Starts ${when(planStart(plan), now)}` : now >= planEnd(plan) ? 'Ended' : now >= workEnd(plan) ? 'Fading out' : 'In place';
  const tone = planLive(plan, now) ? 'green' : undefined;
  return (
    <span className="cw-plan-state">
      <i className="cw-plan-dot" data-tone={tone} aria-hidden />
      {label}
    </span>
  );
}

/** What the plan does, as a sentence, in the tense of where it is in its life. */
function Summary({ plan, now, queue }: { plan: Plan; now: number; queue: string }) {
  const tense = now < planStart(plan) ? 'future' : now < workEnd(plan) ? 'now' : 'past';
  const soft = workLevel(plan, now);
  const cis = <span className="mn-mono cw-plan-ci">{plan.cis.join(', ')}</span>;
  const until = <b>{when(workEnd(plan), now)}</b>;
  const holds = plan.stretches.some((s) => s.soft === 'hold');
  const settle = plan.settle ? howLong(plan.settle) : '';

  const opening =
    tense === 'future' ? (
      <>
        From {when(planStart(plan), now)} until {until}, tickets filed against {cis} will be {SOFT[soft].is}, and nobody will be paged.
      </>
    ) : tense === 'now' ? (
      <>
        Until {until}, tickets filed against {cis} are {SOFT[soft].is}, and nobody is paged.
      </>
    ) : (
      <>
        From {hourLabel(planStart(plan))} to {until}, tickets filed against {cis} were {SOFT[soft].was}, and nobody was paged.
      </>
    );

  return (
    <>
      {opening}
      {fades(plan) &&
        (now >= planEnd(plan)
          ? ' For half an hour after, new ones were marked as expected.'
          : tense === 'past'
            ? ` Until ${hourLabel(planEnd(plan))}, new ones are marked as expected while it fades out.`
            : ' Then for half an hour, new ones are marked as expected.')}
      {holds &&
        (tense === 'past'
          ? ` Anything still held when the work ended ${settle ? `got ${settle} to clear on its own, then went` : 'went straight'} to ${queue}.`
          : ` Anything still held when the work ends ${settle ? `gets ${settle} to clear on its own, then goes` : 'goes straight'} to ${queue}.`)}
    </>
  );
}

/** The plan's tally: a metric well, with only the numbers that matter in their colour. */
function TallyWell({ tally, live }: { tally: Tally; live: boolean }) {
  const cells: { label: string; n: number; tone?: string }[] = [
    { label: 'Filed in the plan', n: tally.filed },
    { label: live ? 'Held now' : 'Held', n: tally.held, tone: tally.held ? 'amber' : undefined },
    { label: 'Cleared on their own', n: tally.cleared },
    { label: 'Sent to the queue', n: tally.sent, tone: tally.sent ? 'orange' : undefined },
    { label: 'P1, paged anyway', n: tally.paged, tone: tally.paged ? 'red' : undefined },
  ];
  if (tally.marked + tally.lowered) cells.splice(2, 0, { label: 'Marked or lowered', n: tally.marked + tally.lowered });
  return (
    <div className="cw-plan-well" role="group" aria-label="What the plan has done">
      {cells.map((c) => (
        <div key={c.label}>
          <b data-tone={c.tone}>{c.n}</b>
          <span>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

/** One line on what became of a ticket, e.g. "Held until 18:30". */
function fateLine(t: PlanTicket, plan: Plan | undefined, now: number) {
  const v = verdictOf(t, plan, now);
  const said: Record<Fate, string> = {
    pages: 'Paged as usual',
    paged: 'P1, paged anyway',
    marked: 'In the queue, marked',
    lowered: `In the queue at P${Math.min(4, t.priority + 1)}`,
    held: `Held until ${hourLabel(v.at ?? now)}`,
    cleared: `Cleared on its own after ${howLong((v.at ?? now) - t.filedAt)}`,
    sent: `Sent to the queue at ${hourLabel(v.at ?? now)}`,
  };
  return said[v.fate];
}

function TicketRow({ ticket: t, plan, now, onSend }: { ticket: PlanTicket; plan?: Plan; now: number; onSend: () => void }) {
  const v = verdictOf(t, plan, now);
  return (
    <li className="cw-ticket" data-fate={v.fate}>
      <i className="cw-plan-dot" data-tone={FATE_TONE[v.fate]} aria-hidden />
      <span className="cw-ticket-main">
        <span className="cw-ticket-title mn-truncate">{t.title}</span>
        <span className="cw-ticket-meta mn-truncate">
          <span className="mn-mono">{t.id}</span> · P{t.priority} · filed {hourLabel(t.filedAt)}
        </span>
      </span>
      <span className="cw-ticket-fate" data-tone={FATE_TONE[v.fate]}>
        {fateLine(t, plan, now)}
      </span>
      {v.fate === 'held' && (
        <button className="mn-btn mn-btn-ghost cw-ticket-send" onClick={onSend} title="Send it to the queue now">
          Send now
        </button>
      )}
    </li>
  );
}
