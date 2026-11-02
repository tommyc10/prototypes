/* Throwaway: what every maintenance plan variant is given, and the small pieces they share:
 * the window's heading, the tally, a ticket's row, the level and settle controls, the reason
 * field, the promise line and the toast. */

import { useRef, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import type { ChangeWindow } from '../../src/pages/change-windows/model/types';
import { STATUS_LABEL, hourLabel, howLong, statusOf, when } from '../../src/pages/change-windows/model/windows';
import { FATE, MIN_REASON, MINUTE, SOFT, SOFTS, verdictOf, type Fate, type Plan, type Soft, type Tally, type Ticket } from './model';

/** What every variant is given. The harness owns the plans and the clock; a variant shows
 *  them and makes changes through these. */
export interface VariantProps {
  window: ChangeWindow;
  windows: ChangeWindow[];
  now: number;
  plans: Record<string, Plan>;
  /** The picked window's plan, if it has one. */
  plan?: Plan;
  onSave: (plan: Plan) => void;
  /** End the window's plan now. */
  onEnd: (windowKey: string) => void;
  /** Send a held ticket to the queue now. */
  onSend: (windowKey: string, ticketId: string) => void;
  onSelect: (windowKey: string) => void;
  /** The page's own keys. A variant adds its own and runs the page's one listener. */
  shortcuts: { tourOpen: boolean; paletteOpen: boolean; onTogglePalette: () => void; keys: Record<string, () => void> };
  user: string;
}

export const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- the window ---------- */

export function WindowHead({ window: w, now, children }: { window: ChangeWindow; now: number; children?: ReactNode }) {
  const status = statusOf(w, now);
  return (
    <header className="cw-detail mp-head">
      <div className="cw-detail-top">
        <span className="mn-mono mn-subtle">{w.id}</span>
        <span className="cw-badge" data-status={status}>
          <i data-status={status} aria-hidden />
          {STATUS_LABEL[status]}
        </span>
        <span className="mn-subtle mp-head-when">
          {when(w.start, now)} to {when(w.closedAt ?? w.plannedEnd, now)}
        </span>
        {children}
      </div>
      <h2>{w.name}</h2>
      <p className="cw-reason">{w.reason}</p>
    </header>
  );
}

/* ---------- what the plan made of the tickets ---------- */

/** The dot beside a fate: its status colour, or a hollow grey ring for the ordinary ones. */
export const FateDot = ({ fate }: { fate: Fate }) => <i className="mp-dot" data-tone={FATE[fate].tone} aria-hidden />;

/** The tally of a plan's tickets: a metric well, the numbers that matter in their colour. */
export function TallyWell({ tally, live }: { tally: Tally; live: boolean }) {
  const cells: { label: string; n: number; tone?: string }[] = [
    { label: 'Filed in the plan', n: tally.filed },
    { label: live ? 'Held now' : 'Held', n: tally.held, tone: tally.held ? 'amber' : undefined },
    { label: 'Cleared on their own', n: tally.cleared },
    { label: 'Sent to the queue', n: tally.sent, tone: tally.sent ? 'orange' : undefined },
    { label: 'P1, paged anyway', n: tally.paged, tone: tally.paged ? 'red' : undefined },
  ];
  if (tally.marked + tally.lowered) cells.splice(2, 0, { label: 'Marked or lowered', n: tally.marked + tally.lowered });
  return (
    <div className="mp-well" role="group" aria-label="What the plan did">
      {cells.map((c) => (
        <div key={c.label}>
          <b data-tone={c.tone}>{c.n}</b>
          <span>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

/** One line on what became of a ticket, e.g. "Held until 15:50" or "Sent to the queue at 13:10". */
export function fateLine(t: Ticket, plan: Plan | undefined, now: number) {
  const v = verdictOf(t, plan, now);
  switch (v.fate) {
    case 'held':
      return `Held until ${hourLabel(v.at!)}`;
    case 'cleared':
      return `Cleared on its own after ${howLong(v.at! - t.filedAt)}`;
    case 'sent':
      return `Sent to the queue at ${hourLabel(v.at!)}`;
    case 'lowered':
      return `In the queue at P${Math.min(4, t.priority + 1)}, marked`;
    default:
      return FATE[v.fate].label;
  }
}

/** A ticket's row: what it is, when it was filed, and what the plan made of it. Held ones can be sent on. */
export function TicketRow({ ticket: t, plan, now, fresh, onSend }: { ticket: Ticket; plan?: Plan; now: number; fresh?: boolean; onSend?: () => void }) {
  const v = verdictOf(t, plan, now);
  return (
    <li className="mp-ticket" data-fate={v.fate} data-new={fresh || undefined}>
      <FateDot fate={v.fate} />
      <span className="mp-ticket-main">
        <span className="mp-ticket-title mn-truncate">{t.title}</span>
        <span className="mp-ticket-meta mn-truncate">
          <span className="mn-mono">{t.id}</span> · <span className="mn-mono">{t.ci}</span> · P{t.priority} · filed {hourLabel(t.filedAt)}
        </span>
      </span>
      <span className="mp-ticket-fate" data-tone={FATE[v.fate].tone}>
        {fateLine(t, plan, now)}
      </span>
      {v.fate === 'held' && onSend && (
        <button className="mn-btn mn-btn-ghost mp-send" onClick={onSend}>
          Send now
        </button>
      )}
    </li>
  );
}

/** Which things arrived after the page opened, so only those rise in. Give it the keys
 *  showing now (a ticket's id, or its id and fate where a ticket can move). */
export function useFresh(keys: string[]) {
  const seen = useRef<Set<string> | null>(null);
  if (!seen.current) seen.current = new Set(keys);
  return (key: string) => !seen.current!.has(key);
}

/* ---------- making a plan ---------- */

/** A segmented control: a sunken track with the chosen value raised in it. */
export function Seg<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="mp-seg mn-tabs" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className="mn-tab"
          data-active={value === o.value || undefined}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const SoftSeg = ({ value, onChange }: { value: Soft; onChange: (s: Soft) => void }) => (
  <Seg label="How quiet" value={value} options={SOFTS.map((s) => ({ value: s, label: SOFT[s].label }))} onChange={onChange} />
);

export const SETTLES = [0, 15, 30, 60].map((m) => m * MINUTE);

export const SettleSeg = ({ value, onChange }: { value: number; onChange: (ms: number) => void }) => (
  <Seg label="Settle time" value={value} options={SETTLES.map((ms) => ({ value: ms, label: ms ? howLong(ms) : 'None' }))} onChange={onChange} />
);

/** The written reason every change needs, with its counter. */
export function ReasonField({ value, onChange, attempted, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; attempted: boolean; placeholder?: string; autoFocus?: boolean }) {
  const length = value.trim().length;
  const bad = attempted && length < MIN_REASON;
  return (
    <label className="mn-field">
      <textarea
        autoFocus={autoFocus}
        rows={2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'What work is it, and what will it set off?'}
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
  );
}

/** The one line every variant says somewhere near the decision. */
export const Never = () => <p className="mp-promise">Every ticket is still filed and can be found. Nothing is hidden, and a P1 always pages.</p>;

export function planToast(plan: Plan, w: ChangeWindow, verb = 'started') {
  toast.custom(() => (
    <div className="mn-toast">
      <span className="mn-toast-icon">
        <Check size={13} strokeWidth={2.5} />
      </span>
      <div>
        <div className="mn-toast-title">
          {plan.id} {verb}
        </div>
        <div className="mn-toast-sub">
          Tickets for <span className="mn-mono">{plan.cis.join(', ')}</span> during {w.id} are softened
        </div>
      </div>
    </div>
  ));
}
