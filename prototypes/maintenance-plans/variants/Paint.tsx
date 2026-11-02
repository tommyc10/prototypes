/* Paint: the plan is drawn on the timeline.
 *
 * Every window near now is a lane: its bar, any plan over it as a band, and a mark for each
 * ticket filed against it, coloured by what became of it. Drag across a lane to paint a plan
 * over that stretch (it starts no earlier than now: a plan can't soften what has already
 * paged). The band comes up dashed, as a draft, with a small form under it: how quiet, the
 * settle time, a reason. Drag the band's ends to adjust it. M paints one over the picked
 * window's whole run. Painting on a lane that already has a plan moves that plan's end.
 *
 * After a held band ends, its settle time trails off it as a hatched tail. Under the
 * timeline, the picked window: its plan in a sentence, the tally, and its latest tickets. */

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CornerDownLeft } from 'lucide-react';
import { useKeyboardShortcuts } from '../../../src/hooks/useKeyboardShortcuts';
import type { ChangeWindow } from '../../../src/pages/change-windows/model/types';
import { HOUR, endOf, hourLabel, howLong, statusOf } from '../../../src/pages/change-windows/model/windows';
import { FATE, MIN_REASON, MINUTE, SOFT, TICKETS, draftFor, filedFor, nextPlanId, oneLevel, planEnd, planLive, planStart, tallyOf, verdictOf, withEnd, type Plan, type Ticket } from '../model';
import { FateDot, Never, ReasonField, SettleSeg, SoftSeg, TallyWell, TicketRow, fateLine, planToast, useFresh, type VariantProps } from '../shared';

const SNAP = 15 * MINUTE;
/** Hours shown behind the hour now, and in all. */
const BEHIND = 4;
const SPAN = 14 * HOUR;

interface Draft {
  plan: Plan;
  attempted: boolean;
}

