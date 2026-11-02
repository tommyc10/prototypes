/* Dimmer: the plan fades instead of switching off.
 *
 * Most maintenance ends with a cliff: the window closes and everything pages again at once,
 * often while the last of the work is still settling. Here the plan has a shape. Four rows,
 * quietest on top: Hold, Lower, Mark, and As usual. The plan is a stepped line across them,
 * over the window's run, and the space under it is how much it is softening. The default is
 * a fade: hold while the work runs, lower for the last half hour, then mark for half an hour
 * after, so tickets ease back to paging.
 *
 * Drag a step's edge to move it, or a step up or down to change how quiet it is. Pick a step
 * to split it or remove it. What has already happened is fixed: only the part from now on
 * can change. Each ticket sits on the line at the level it met, coloured by what became of
 * it; a P1 drops to As usual, because it pages whatever the plan says. */

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { CornerDownLeft, Scissors, Trash2 } from 'lucide-react';
import { useKeyboardShortcuts } from '../../../src/hooks/useKeyboardShortcuts';
import { hourLabel, howLong, inPlace } from '../../../src/pages/change-windows/model/windows';
import { HOUR, MIN_REASON, MINUTE, SOFT, SOFTS, covers, draftFor, filedFor, levelAt, nextPlanId, planEnd, planLive, planStart, tallyOf, verdictOf, FATE, type Plan, type Soft, type Stretch } from '../model';
import { Never, ReasonField, Seg, SettleSeg, SoftSeg, TallyWell, TicketRow, WindowHead, planToast, useFresh, type VariantProps } from '../shared';

const ROWS: (Soft | null)[] = ['hold', 'lower', 'mark', null];
const ROW_H = 44;
const SNAP = 15 * MINUTE;

type Shape = 'cliff' | 'fade' | 'gentle';

/** The three shapes a plan can start from, over [from, to]. */
function shaped(shape: Shape, from: number, to: number): Stretch[] {
  const half = 30 * MINUTE;
  const room = to - from > 1.5 * HOUR;
  switch (shape) {
    case 'cliff':
      return [{ from, to, soft: 'hold' }];
    case 'fade':
      return room
        ? [
            { from, to: to - half, soft: 'hold' },
            { from: to - half, to, soft: 'lower' },
            { from: to, to: to + half, soft: 'mark' },
          ]
        : [
            { from, to, soft: 'hold' },
            { from: to, to: to + half, soft: 'mark' },
          ];
    case 'gentle':
      return [
        { from, to, soft: 'lower' },
        { from: to, to: to + half, soft: 'mark' },
      ];
  }
}

const SHAPES: { value: Shape; label: string; says: string }[] = [
  { value: 'fade', label: 'Fade out', says: 'Hold while the work runs, lower for the last half hour, then mark for half an hour after.' },
  { value: 'cliff', label: 'Switch off', says: 'Hold while the work runs, then page as usual the moment it ends.' },
  { value: 'gentle', label: 'Gentle', says: 'Lower while the work runs, then mark for half an hour after. Nothing is held.' },
];

const sig = (p: Plan | null | undefined) => (p ? JSON.stringify({ ...p, sent: {}, reason: '' }) : '');

