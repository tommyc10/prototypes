/* Rail: the plan is a section of the window.
 *
 * The window's page gains one section, "Maintenance plan". With no plan, it says what happens
 * now (tickets page as usual) and offers the one white button: Plan maintenance (M). That
 * opens the decision form over the pane, the same glass form the Rules page uses, filled in
 * from the window: what it covers, until its planned end, held, half an hour to settle. Its
 * well says what the plan would have done had it been in place since the window started.
 *
 * Once it's in place, the section shows the plan in one sentence, its tally, and every ticket
 * filed against the window with what the plan made of it. Held ones can be sent on early. */

import { useState } from 'react';
import { AlertTriangle, CornerDownLeft, Plus, X } from 'lucide-react';
import { useKeyboardShortcuts } from '../../../src/hooks/useKeyboardShortcuts';
import { groupOf, hourLabel, howLong, inPlace } from '../../../src/pages/change-windows/model/windows';
import { HOUR, MIN_REASON, MINUTE, SOFT, draftFor, extended, filedFor, nextPlanId, oneLevel, planEnd, planLive, planStart, tallyOf, withEnd, type Plan } from '../model';
import { Never, ReasonField, Seg, SettleSeg, SoftSeg, TallyWell, TicketRow, WindowHead, planToast, useFresh, type VariantProps } from '../shared';