export function Paint(props: VariantProps) {
  const { window: picked, windows, now, plans, plan, onSave, onEnd, onSend, onSelect, shortcuts, user } = props;
  // The range stays put while you work; "now" walks across it.
  const [from] = useState(() => Math.floor(now / HOUR) * HOUR - BEHIND * HOUR);
  const to = from + SPAN;
  const pct = (t: number) => Math.min(100, Math.max(0, ((t - from) / SPAN) * 100));
  const lanes = windows.filter((w) => w.start < to && endOf(w, now) > from);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [hover, setHover] = useState<{ ticket: Ticket; key: string } | null>(null);
  const drag = useRef<{ w: ChangeWindow; x0: number; t0: number; moved: boolean; edge: 'paint' | 'from' | 'to'; el: HTMLElement } | null>(null);

  const earliest = Math.ceil(now / (5 * MINUTE)) * 5 * MINUTE;
  const timeAt = (clientX: number, el: HTMLElement) => {
    const box = el.getBoundingClientRect();
    return Math.round((from + ((clientX - box.left) / box.width) * SPAN) / SNAP) * SNAP;
  };

  /** A draft over [a, b] on a window's lane: a new plan, or the plan it has with a new end. */
  const paint = (w: ChangeWindow, a: number, b: number, soft = draft?.plan.stretches[0].soft ?? 'hold') => {
    const own = plans[w.key];
    if (own && planLive(own, now)) return setDraft({ plan: withEnd(own, Math.max(b, earliest + SNAP)), attempted: false });
    const start = Math.max(a, earliest);
    const end = Math.max(b, start + SNAP);
    const base = draftFor(w, now, user);
    if (base) setDraft({ plan: { ...base, stretches: [{ from: start, to: end, soft }] }, attempted: false });
  };

  const down = (e: ReactPointerEvent<HTMLElement>, w: ChangeWindow, edge: 'paint' | 'from' | 'to' = 'paint') => {
    if (e.button !== 0) return;
    const el = (e.currentTarget.closest('.mp-lane-track') as HTMLElement) ?? e.currentTarget;
    el.setPointerCapture(e.pointerId);
    drag.current = { w, x0: e.clientX, t0: timeAt(e.clientX, el), moved: edge !== 'paint', edge, el };
    e.stopPropagation();
  };
  const move = (e: ReactPointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.abs(e.clientX - d.x0) < 5) return;
    d.moved = true;
    const t = timeAt(e.clientX, d.el);
    if (d.w.key !== picked.key) onSelect(d.w.key);
    if (d.edge === 'paint') return paint(d.w, Math.min(d.t0, t), Math.max(d.t0, t));
    if (!draft) return;
    const p = draft.plan;
    if (d.edge === 'to') return setDraft({ ...draft, plan: withEnd(p, Math.max(t, planStart(p) + SNAP, earliest)) });
    // Moving the start: never before now, never past the end.
    const start = Math.min(Math.max(t, earliest), planEnd(p) - SNAP);
    if (p.id) return; // a plan in place keeps the start it had
    setDraft({ ...draft, plan: { ...p, stretches: [{ ...p.stretches[0], from: start }] } });
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (d && !d.moved) onSelect(d.w.key);
  };

  const submit = () => {
    if (!draft) return;
    if (draft.plan.reason.trim().length < MIN_REASON) return setDraft({ ...draft, attempted: true });
    const saved = { ...draft.plan, sent: plans[draft.plan.windowKey]?.sent ?? {}, id: draft.plan.id || nextPlanId() };
    onSave(saved);
    planToast(saved, windows.find((w) => w.key === saved.windowKey)!, draft.plan.id ? 'changed' : 'started');
    setDraft(null);
  };

  useKeyboardShortcuts({
    ...shortcuts,
    keys: {
      ...shortcuts.keys,
      m: () => {
        const base = plan && planLive(plan, now) ? plan : draftFor(picked, now, user);
        if (base) setDraft({ plan: base, attempted: false });
      },
    },
    decisionOpen: !!draft,
    onCancelDecision: () => setDraft(null),
    onSubmitDecision: submit,
  });

  const ticks: number[] = [];
  for (let t = Math.ceil(from / (2 * HOUR)) * 2 * HOUR; t < to; t += 2 * HOUR) ticks.push(t);
  const filed = filedFor(picked, now);
  const fresh = useFresh(TICKETS.filter((t) => t.filedAt <= now).map((t) => t.id));

  return (
    <div className="mp-scroll mp-paint">
      <div className="mp-paint-head">
        <div>
          <h2>Maintenance plans</h2>
          <p className="mn-subtle">Drag across a window to cover it with a plan. Tickets land on the lanes as they're filed.</p>
        </div>
        <ul className="mp-legend" aria-label="What the marks mean">
          {(['held', 'cleared', 'sent', 'paged', 'pages'] as const).map((f) => (
            <li key={f}>
              <FateDot fate={f} />
              {f === 'pages' ? 'Paged as usual' : FATE[f].label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mp-timeline" onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="mp-axis" aria-hidden>
          {/* An hour's label gives way to now's when they would touch. */}
          {ticks
            .filter((t) => Math.abs(t - now) > 40 * MINUTE)
            .map((t) => (
              <span key={t} style={{ left: `${pct(t)}%` }}>
                {hourLabel(t)}
              </span>
            ))}
          <b className="mp-now-label" style={{ left: `${pct(now)}%` }}>
            {hourLabel(now)}
          </b>
        </div>

        <div className="mp-lanes">
          {/* Hour lines and now, under every lane. */}
          <div className="mp-grid" aria-hidden>
            {ticks.map((t) => (
              <i key={t} style={{ left: `${pct(t)}%` }} />
            ))}
            <i className="mp-now" style={{ left: `${pct(now)}%` }} />
          </div>

          {lanes.map((w) => {
            const status = statusOf(w, now);
            const own = draft?.plan.windowKey === w.key ? null : plans[w.key];
            const marks = TICKETS.filter((t) => t.windowKey === w.key && t.filedAt <= now && t.filedAt >= from);
            const end = status === 'overrunning' ? now : (w.closedAt ?? w.plannedEnd);
            return (
              <div key={w.key} className="mp-lane" data-picked={w.key === picked.key || undefined} data-ended={status === 'ended' || undefined}>
                <button className="mp-lane-label" onClick={() => onSelect(w.key)}>
                  <span className="mn-truncate">{w.name}</span>
                  <small className="mn-mono">{w.id}</small>
                </button>
                <div className="mp-lane-track" onPointerDown={(e) => (status === 'ended' ? onSelect(w.key) : down(e, w))}>
                  <span className="mp-bar" data-status={status} style={{ left: `${pct(w.start)}%`, width: `${pct(end) - pct(w.start)}%` }} />
                  {status === 'overrunning' && <span className="mp-bar-planned" style={{ left: `${pct(w.plannedEnd)}%` }} />}

                  {own && <Band plan={own} pct={pct} now={now} />}
                  {draft && draft.plan.windowKey === w.key && <Band plan={draft.plan} pct={pct} now={now} draft onEdge={(e, edge) => down(e, w, edge)} />}

                  {marks.map((t) => {
                    const v = verdictOf(t, plans[w.key], now);
                    return (
                      <i
                        key={t.id}
                        className="mp-mark"
                        data-tone={FATE[v.fate].tone}
                        data-new={fresh(t.id) || undefined}
                        style={{ left: `${pct(t.filedAt)}%` }}
                        onPointerEnter={() => setHover({ ticket: t, key: w.key })}
                        onPointerLeave={() => setHover(null)}
                      />
                    );
                  })}

                  {hover?.key === w.key && (
                    <div className="mp-tip" style={{ left: `${pct(hover.ticket.filedAt)}%` }}>
                      <b>{hover.ticket.title}</b>
                      <span>
                        <span className="mn-mono">{hover.ticket.id}</span> · P{hover.ticket.priority} · filed {hourLabel(hover.ticket.filedAt)}
                      </span>
                      <span data-tone={FATE[verdictOf(hover.ticket, plans[w.key], now).fate].tone}>{fateLine(hover.ticket, plans[w.key], now)}</span>
                    </div>
                  )}
                </div>

                {draft && draft.plan.windowKey === w.key && (
                  <PaintForm
                    draft={draft}
                    left={pct(planStart(draft.plan))}
                    onChange={(p) => setDraft({ ...draft, plan: p })}
                    onCancel={() => setDraft(null)}
                    onSubmit={submit}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <section className="mp-paint-picked" aria-label="The picked window">
        <div className="mp-card-head">
          <h3 className="mn-truncate">{picked.name}</h3>
          <span className="mn-mono mn-subtle">{picked.id}</span>
          {plan && <span className="mn-mono mn-subtle">· {plan.id}</span>}
          <span className="mp-grow" />
          {plan && planLive(plan, now) && (
            <button className="mn-btn" onClick={() => onEnd(picked.key)}>
              End plan
            </button>
          )}
        </div>
        <p className="mp-say">
          {plan ? (
            <>
              {SOFT[plan.stretches[0].soft][planLive(plan, now) ? 'doing' : 'done']} tickets for <span className="mn-mono mp-em">{plan.cis.join(', ')}</span> from {hourLabel(planStart(plan))} to <b>{hourLabel(planEnd(plan))}</b>
              {plan.settle > 0 && plan.stretches.some((s) => s.soft === 'hold') ? `, then ${howLong(plan.settle)} to settle` : ''}. {plan.by}: <q>{plan.reason}</q>
            </>
          ) : picked.closedAt ? (
            'No plan covered it, and it has ended.'
          ) : (
            <>
              No plan. Drag across its lane, or press <kbd>M</kbd>, to cover it.
            </>
          )}
        </p>
        {plan && <TallyWell tally={tallyOf(filed, plan, now)} live={planLive(plan, now)} />}
        {filed.length > 0 && (
          <ul className="mp-tickets">
            {filed.slice(0, 6).map((t) => (
              <TicketRow key={t.id} ticket={t} plan={plan} now={now} fresh={fresh(t.id)} onSend={() => onSend(picked.key, t.id)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** A plan over its lane: a band per stretch, and its settle time trailing off the end. */
function Band({ plan, pct, now, draft, onEdge }: { plan: Plan; pct: (t: number) => number; now: number; draft?: boolean; onEdge?: (e: ReactPointerEvent<HTMLElement>, edge: 'from' | 'to') => void }) {
  const a = pct(planStart(plan));
  const b = pct(planEnd(plan));
  const holds = plan.stretches.some((s) => s.soft === 'hold');
  const live = planLive(plan, now);
  return (
    <>
      {plan.stretches.map((s, i) => (
        <span
          key={i}
          className="mp-band"
          data-draft={draft || undefined}
          data-live={live || undefined}
          data-soft={s.soft}
          style={{ left: `${pct(s.from)}%`, width: `${pct(s.to) - pct(s.from)}%` }}
        >
          {i === 0 && pct(planEnd(plan)) - a > 6 && (
            <span className="mp-band-label">
              {plan.id || 'New plan'} · {SOFT[s.soft].label}
            </span>
          )}
        </span>
      ))}
      {holds && plan.settle > 0 && <span className="mp-settle" style={{ left: `${b}%`, width: `${pct(planEnd(plan) + plan.settle) - b}%` }} title={`${howLong(plan.settle)} to settle`} />}
      {draft && onEdge && (
        <>
          {!plan.id && <span className="mp-handle" style={{ left: `${a}%` }} onPointerDown={(e) => onEdge(e, 'from')} aria-hidden />}
          <span className="mp-handle" style={{ left: `${b}%` }} onPointerDown={(e) => onEdge(e, 'to')} aria-hidden />
        </>
      )}
    </>
  );
}

/** The small form under a painted band. */
function PaintForm({ draft, left, onChange, onCancel, onSubmit }: { draft: Draft; left: number; onChange: (p: Plan) => void; onCancel: () => void; onSubmit: () => void }) {
  const p = draft.plan;
  const soft = p.stretches[0].soft;
  return (
    <form
      className="mp-pop"
      style={{ left: `clamp(220px, calc(220px + (100% - 220px) * ${left / 100}), calc(100% - 400px))` }}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mp-pop-title">
        {p.id ? `Change ${p.id}` : 'New plan'}, {hourLabel(planStart(p))} to {hourLabel(planEnd(p))}
        <span className="mn-subtle"> · {howLong(planEnd(p) - planStart(p))}</span>
      </div>
      <div className="mp-form-row">
        <SoftSeg value={soft} onChange={(s) => onChange(oneLevel(p, s))} />
        {soft === 'hold' && <SettleSeg value={p.settle} onChange={(ms) => onChange({ ...p, settle: ms })} />}
      </div>
      <p className="mp-form-says">{SOFT[soft].says}</p>
      <ReasonField autoFocus value={p.reason} onChange={(reason) => onChange({ ...p, reason })} attempted={draft.attempted} />
      <div className="mn-composer-foot">
        <Never />
        <button type="button" className="mn-btn mn-btn-ghost" onClick={onCancel}>
          Cancel <kbd>Esc</kbd>
        </button>
        <button type="submit" className="mn-btn" data-variant="primary">
          {p.id ? 'Save' : 'Start plan'}
          <kbd>
            ⌘<CornerDownLeft size={11} />
          </kbd>
        </button>
      </div>
    </form>
  );
}