export function Dimmer(props: VariantProps) {
  const { window: w, now, plan, onSave, onEnd, onSend, shortcuts, user } = props;

  // What's being shaped: a draft for a window with no plan, or the plan with unsaved changes.
  const [edit, setEdit] = useState<{ key: string; plan: Plan | null; attempted: boolean; picked: number | null }>({ key: '', plan: null, attempted: false, picked: null });
  const key = w.key + sig(plan);
  if (edit.key !== key) {
    const base = plan ?? draftFor(w, now, user);
    const fresh = base && !plan ? { ...base, settle: 15 * MINUTE, stretches: shaped('fade', planStart(base), planEnd(base)) } : base;
    setEdit({ key, plan: fresh ? { ...fresh, reason: '' } : null, attempted: false, picked: null });
  }
  const s = edit.plan;
  const changed = !!plan && !!s && sig(plan) !== sig(s);
  const asking = !!s && (!plan || changed);
  const live = !!plan && planLive(plan, now);
  const set = (p: Plan, picked = edit.picked) => setEdit({ ...edit, plan: p, picked });

  const tickets = filedFor(w, now);
  const freshIds = useFresh(tickets.map((t) => t.id));

  const submit = () => {
    if (!s || !asking) return;
    if (s.reason.trim().length < MIN_REASON) return setEdit({ ...edit, attempted: true });
    const saved = { ...s, sent: plan?.sent ?? {}, id: s.id || nextPlanId() };
    onSave(saved);
    planToast(saved, w, plan ? 'changed' : 'started');
  };

  useKeyboardShortcuts({
    ...shortcuts,
    keys: { ...shortcuts.keys, m: () => document.querySelector<HTMLElement>('.mp-dim-shapes .mn-tab')?.focus() },
    onSubmit: submit,
  });

  /* ---------- the instrument's frame ---------- */

  const workEnd = w.closedAt ?? Math.max(w.plannedEnd, inPlace(w, now) ? now : 0);
  const lastEdge = s ? planEnd(s) + (s.stretches.some((x) => x.soft === 'hold') ? s.settle : 0) : workEnd;
  const from = Math.max(w.start, now - 4 * HOUR) - 30 * MINUTE;
  const to = Math.min(from + 30 * HOUR, Math.max(workEnd, lastEdge, now) + 60 * MINUTE);
  const x = (t: number) => Math.min(100, Math.max(0, ((t - from) / (to - from)) * 100));
  const y = (soft: Soft | null) => ROWS.indexOf(soft) * ROW_H + ROW_H / 2;
  const earliest = Math.ceil(now / (5 * MINUTE)) * 5 * MINUTE;

  // The plan as a run of levels across the whole frame, gaps as "As usual".
  const runs: { from: number; to: number; soft: Soft | null }[] = [];
  let at = from;
  for (const st of s?.stretches ?? []) {
    if (st.from > at) runs.push({ from: at, to: st.from, soft: null });
    runs.push(st);
    at = st.to;
  }
  runs.push({ from: at, to, soft: null });
  const line = runs.map((r) => `L ${x(r.from) * 10} ${y(r.soft)} L ${x(r.to) * 10} ${y(r.soft)}`).join(' ').replace(/^L/, 'M');
  const fill = `${line} L 1000 ${y(null)} L 0 ${y(null)} Z`;

  /* ---------- dragging ---------- */

  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ kind: 'edge' | 'level'; i: number } | null>(null);
  const timeAt = (clientX: number) => {
    const box = frame.current!.getBoundingClientRect();
    return Math.round((from + ((clientX - box.left) / box.width) * (to - from)) / SNAP) * SNAP;
  };
  const rowAt = (clientY: number) => {
    const box = frame.current!.getBoundingClientRect();
    return Math.min(2, Math.max(0, Math.floor((clientY - box.top) / ROW_H)));
  };
  const fixed = (st: Stretch) => st.to <= now;

  const down = (e: ReactPointerEvent<HTMLElement>, kind: 'edge' | 'level', i: number) => {
    if (e.button !== 0 || !s) return;
    e.stopPropagation();
    frame.current!.setPointerCapture(e.pointerId);
    drag.current = { kind, i };
    if (kind === 'level') setEdit({ ...edit, picked: i });
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !s) return;
    const list = s.stretches.map((st) => ({ ...st }));
    if (d.kind === 'level') {
      const soft = ROWS[rowAt(e.clientY)] as Soft;
      if (fixed(list[d.i]) || list[d.i].soft === soft) return;
      list[d.i].soft = soft;
      return set({ ...s, stretches: list });
    }
    const t = timeAt(e.clientX);
    // Edge i: -1 is the start, n - 1 the end, anything else the step between i and i + 1.
    if (d.i === -1) {
      if (plan) return;
      list[0].from = Math.min(Math.max(t, earliest), list[0].to - SNAP);
    } else if (d.i === list.length - 1) {
      list[d.i].to = Math.max(t, list[d.i].from + SNAP, earliest);
    } else {
      const edge = Math.min(Math.max(t, list[d.i].from + SNAP, earliest), list[d.i + 1].to - SNAP);
      if (list[d.i].to <= now) return;
      list[d.i].to = edge;
      list[d.i + 1].from = edge;
    }
    set({ ...s, stretches: list });
  };
  const up = () => {
    drag.current = null;
  };

  /* ---------- picking a step ---------- */

  const picked = s && edit.picked !== null ? s.stretches[edit.picked] : null;
  const split = () => {
    if (!s || edit.picked === null || !picked) return;
    const mid = Math.round(((Math.max(picked.from, earliest) + picked.to) / 2) / SNAP) * SNAP;
    if (mid - picked.from < SNAP || picked.to - mid < SNAP) return;
    const list = [...s.stretches];
    list.splice(edit.picked, 1, { ...picked, to: mid }, { ...picked, from: mid, soft: picked.soft === 'mark' ? 'mark' : SOFTS[SOFTS.indexOf(picked.soft) - 1] });
    set({ ...s, stretches: list }, edit.picked + 1);
  };
  const remove = () => {
    if (!s || edit.picked === null || s.stretches.length < 2 || !picked || fixed(picked)) return;
    const list = [...s.stretches];
    const i = edit.picked;
    // The step before (or after) takes its time.
    if (i > 0) list[i - 1] = { ...list[i - 1], to: picked.to };
    else list[1] = { ...list[1], from: picked.from };
    list.splice(i, 1);
    set({ ...s, stretches: list }, null);
  };

  // Which of the shapes the draft still is, if it hasn't been reshaped by hand.
  const shapeEnd = s ? (w.plannedEnd > planStart(s) ? w.plannedEnd : planEnd(s)) : 0;
  const shapeNow = s ? SHAPES.find((o) => sig({ ...s, stretches: shaped(o.value, planStart(s), shapeEnd) }) === sig(s)) : undefined;

  const ticks: number[] = [];
  const step = to - from > 12 * HOUR ? 3 * HOUR : HOUR;
  for (let t = Math.ceil(from / step) * step; t < to; t += step) ticks.push(t);

  return (
    <div className="mp-scroll">
      <div className="mp-col">
        <WindowHead window={w} now={now}>
          {s && (
            <span className="mp-state">
              <i className="mp-dot" data-tone={asking ? 'amber' : live ? 'green' : 'plain'} aria-hidden />
              {asking ? (plan ? 'Changed, not saved' : 'Draft') : live ? `${plan!.id} in place` : `${plan!.id} ended ${hourLabel(planEnd(plan!))}`}
            </span>
          )}
        </WindowHead>

        {!s ? (
          <p className="mp-say">No plan covered this window, and it has ended. Its {tickets.length} tickets paged as usual.</p>
        ) : (
          <section className="mp-card mp-dim" aria-label="The plan's shape">
            <div className="mp-card-head">
              <h3>How quiet, over time</h3>
              <span className="mp-grow" />
              {!plan && (
                <div className="mp-dim-shapes">
                  <Seg label="Shape" value={shapeNow?.value ?? ('' as Shape)} options={SHAPES.map((o) => ({ value: o.value, label: o.label }))} onChange={(v) => set({ ...s, stretches: shaped(v, planStart(s), shapeEnd) }, null)} />
                </div>
              )}
            </div>

            <div className="mp-dim-body">
              <ul className="mp-dim-rows" aria-hidden>
                {ROWS.map((r) => (
                  <li key={r ?? 'usual'}>{r ? SOFT[r].label : 'As usual'}</li>
                ))}
                <li className="mp-dim-worklabel">The work</li>
              </ul>

              <div className="mp-dim-frame" ref={frame} onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="img" aria-label="The plan's levels over time, with each ticket at the level it met">
                {ROWS.map((r, i) => (
                  <i key={r ?? 'usual'} className="mp-dim-row" style={{ top: i * ROW_H }} aria-hidden />
                ))}
                {ticks.map((t) => (
                  <i key={t} className="mp-dim-tick" style={{ left: `${x(t)}%` }} aria-hidden />
                ))}
                {/* The past is done: it sits back. */}
                {now > from && <span className="mp-dim-past" style={{ width: `${x(now)}%` }} aria-hidden />}

                <svg className="mp-dim-svg" viewBox={`0 0 1000 ${ROWS.length * ROW_H}`} preserveAspectRatio="none" aria-hidden>
                  <path className="mp-dim-fill" d={fill} />
                  <path className="mp-dim-line" d={line} data-draft={asking || undefined} vectorEffect="non-scaling-stroke" />
                </svg>

                {/* Each held run's settle time, trailing off in the Hold row. */}
                {s.stretches.map((st, i) =>
                  st.soft === 'hold' && s.stretches[i + 1]?.soft !== 'hold' && s.settle > 0 ? (
                    <span key={`settle${i}`} className="mp-dim-settle" style={{ left: `${x(st.to)}%`, width: `${x(st.to + s.settle) - x(st.to)}%`, top: y('hold') - 6 }} title={`${howLong(s.settle)} for held tickets to clear`} />
                  ) : null,
                )}

                {/* A grip on each step, to drag it up or down. */}
                {s.stretches.map((st, i) => (
                  <button
                    key={`step${i}`}
                    className="mp-dim-step"
                    data-picked={edit.picked === i || undefined}
                    data-fixed={fixed(st) || undefined}
                    style={{ left: `${x(st.from)}%`, width: `${x(st.to) - x(st.from)}%`, top: y(st.soft) - 14 }}
                    onPointerDown={(e) => down(e, 'level', i)}
                    onClick={() => setEdit({ ...edit, picked: i })}
                    aria-label={`${SOFT[st.soft].label}, ${hourLabel(st.from)} to ${hourLabel(st.to)}`}
                  />
                ))}

                {/* The edges: the start, each step, the end. */}
                {s.stretches.map((st, i) => {
                  const t = st.to;
                  const locked = t <= now;
                  return <span key={`edge${i}`} className="mp-dim-edge" data-fixed={locked || undefined} style={{ left: `${x(t)}%` }} onPointerDown={(e) => !locked && down(e, 'edge', i)} title={hourLabel(t)} />;
                })}
                {!plan && <span className="mp-dim-edge" style={{ left: `${x(planStart(s))}%` }} onPointerDown={(e) => down(e, 'edge', -1)} title={hourLabel(planStart(s))} />}

                {/* The work itself, along the bottom. */}
                <span className="mp-dim-work" style={{ left: `${x(w.start)}%`, width: `${x(workEnd) - x(w.start)}%` }} />

                {tickets.map((t) => {
                  const v = verdictOf(t, plan, now);
                  const level = t.priority === 1 ? null : levelAt(plan, t.filedAt);
                  return (
                    <i
                      key={t.id}
                      className="mp-dim-dot"
                      data-tone={FATE[v.fate].tone}
                      data-new={freshIds(t.id) || undefined}
                      style={{ left: `${x(t.filedAt)}%`, top: y(plan && level && covers(plan, t.ci) ? level : null) }}
                      title={`${t.id} ${t.title} · ${FATE[v.fate].label}`}
                    />
                  );
                })}

                {now > from && now < to && (
                  <i className="mp-dim-now" style={{ left: `${x(now)}%` }} aria-hidden>
                    <span>{hourLabel(now)}</span>
                  </i>
                )}
              </div>

              <div className="mp-dim-axis" aria-hidden>
                {ticks.map((t) => (
                  <span key={t} style={{ left: `${x(t)}%` }}>
                    {hourLabel(t)}
                  </span>
                ))}
              </div>
            </div>

            <div className="mp-dim-tools">
              {picked ? (
                <>
                  <span className="mp-form-label">
                    {hourLabel(picked.from)} to {hourLabel(picked.to)}
                  </span>
                  {fixed(picked) ? (
                    <span className="mn-subtle">This step has happened, so it can't change.</span>
                  ) : (
                    <>
                      <SoftSeg
                        value={picked.soft}
                        onChange={(soft) => set({ ...s, stretches: s.stretches.map((st, i) => (i === edit.picked ? { ...st, soft } : st)) })}
                      />
                      <button className="mn-btn mn-btn-ghost" onClick={split}>
                        <Scissors size={14} /> Split
                      </button>
                      {s.stretches.length > 1 && (
                        <button className="mn-btn mn-btn-ghost" onClick={remove}>
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <span className="mn-subtle">{(!plan && shapeNow?.says) || 'Pick a step to change it, or drag its edges.'}</span>
              )}
              <span className="mp-grow" />
              {s.stretches.some((st) => st.soft === 'hold') && (
                <>
                  <span className="mp-form-label">Settle time</span>
                  <SettleSeg value={s.settle} onChange={(ms) => set({ ...s, settle: ms })} />
                </>
              )}
            </div>
          </section>
        )}

        {s && <Never />}

        {asking && s && (
          <div className="mp-sent-ask">
            <ReasonField value={s.reason} onChange={(reason) => set({ ...s, reason })} attempted={edit.attempted} placeholder={plan ? 'Why change it?' : undefined} />
            <div className="mp-sent-actions">
              {plan && (
                <button className="mn-btn mn-btn-ghost" onClick={() => setEdit({ ...edit, plan: { ...plan, reason: '' }, picked: null })}>
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

        {plan && <TallyWell tally={tallyOf(tickets, plan, now)} live={live} />}
        {tickets.length > 0 && (
          <ul className="mp-tickets">
            {tickets.map((t) => (
              <TicketRow key={t.id} ticket={t} plan={plan} now={now} fresh={freshIds(t.id)} onSend={() => onSend(w.key, t.id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