export function Rail(props: VariantProps) {
  const { window: w, now, plan, onSave, onEnd, onSend, shortcuts, user } = props;
  const [draft, setDraft] = useState<{ plan: Plan; via: 'key' | 'pointer'; attempted: boolean } | null>(null);
  // A new window closes the form.
  const [formFor, setFormFor] = useState(w.key);
  if (formFor !== w.key) {
    setFormFor(w.key);
    setDraft(null);
  }

  const tickets = filedFor(w, now);
  const fresh = useFresh(tickets.map((t) => t.id));
  const group = groupOf(w.groupId);
  const live = plan && planLive(plan, now);

  const open = (via: 'key' | 'pointer') => {
    const start = plan && live ? plan : draftFor(w, now, user);
    if (start) setDraft({ plan: start, via, attempted: false });
  };
  const submit = () => {
    if (!draft) return;
    if (draft.plan.reason.trim().length < MIN_REASON) return setDraft({ ...draft, attempted: true });
    const saved = { ...draft.plan, id: draft.plan.id || nextPlanId() };
    onSave(saved);
    planToast(saved, w, draft.plan.id ? 'changed' : 'started');
    setDraft(null);
  };

  useKeyboardShortcuts({
    ...shortcuts,
    keys: { ...shortcuts.keys, m: () => open('key') },
    decisionOpen: !!draft,
    onCancelDecision: () => setDraft(null),
    onSubmitDecision: submit,
  });

  return (
    <div className="mp-scroll" data-composing={draft ? true : undefined}>
      <div className="mp-col">
        <WindowHead window={w} now={now} />

        <section className="mp-card mp-rail" aria-label="Maintenance plan">
          <div className="mp-card-head">
            <h3>Maintenance plan</h3>
            {plan && <span className="mn-mono mn-subtle">{plan.id}</span>}
            {plan && (
              <span className="mp-state" data-live={live || undefined}>
                <i className="mp-dot" data-tone={live ? 'green' : 'plain'} aria-hidden />
                {live ? 'In place' : now < planStart(plan) ? 'Starts ' + hourLabel(planStart(plan)) : 'Ended'}
              </span>
            )}
            <span className="mp-grow" />
            {plan && live && (
              <>
                <button className="mn-btn mn-btn-ghost" onClick={() => open('pointer')}>
                  Change
                </button>
                <button className="mn-btn" onClick={() => onEnd(w.key)}>
                  End plan
                </button>
              </>
            )}
          </div>

          {!plan &&
            (w.closedAt ? (
              <p className="mp-say">It has ended. A plan can only cover work still to come.</p>
            ) : (
              <>
                <p className="mp-say">
                  No plan. Tickets filed against <span className="mn-mono mp-em">{w.cis}</span> page <b>{group.name}</b> as usual.
                  {tickets.length > 0 && (
                    <>
                      {' '}
                      So far in this window, <b>{tickets.length}</b> {tickets.length === 1 ? 'ticket has' : 'tickets have'} paged someone.
                    </>
                  )}
                </p>
                {/* One white button at a time: the form's own takes over while it's open. */}
                {!draft && (
                  <button className="mn-btn mp-start" data-variant="primary" onClick={() => open('pointer')}>
                    Plan maintenance <kbd>M</kbd>
                  </button>
                )}
              </>
            ))}

          {plan && (
            <>
              <p className="mp-say">
                {SOFT[plan.stretches[0].soft][live ? 'doing' : 'done']} tickets for <span className="mn-mono mp-em">{plan.cis.join(', ')}</span> from {hourLabel(planStart(plan))} until{' '}
                <b>{hourLabel(planEnd(plan))}</b>
                {plan.stretches.some((s) => s.soft === 'hold') && plan.settle > 0 && <>, then {howLong(plan.settle)} for held ones to clear on their own</>}. Set by{' '}
                {plan.by}: <q>{plan.reason}</q>
              </p>

              {/* The work outlived the plan: say so, because new tickets page again. */}
              {inPlace(w, now) && now >= planEnd(plan) && (
                <div className="cw-callout mp-late">
                  <AlertTriangle size={14} />
                  <span>
                    <strong>The work is running late.</strong> The plan ended at {hourLabel(planEnd(plan))}, so new tickets page as usual.
                  </span>
                  <button className="mn-btn" onClick={() => onSave(extended(plan, now, HOUR))}>
                    Extend an hour
                  </button>
                </div>
              )}

              <TallyWell tally={tallyOf(tickets, plan, now)} live={!!live} />
            </>
          )}

          {tickets.length > 0 && (
            <ul className="mp-tickets">
              {tickets.map((t) => (
                <TicketRow key={t.id} ticket={t} plan={plan} now={now} fresh={fresh(t.id)} onSend={() => onSend(w.key, t.id)} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {draft && <PlanForm {...props} draft={draft} onChange={(p) => setDraft({ ...draft, plan: p })} onCancel={() => setDraft(null)} onSubmit={submit} />}
    </div>
  );
}

/** The decision form, filled in from the window. */
function PlanForm({
  window: w,
  now,
  draft,
  onChange,
  onCancel,
  onSubmit,
}: VariantProps & {
  draft: { plan: Plan; via: 'key' | 'pointer'; attempted: boolean };
  onChange: (p: Plan) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const { plan } = draft;
  const [adding, setAdding] = useState('');
  const soft = plan.stretches[0].soft;
  // What it would have done, had it been in place since the window started.
  const since = { ...plan, stretches: plan.stretches.map((s, i) => (i === 0 ? { ...s, from: Math.min(s.from, w.start) } : s)) };
  const would = tallyOf(filedFor(w, now), since, now);
  // The window's planned end (or an hour on, if the work is already past it), a little later,
  // and wherever the plan ends now if it's none of those.
  const base = w.plannedEnd > planStart(plan) ? w.plannedEnd : planStart(plan) + HOUR;
  const ends = [...new Set([base, ...[30, 60, 120].map((m) => base + m * MINUTE), planEnd(plan)])].sort((a, b) => a - b);

  return (
    <form
      className="mn-composer mp-form"
      data-animate={draft.via === 'pointer' || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="mn-composer-head">
        <div>
          <div className="mn-composer-title">
            {plan.id ? `Change ${plan.id}` : 'Plan maintenance'} for {w.id}
          </div>
          <div className="mn-subtle">Softens tickets for {groupOf(w.groupId).name} while the work runs</div>
        </div>
        <div className="mn-backtest" aria-live="polite">
          <div>
            <b>{would.held + would.cleared + would.sent}</b>
            <span>would be held, since {hourLabel(w.start)}</span>
          </div>
          <div data-bad={would.paged > 0 || undefined}>
            <b>{would.paged}</b>
            <span>P1, would page</span>
          </div>
        </div>
      </div>

      <div className="mp-form-grid">
        <span className="mp-form-label">Covers</span>
        <div className="mp-chips">
          {plan.cis.map((ci) => (
            <span key={ci} className="mp-chip mn-mono">
              {ci}
              {plan.cis.length > 1 && (
                <button type="button" aria-label={`Remove ${ci}`} onClick={() => onChange({ ...plan, cis: plan.cis.filter((c) => c !== ci) })}>
                  <X size={11} />
                </button>
              )}
            </span>
          ))}
          <label className="mp-chip-add">
            <Plus size={12} />
            <input
              value={adding}
              placeholder="Add a CI"
              onChange={(e) => setAdding(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && adding.trim()) {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange({ ...plan, cis: [...new Set([...plan.cis, adding.trim()])] });
                  setAdding('');
                }
              }}
            />
          </label>
        </div>

        <span className="mp-form-label">Until</span>
        <div className="mp-form-row">
          <Seg
            label="Until"
            value={planEnd(plan)}
            options={ends.map((t) => ({ value: t, label: t === base ? hourLabel(t) : t > base && (t - base) % (30 * MINUTE) === 0 ? `+${howLong(t - base)}` : hourLabel(t) }))}
            onChange={(t) => onChange(withEnd(plan, t))}
          />
          <span className="mn-subtle">From {hourLabel(planStart(plan))}{planStart(plan) > w.start ? ', now' : ''}</span>
        </div>

        <span className="mp-form-label">How quiet</span>
        <div className="mp-form-row">
          <SoftSeg value={soft} onChange={(s) => onChange(oneLevel(plan, s))} />
          <span className="mp-form-says">{SOFT[soft].says}</span>
        </div>

        {soft === 'hold' && (
          <>
            <span className="mp-form-label">Settle time</span>
            <div className="mp-form-row">
              <SettleSeg value={plan.settle} onChange={(ms) => onChange({ ...plan, settle: ms })} />
              <span className="mp-form-says">{plan.settle ? `Held tickets get ${howLong(plan.settle)} after the work to clear on their own.` : 'Held tickets go to the queue the moment the work ends.'}</span>
            </div>
          </>
        )}
      </div>

      <ReasonField autoFocus={draft.via === 'key'} value={plan.reason} onChange={(reason) => onChange({ ...plan, reason })} attempted={draft.attempted} />

      <div className="mn-composer-foot">
        <Never />
        <button type="button" className="mn-btn mn-btn-ghost" onClick={onCancel}>
          Cancel <kbd>Esc</kbd>
        </button>
        <button type="submit" className="mn-btn" data-variant="primary">
          {plan.id ? 'Save plan' : 'Start plan'}
          <kbd>
            ⌘<CornerDownLeft size={11} />
          </kbd>
        </button>
      </div>
    </form>
  );
}
