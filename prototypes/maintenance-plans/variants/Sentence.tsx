/* Sentence: the plan is one sentence you can read aloud.
 *
 *   "Until 21:12, tickets filed against superlaser-* are held beside the plan and nobody is
 *    paged. When the work ends, anything still open waits 30 min, then goes to Reactor
 *    Core's queue."
 *
 * Each underlined part is a choice: press it for a menu. A window with no plan shows the
 * sentence as a draft, already filled in from the window, with the reason under it and Start
 * plan. A plan in place reads the same way; change a part and it asks for a reason again.
 *
 * Below the sentence, the tray: every ticket filed against the window, sorted into what
 * became of it. A held ticket that clears on its own moves across to "Cleared", and one
 * still open when the work ends moves to "Sent to the queue", so you can watch the plan work. */

import { useState, type ReactNode } from 'react';
import { Menu } from '@base-ui/react/menu';
import { AlertTriangle, Check, CornerDownLeft } from 'lucide-react';
import { useKeyboardShortcuts } from '../../../src/hooks/useKeyboardShortcuts';
import { groupOf, hourLabel, howLong, inPlace, when } from '../../../src/pages/change-windows/model/windows';
import { FATE, HOUR, MIN_REASON, MINUTE, SOFT, SOFTS, draftFor, extended, filedFor, nextPlanId, oneLevel, planEnd, planLive, planStart, verdictOf, withEnd, type Fate, type Plan, type Soft } from '../model';
import { FateDot, Never, ReasonField, SETTLES, fateLine, planToast, useFresh, type VariantProps } from '../shared';

/** The tray's columns, in the order a ticket moves through them. */
const COLUMNS: { fates: Fate[]; label: string }[] = [
  { fates: ['held'], label: 'Held' },
  { fates: ['cleared'], label: 'Cleared on their own' },
  { fates: ['sent'], label: 'Sent to the queue' },
  { fates: ['marked', 'lowered'], label: 'In the queue, softened' },
  { fates: ['paged', 'pages'], label: 'Paged' },
];

