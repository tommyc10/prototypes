/* The maintenance plan form, in place of the plan section while it's open. Filled in from
 * the window: what it covers, held, fading out, half an hour to settle. It runs as long as
 * the window does, so there's no end to choose; the form only says when that is. The well
 * says what the plan would have done had it been in place since the window started, so the
 * choice is made against this window's own tickets. A reason is required.
 * Esc cancels and ⌘↵ submits, from the page's key listener; the state lives in usePlanForm. */

import { useState } from 'react';
import { Check, CornerDownLeft, Plus, X } from 'lucide-react';
import { MIN_REASON } from '../../../rule-management/model/policy';
import type { PlanForm } from '../../hooks/usePlanForm';
import { ENDINGS, MINUTE, SOFT, SOFTS, stretchesOf, tallyOf, type Ending } from '../../model/plans';
import type { ChangeWindow, PlanTicket, Soft } from '../../model/types';
import { UNASSIGNED, dayLabel, groupOf, hourLabel, howLong, statusOf, when } from '../../model/windows';
import '../../../rule-management/components/Composer/Composer.css';

const SETTLES = [0, 15, 30, 60].map((m) => m * MINUTE);

export function PlanFormView({ window: w, form, tickets, now }: { window: ChangeWindow; form: PlanForm; tickets: PlanTicket[]; now: number }) {
  const d = form.draft!;
  const [adding, setAdding] = useState('');
  const group = groupOf(w.groupId);
  const length = d.reason.trim().length;
  const bad = form.attempted && length < MIN_REASON;

  // What it would have done to this window's tickets, had it been in place since the window started.
  const since = { id: '', windowKey: w.key, cis: d.cis, stretches: stretchesOf({ ...d, from: Math.min(d.from, w.start) }), settle: d.settle, by: '', reason: '', sent: {} };
  const would = tallyOf(tickets, since, now);
  const started = statusOf(w, now) !== 'upcoming';

  const addCi = () => {
    const ci = adding.trim();
    if (ci) form.change({ cis: [...new Set([...d.cis, ci])] });
    setAdding('');
  };

  return (
    <form
      className="cw-plan-form"
      data-animate={form.via === 'pointer' || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        form.submit(now);
      }}
    >
      <div className="cw-plan-form-head">
        <div>
          <h3>{form.editing ? `Change ${form.editing.id}` : 'Plan maintenance'}</h3>
          <p>Softens tickets {group.id !== UNASSIGNED ? `for ${group.name} ` : ''}while the work runs</p>
        </div>
      </div>

      {started && tickets.length > 0 && (
        <div className="mn-backtest cw-plan-would" aria-live="polite">
          <div>
            <b>{would.held + would.cleared + would.sent}</b>
            <span>would have been held since {hourLabel(w.start)}</span>
          </div>
          <div data-bad={would.paged > 0 || undefined}>
            <b>{would.paged}</b>
            <span>P1, would page</span>
          </div>
        </div>
      )}

      <div className="cw-plan-field">
        <span className="cw-plan-label">Covers</span>
        <div className="cw-plan-chips">
          {d.cis.map((ci) => (
            <span key={ci} className="cw-plan-chip mn-mono">
              {ci}
              {d.cis.length > 1 && (
                <button type="button" aria-label={`Stop covering ${ci}`} onClick={() => form.change({ cis: d.cis.filter((c) => c !== ci) })}>
                  <X size={11} />
                </button>
              )}
            </span>
          ))}
          <label className="cw-plan-add">
            <Plus size={12} />
            <input
              value={adding}
              placeholder="Add a CI"
              aria-label="Add a CI to cover"
              onChange={(e) => setAdding(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
                  e.preventDefault();
                  addCi();
                }
              }}
              onBlur={addCi}
            />
          </label>
        </div>
      </div>

      {/* When it runs: the window's own time. Nothing to choose. */}
      <div className="cw-plan-field">
        <span className="cw-plan-label">Runs</span>
        <span className="cw-plan-runs">
          {d.until === w.plannedEnd ? (
            <>
              With the window, from <b>{when(d.from, now)}</b>
              {d.from > w.start ? ' (now)' : ''} to <b>{dayLabel(d.until) === dayLabel(d.from) ? hourLabel(d.until) : when(d.until, now)}</b>, its planned end.
            </>
          ) : w.plannedEnd <= now ? (
            <>
              The work is already past its planned end, so it runs for an hour, to <b>{when(d.until, now)}</b>. Extend it if the work goes on.
            </>
          ) : (
            <>
              From <b>{when(d.from, now)}</b> to <b>{when(d.until, now)}</b>, extended past the window's planned end.
            </>
          )}
          {d.from > w.start && !form.editing && ' Tickets already filed have paged and stay as they are.'}
        </span>
      </div>

      <div className="cw-plan-field">
        <span className="cw-plan-label">How quiet</span>
        <Seg label="How quiet" value={d.soft} options={SOFTS.map((s) => ({ value: s, label: SOFT[s].label }))} onChange={(soft: Soft) => form.change({ soft })} />
        <span className="cw-plan-says">{SOFT[d.soft].says}</span>
      </div>

      {d.soft !== 'mark' && (
        <div className="cw-plan-field">
          <span className="cw-plan-label">When the work ends</span>
          <Seg label="When the work ends" value={d.ending} options={ENDINGS.map((e) => ({ value: e.value, label: e.label }))} onChange={(ending: Ending) => form.change({ ending })} />
          <span className="cw-plan-says">{ENDINGS.find((e) => e.value === d.ending)!.says}</span>
        </div>
      )}

      {d.soft === 'hold' && (
        <div className="cw-plan-field">
          <span className="cw-plan-label">Settle time</span>
          <Seg label="Settle time" value={d.settle} options={SETTLES.map((ms) => ({ value: ms, label: ms ? howLong(ms) : 'None' }))} onChange={(settle) => form.change({ settle })} />
          <span className="cw-plan-says">
            {d.settle ? `Held tickets get ${howLong(d.settle)} after the work to clear on their own before going to the queue.` : 'Held tickets go to the queue the moment the work ends.'}
          </span>
        </div>
      )}

      <label className="mn-field">
        <textarea
          autoFocus={form.via === 'key'}
          rows={2}
          value={d.reason}
          onChange={(e) => form.change({ reason: e.target.value })}
          placeholder={form.editing ? 'Why change it?' : 'What is the work, and what will it set off?'}
          aria-label="Reason"
          aria-invalid={bad || undefined}
        />
        <span className="mn-field-foot">
          {bad ? <span className="mn-bad">Say what the work is in at least {MIN_REASON} characters.</span> : <span className="mn-subtle">Required · saved to the audit log with your name</span>}
          <span className="mn-counter" data-ok={length >= MIN_REASON || undefined}>
            {length >= MIN_REASON ? <Check size={12} strokeWidth={2.5} /> : `${length}/${MIN_REASON}`}
          </span>
        </span>
      </label>

      <div className="cw-plan-form-foot">
        <button type="button" className="mn-btn mn-btn-ghost" onClick={form.close}>
          Cancel <kbd>Esc</kbd>
        </button>
        <button type="submit" className="mn-btn" data-variant="primary">
          {form.editing ? 'Save plan' : 'Start plan'}
          <kbd>
            ⌘<CornerDownLeft size={11} />
          </kbd>
        </button>
      </div>
    </form>
  );
}

/** A segmented control: a sunken track with the chosen value raised in it. */
function Seg<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="cw-plan-seg mn-tabs" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className="mn-tab" data-active={value === o.value || undefined} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
