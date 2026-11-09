/* Throwaway. 2 Flow: the review is the layout. Four lanes, a card per pattern, and a decision
 * is a card moved from one lane to the next: drag it, or press its key. The strip on top is
 * the sum of the board, and it moves as the cards do.
 *
 * The upload rises from the foot of the board as a sheet; when it's done, the cards are dealt
 * into the first lane. A picked card opens a drawer, so the board never leaves. */

import { useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { useTweenedNumbers } from '../../../src/pages/hindcast/hooks/useTween';
import { ACT_LABEL, RISKY, can, perWeek, share, type Act, type Pattern, type Status } from '../model';
import { LensBody, LensTabs, StatWell } from '../lenses';
import { Actions, AdviceChip, DecisionForm, FilterRow, PatternHead, SearchBox, Spark, StatusBadge, usePageKeys, type VariantProps } from '../shared';
import { UploadFlow } from '../upload';

const LANES: { key: string; label: string; has: Status[]; act?: Act; hint: string }[] = [
  { key: 'found', label: 'Found', has: ['new'], act: 'reopen', hint: 'What the file shows repeating. Nobody has these yet.' },
  { key: 'investigating', label: 'Investigating', has: ['investigating'], act: 'investigate', hint: 'Drag a pattern here to take it, or press I.' },
  { key: 'proposed', label: 'Proposed', has: ['proposed'], act: 'propose', hint: 'Suppression proposals wait here for a rule governor.' },
  { key: 'decided', label: 'Decided', has: ['approved', 'rejected', 'dismissed'], hint: 'Approved, rejected and dismissed patterns end up here.' },
];

const VERDICTS: Act[] = ['approve', 'reject', 'dismiss'];
const one = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

export function Flow(props: VariantProps) {
  const { ingest, analysis, shown, picked, statusOf, reviews, role, filters, onFilters, deciding } = props;
  const ready = ingest.phase === 'ready' && !!analysis;
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const lanes = LANES.map((l) => ({ ...l, cards: ready ? shown.filter((p) => l.has.includes(statusOf(p.key))) : [] }));
  usePageKeys(props, lanes.flatMap((l) => l.cards));

  const dragged = drag ? shown.find((p) => p.key === drag) : undefined;
  const allowed = (act: Act | undefined) => (dragged && act ? can(role, act, statusOf(dragged.key)) : { ok: false, why: undefined });
  const drop = (act: Act) => {
    if (dragged) props.onAct(dragged, act, 'pointer');
    setDrag(null);
    setOver(null);
  };
  const target = (id: string, act: Act | undefined) => ({
    'data-drop': dragged ? (allowed(act).ok ? 'yes' : 'no') : undefined,
    'data-over': over === id || undefined,
    onDragOver: (e: React.DragEvent) => {
      if (!allowed(act).ok) return;
      e.preventDefault();
      if (over !== id) setOver(id);
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver((o) => (o === id ? null : o));
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (act && allowed(act).ok) drop(act);
    },
  });

  // The strip: where this file's pages go, a week. It counts as cards change lanes.
  const weeks = analysis?.scope.weeks ?? 1;
  const all = analysis?.patterns ?? [];
  const sum = (list: Pattern[], f: (p: Pattern) => number) => list.reduce((n, p) => n + f(p), 0) / weeks;
  const figures = {
    total: (analysis?.rows.length ?? 0) / weeks,
    today: sum(all, (p) => p.existing?.caught ?? 0),
    approved: sum(all.filter((p) => statusOf(p.key) === 'approved'), (p) => p.saved * weeks),
    proposed: sum(all.filter((p) => statusOf(p.key) === 'proposed'), (p) => p.saved * weeks),
  };
  const f = useTweenedNumbers(figures);
  const rest = Math.max(0, f.total - f.today - f.approved - f.proposed);
  const review = picked ? (reviews[picked.key] ?? { status: 'new' as const, events: [] }) : null;
  let n = 0;

  return (
    <div className="la-flow">
      <header className="la-ledger">
        {ready ? (
          <>
            <p className="la-ledger-text">
              <b>{one(f.total)}</b> alerts a week in this file. Today’s rules hold back <b>{one(f.today)}</b>; what’s approved here adds <b>{one(f.approved)}</b>, and open proposals would add <b>{one(f.proposed)}</b>. <b>{one(rest)}</b> still reach a person.
            </p>
            <div className="la-ledger-bar" role="img" aria-label="Where a week of alerts goes">
              <i data-part="today" style={{ flexGrow: f.today }} title="Held back by today’s rules" />
              <i data-part="approved" style={{ flexGrow: f.approved }} title="Approved here" />
              <i data-part="proposed" style={{ flexGrow: f.proposed }} title="Proposed, waiting" />
              <i data-part="rest" style={{ flexGrow: rest }} title="Still reaches a person" />
            </div>
            <div className="la-ledger-tools">
              <ul className="la-legend">
                <li>
                  <i data-part="today" /> Today’s rules
                </li>
                <li>
                  <i data-part="approved" /> Approved
                </li>
                <li>
                  <i data-part="proposed" /> Proposed
                </li>
                <li>
                  <i data-part="rest" /> Reaches a person
                </li>
              </ul>
              <FilterRow analysis={analysis} span={ingest.data!.span} services={[...new Set(ingest.data!.rows.map((r) => r.service))].sort()} filters={filters} onFilters={onFilters}>
                <SearchBox value={filters.query} onChange={(query) => onFilters({ query })} inputRef={props.searchRef} />
              </FilterRow>
            </div>
          </>
        ) : (
          <p className="la-ledger-text">A board for the review: what the file shows repeating starts on the left, and every decision moves a card to the right.</p>
        )}
      </header>

      <div className="la-board" data-dragging={drag ? '' : undefined} data-open={picked ? '' : undefined}>
        {lanes.map((lane) => {
          const waiting = !ready && ingest.phase !== 'empty' && lane.key === 'found';
          const verdicts = lane.key === 'decided' && !!dragged;
          return (
            <section key={lane.key} className="la-lane" {...(lane.key === 'decided' ? {} : target(lane.key, lane.act))} aria-label={lane.label}>
              <h3>
                {lane.label}
                {ready && <span>{lane.cards.length}</span>}
                {ready && lane.cards.length > 0 && <em>{perWeek(lane.cards.reduce((sum, p) => sum + p.perWeek, 0))}</em>}
              </h3>
              <div className="la-lane-body">
                {verdicts ? (
                  VERDICTS.map((act) => (
                    <div key={act} className="la-verdict" {...target(`decided-${act}`, act)}>
                      <b>{ACT_LABEL[act]}</b>
                      <span>{allowed(act).ok ? 'Let go here' : allowed(act).why}</span>
                    </div>
                  ))
                ) : waiting ? (
                  Array.from({ length: ingest.stage >= 2 && analysis ? Math.min(6, analysis.patterns.length) : 4 }, (_, i) => <span key={i} className="mn-skel la-card-ghost" data-shape="card" />)
                ) : lane.cards.length ? (
                  lane.cards.map((p) => (
                    <Card
                      key={p.key}
                      p={p}
                      status={statusOf(p.key)}
                      current={p.key === picked?.key}
                      index={n++}
                      draggable={role !== 'viewer'}
                      dragging={drag === p.key}
                      onPick={() => props.onPick(p.key === picked?.key ? null : p.key, 'pointer')}
                      onDrag={setDrag}
                      onDragEnd={() => {
                        setDrag(null);
                        setOver(null);
                      }}
                    />
                  ))
                ) : (
                  <p className="la-lane-hint">{lane.hint}</p>
                )}
              </div>
            </section>
          );
        })}

        <div className="la-sheet" data-shown={!ready || undefined} inert={ready}>
          <UploadFlow ingest={ingest} analysis={analysis} quiet />
        </div>

        {ready && picked && review && (
          <aside className="la-drawer" key="drawer" data-animate={props.arrive || undefined} aria-label={picked.signature}>
            <PatternHead p={picked} status={statusOf(picked.key)}>
              <button className="mn-icon-btn la-drawer-close" onClick={() => props.onPick(null)} aria-label="Close" title="Close  Esc">
                <X size={15} />
              </button>
            </PatternHead>
            <StatWell p={picked} />
            <LensTabs lens={props.lens} onLens={props.onLens} review={review} short well />
            <div className="la-drawer-body">
              <LensBody lens={props.lens} p={picked} a={analysis} ingest={ingest} review={review} />
            </div>
            {deciding && deciding.key === picked.key ? (
              <DecisionForm deciding={deciding} p={picked} onCancel={props.onCancelDecision} onDecide={props.onDecide} />
            ) : (
              <footer className="la-drawer-foot">
                <Actions p={picked} status={statusOf(picked.key)} role={role} onAct={props.onAct} wide />
              </footer>
            )}
          </aside>
        )}
      </div>

      <footer className="la-keys">
        <span>
          <kbd>J</kbd> <kbd>K</kbd> Next card
        </span>
        <span>
          <kbd>I</kbd> Investigate
        </span>
        <span>
          <kbd>P</kbd> Propose
        </span>
        <span>
          <kbd>A</kbd> Approve
        </span>
        <span>
          <kbd>X</kbd> Dismiss or reject
        </span>
        <span>
          <kbd>Esc</kbd> Close
        </span>
      </footer>
    </div>
  );
}

function Card({
  p,
  status,
  current,
  index,
  draggable,
  dragging,
  onPick,
  onDrag,
  onDragEnd,
}: {
  p: Pattern;
  status: Status;
  current: boolean;
  index: number;
  draggable: boolean;
  dragging: boolean;
  onPick: () => void;
  onDrag: (key: string) => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      className="la-card"
      aria-current={current || undefined}
      data-dragging={dragging || undefined}
      draggable={draggable}
      onClick={onPick}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', p.id);
        e.dataTransfer.effectAllowed = 'move';
        onDrag(p.key);
      }}
      onDragEnd={onDragEnd}
      style={{ '--i': Math.min(index, 16) } as CSSProperties}
    >
      <span className="la-card-top">
        {status === 'new' || status === 'investigating' || status === 'proposed' ? <AdviceChip advice={p.advice} /> : <StatusBadge status={status} />}
        <span className="mn-mono mn-subtle">{p.id}</span>
      </span>
      <span className="la-card-name">{p.signature}</span>
      <span className="la-card-meta mn-truncate">{p.service}</span>
      <span className="la-card-foot">
        <Spark weeks={p.weeks} />
        <span>
          <b>{perWeek(p.perWeek)}</b>
        </span>
        <span data-bad={p.incidentShare >= RISKY || undefined}>
          <b>{share(p.incidentShare)}</b> incidents
        </span>
      </span>
    </button>
  );
}