export function Sentence(props: VariantProps) {
  const { window: w, now, plan, onSave, onEnd, onSend, shortcuts, user } = props;
  const group = groupOf(w.groupId);
  // What's being written: a draft for a window with no plan, or the plan with unsaved changes.
  const [edit, setEdit] = useState<{ key: string; plan: Plan | null; attempted: boolean }>({ key: '', plan: null, attempted: false });
  // Start again whenever the window or the saved plan changes (tickets sent on don't count).
  const key = w.key + sig(plan);
  if (edit.key !== key) {
    const base = plan ?? draftFor(w, now, user);
    setEdit({ key, plan: base ? { ...base, reason: '' } : null, attempted: false });
  }
  const writing = edit.plan;
  const changed = !!plan && !!writing && sig(plan) !== sig(writing);
  const asking = !!writing && (!plan || changed);
  const live = plan && planLive(plan, now);
  // A plan that has ended is a record: it can't be changed.
  const locked = !!plan && now >= planEnd(plan);

  const tickets = filedFor(w, now);
  const shown = plan ?? undefined;
  const fresh = useFresh(tickets.map((t) => t.id + verdictOf(t, shown, now).fate));

  const set = (p: Plan) => setEdit({ ...edit, plan: p });
  const submit = () => {
    if (!writing || !asking) return;
    if (writing.reason.trim().length < MIN_REASON) return setEdit({ ...edit, attempted: true });
    const saved = { ...writing, sent: plan?.sent ?? {}, id: writing.id || nextPlanId() };
    onSave(saved);
    planToast(saved, w, plan ? 'changed' : 'started');
  };

  useKeyboardShortcuts({
    ...shortcuts,
    keys: { ...shortcuts.keys, m: () => document.querySelector<HTMLElement>('.mp-sentence .mp-token')?.focus() },
    onSubmit: submit,
  });

  const s = writing ?? plan;
  const soft = s?.stretches[0].soft ?? 'hold';
  const base0 = w.plannedEnd > (s ? planStart(s) : now) ? w.plannedEnd : (s ? planStart(s) : now) + HOUR;
  const ends = s ? [...new Set([base0, ...[30, 60, 120].map((m) => base0 + m * MINUTE), planEnd(s)])].sort((a, b) => a - b) : [];
  const ciChoices = [...new Set([w.cis, ...tickets.map((t) => t.ci), ...(s?.cis ?? [])])];

  return (
    <div className="mp-scroll">
      <div className="mp-col">
        <header className="mp-sent-top">
          <span className="mn-mono mn-subtle">{w.id}</span>
          <span className="mp-sent-name mn-truncate">{w.name}</span>
          {s && (
            <span className="mp-state">
              <i className="mp-dot" data-tone={asking ? 'amber' : live ? 'green' : 'plain'} aria-hidden />
              {asking ? (plan ? 'Changed, not saved' : 'Draft') : live ? `${plan!.id} in place` : `${plan!.id} ended ${hourLabel(planEnd(plan!))}`}
            </span>
          )}
        </header>

        {!s ? (
          <p className="mp-sentence" data-past>
            No plan covered this window. {tickets.length ? <>Its <b>{tickets.length}</b> tickets paged {group.name} as usual.</> : 'Nothing was filed against it.'}
          </p>
        ) : (
          <p className="mp-sentence" data-draft={asking || undefined}>
            {now >= planStart(s) && now < planEnd(s) ? 'Until ' : `From ${when(planStart(s), now)} until `}
            <Token locked={locked} label="Until" value={planEnd(s)} options={ends.map((t) => ({ value: t, label: when(t, now), hint: t === base0 ? 'the planned end' : t > base0 ? `${howLong(t - base0)} after it` : undefined }))} onChange={(t) => set(withEnd(s, t))}>
              {when(planEnd(s), now)}
            </Token>
            , tickets filed against{' '}
            <CiToken locked={locked} choices={ciChoices} value={s.cis} onChange={(cis) => set({ ...s, cis })} />{' '}
            are{' '}
            <Token locked={locked} label="How quiet" value={soft} options={SOFTS.map((x) => ({ value: x, label: SOFT[x].verb, hint: SOFT[x].says }))} onChange={(x: Soft) => set(oneLevel(s, x))}>
              {SOFT[soft].verb}
            </Token>{' '}
            {soft === 'hold' ? (
              <>
                and nobody is paged. When the work ends, anything still open{' '}
                {s.settle ? 'waits ' : 'goes '}
                <Token locked={locked} label="Settle time" value={s.settle} options={SETTLES.map((ms) => ({ value: ms, label: ms ? howLong(ms) : 'straight', hint: ms ? 'to clear on its own' : 'no wait' }))} onChange={(ms) => set({ ...s, settle: ms })}>
                  {s.settle ? howLong(s.settle) : 'straight'}
                </Token>
                {s.settle ? ', then goes' : ''} to <b>{group.name}</b>’s queue.
              </>
            ) : (
              <>
                and go to <b>{group.name}</b>’s queue{soft === 'lower' ? ' one priority lower' : ''}. Nobody is paged.
              </>
            )}
          </p>
        )}

        {s && <Never />}

        {/* The work outlived the plan: say so, because new tickets page again. */}
        {plan && locked && inPlace(w, now) && (
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

        {asking && writing && (
          <div className="mp-sent-ask">
            <ReasonField value={writing.reason} onChange={(reason) => set({ ...writing, reason })} attempted={edit.attempted} placeholder={plan ? 'Why change it?' : undefined} />
            <div className="mp-sent-actions">
              {plan && (
                <button className="mn-btn mn-btn-ghost" onClick={() => setEdit({ ...edit, plan: { ...plan, reason: '' } })}>
                  Undo changes
                </button>
              )}
              <button className="mn-btn" data-variant="primary" onClick={submit}>
                {plan ? 'Save change' : 'Start plan'}
                <kbd>
                  ⌘<CornerDownLeft size={11} />
                </kbd>
              </button>
            </div>
          </div>
        )}
        {!asking && plan && live && (
          <div className="mp-sent-actions" data-quiet>
            <span className="mn-subtle">
              Set by {plan.by}: <q>{plan.reason}</q>
            </span>
            <button className="mn-btn" onClick={() => onEnd(w.key)}>
              End plan
            </button>
          </div>
        )}

        <Tray>
          {COLUMNS.map((c) => {
            const own = tickets.filter((t) => c.fates.includes(verdictOf(t, shown, now).fate));
            if (!own.length && !(c.fates[0] === 'held' && plan)) return null;
            return (
              <section key={c.label} className="mp-tray-col" data-fate={c.fates[0]}>
                <h3>
                  <FateDot fate={c.fates[0]} />
                  {c.label} <span>{own.length}</span>
                </h3>
                {own.length === 0 && <p className="mp-tray-empty">{live ? 'New tickets for what it covers land here.' : 'None now.'}</p>}
                {own.map((t) => {
                  const v = verdictOf(t, shown, now);
                  return (
                    <article key={t.id} className="mp-slip" data-new={fresh(t.id + v.fate) || undefined} data-fate={v.fate}>
                      <span className="mp-slip-title">{t.title}</span>
                      <span className="mp-slip-meta">
                        <span className="mn-mono">{t.id}</span> · P{t.priority} · {hourLabel(t.filedAt)}
                      </span>
                      <span className="mp-slip-fate" data-tone={FATE[v.fate].tone}>
                        {fateLine(t, shown, now)}
                      </span>
                      {v.fate === 'held' && (
                        <button className="mn-btn mn-btn-ghost mp-send" onClick={() => onSend(w.key, t.id)}>
                          Send now
                        </button>
                      )}
                    </article>
                  );
                })}
              </section>
            );
          })}
          {!tickets.length && <p className="mn-empty mp-tray-none">Nothing has been filed against {w.cis} yet. When something is, it lands here.</p>}
        </Tray>
      </div>
    </div>
  );
}

const sig = (p: Plan | null | undefined) => (p ? JSON.stringify({ ...p, sent: {}, reason: '' }) : '');

const Tray = ({ children }: { children: ReactNode }) => (
  <div className="mp-tray" aria-label="What became of each ticket">
    {children}
  </div>
);

/** One part of the sentence, as a menu of the choices it could be. */
function Token<T extends string | number>({
  label,
  value,
  options,
  onChange,
  locked,
  children,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
  locked: boolean;
  children: ReactNode;
}) {
  return (
    <Menu.Root disabled={locked}>
      <Menu.Trigger className="mp-token" aria-label={`${label}: ${options.find((o) => o.value === value)?.label ?? ''}`}>
        {children}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start">
          <Menu.Popup className="mn-menu mp-menu">
            <div className="mn-menu-label">{label}</div>
            <Menu.RadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
              {options.map((o) => (
                <Menu.RadioItem key={o.value} value={o.value} className="mn-menu-item mp-menu-item" closeOnClick>
                  <Menu.RadioItemIndicator className="mn-menu-ind">
                    <Check size={13} />
                  </Menu.RadioItemIndicator>
                  <span>
                    {o.label}
                    {o.hint && <small>{o.hint}</small>}
                  </span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

/** What it covers: the window's own pattern, or any of the CIs tickets have come from. */
function CiToken({ choices, value, onChange, locked }: { choices: string[]; value: string[]; onChange: (cis: string[]) => void; locked: boolean }) {
  return (
    <Menu.Root disabled={locked}>
      <Menu.Trigger className="mp-token mn-mono" aria-label={`Covers: ${value.join(', ')}`}>
        {value.length > 2 ? `${value[0]} and ${value.length - 1} more` : value.join(' and ')}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="start">
          <Menu.Popup className="mn-menu mp-menu">
            <div className="mn-menu-label">Covers</div>
            {choices.map((ci) => (
              <Menu.CheckboxItem
                key={ci}
                className="mn-menu-item"
                checked={value.includes(ci)}
                // At least one: a plan that covers nothing is not a plan.
                disabled={value.length === 1 && value.includes(ci)}
                onCheckedChange={(on) => onChange(on ? [...value, ci] : value.filter((c) => c !== ci))}
              >
                <Menu.CheckboxItemIndicator className="mn-menu-ind">
                  <Check size={13} />
                </Menu.CheckboxItemIndicator>
                <span className="mn-mono">{ci}</span>
              </Menu.CheckboxItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
