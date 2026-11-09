/* Throwaway. 1 Desk: a list of patterns on the left, one pattern on the right, and five lenses
 * on it as tabs. The app's own list-and-detail, so nothing here has to be learned.
 *
 * The upload happens where the pattern will be: the pane is the stage, and the list waits
 * beside it in the shape of the rows that are coming. */

import { useEffect, type CSSProperties } from 'react';
import { count, perWeek, plural, type Advice, type Pattern, type Status } from '../model';
import { LensBody, LensTabs, StatWell } from '../lenses';
import { Actions, DecisionForm, FilterRow, PatternHead, SearchBox, Spark, StatusDot, usePageKeys, type VariantProps } from '../shared';
import { UploadFlow } from '../upload';

const SECTIONS: { label: string; has: Status[] }[] = [
  { label: 'To decide', has: ['new', 'investigating'] },
  { label: 'Waiting for a governor', has: ['proposed'] },
  { label: 'Decided', has: ['approved', 'rejected', 'dismissed'] },
];

const RANK: Record<Advice, number> = { investigate: 0, suppress: 1, watch: 2 };

export function Desk(props: VariantProps) {
  const { ingest, analysis, shown, picked, statusOf, reviews, role, filters, onFilters, deciding } = props;
  const ready = ingest.phase === 'ready' && !!analysis;

  // What wants a person first comes first: investigate, then the safe ones, then the rest.
  const sections = SECTIONS.map((s) => ({
    ...s,
    rows: shown.filter((p) => s.has.includes(statusOf(p.key))).sort((a, b) => RANK[a.advice] - RANK[b.advice] || b.count - a.count),
  }));
  const order = ready ? sections.flatMap((s) => s.rows) : [];
  usePageKeys(props, order);

  // The desk always has something on it.
  const first = order[0]?.key;
  useEffect(() => {
    if (ready && !picked && first) props.onPick(first, 'key');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, picked?.key, first]);

  const waiting = ingest.phase !== 'empty' && !ready;
  const ghosts = ingest.stage >= 2 && analysis ? Math.min(12, analysis.patterns.length) : 8;
  let n = 0;

  return (
    <div className="la-desk">
      <aside className="la-desk-list">
        <header className="la-desk-list-head">
          <div className="la-desk-title">
            <h2>Patterns</h2>
            {ready && (
              <span className="mn-subtle">
                {shown.length === analysis.patterns.length ? analysis.patterns.length : `${shown.length} of ${analysis.patterns.length}`} · {count(analysis.rows.length)} alerts
              </span>
            )}
          </div>
          {ready && (
            <>
              <SearchBox value={filters.query} onChange={(query) => onFilters({ query })} inputRef={props.searchRef} />
              <FilterRow analysis={analysis} span={ingest.data!.span} services={[...new Set(ingest.data!.rows.map((r) => r.service))].sort()} filters={filters} onFilters={onFilters} />
            </>
          )}
        </header>

        {ready ? (
          <nav className="la-desk-rows" aria-label="Patterns" data-arrive>
            {order.length === 0 && (
              <p className="la-none">
                {filters.query ? `No pattern matches “${filters.query}”.` : 'Nothing in this scope repeats often enough to be a pattern. Widen the lookback or clear the filters.'}
              </p>
            )}
            {sections.map(
              (s) =>
                s.rows.length > 0 && (
                  <section key={s.label}>
                    <h3>
                      {s.label} <span>{s.rows.length}</span>
                    </h3>
                    {s.rows.map((p) => (
                      <Row key={p.key} p={p} status={statusOf(p.key)} current={p.key === picked?.key} index={n++} onPick={() => props.onPick(p.key, 'pointer')} />
                    ))}
                  </section>
                ),
            )}
          </nav>
        ) : waiting ? (
          <div className="la-desk-rows" aria-hidden>
            <span className="mn-skel la-ghost-label" />
            {Array.from({ length: ghosts }, (_, i) => (
              <div key={i} className="la-row la-row-ghost">
                <span className="mn-skel" data-shape="pill" style={{ width: 8, height: 8 }} />
                <span className="la-row-main">
                  <span className="mn-skel" style={{ width: `${52 + ((i * 37) % 40)}%`, height: 12 }} />
                  <span className="mn-skel" style={{ width: `${34 + ((i * 23) % 30)}%`, height: 10 }} />
                </span>
                <span className="mn-skel" style={{ width: 44, height: 18 }} />
                <span className="mn-skel" style={{ width: 22, height: 12 }} />
              </div>
            ))}
          </div>
        ) : (
          <p className="la-none">The patterns in your file will list here, the ones that want a person first.</p>
        )}

        <footer className="la-keys">
          <span>
            <kbd>J</kbd> <kbd>K</kbd> Navigate
          </span>
          <span>
            <kbd>/</kbd> Search
          </span>
          <span>
            <kbd>U</kbd> Upload
          </span>
        </footer>
      </aside>

      <section className="la-desk-pane">
        {!ready ? (
          <div className="la-stage">
            <UploadFlow ingest={ingest} analysis={analysis} />
          </div>
        ) : picked ? (
          <>
            <div className="la-detail" key={picked.key} data-animate={props.arrive || undefined}>
              <PatternHead p={picked} status={statusOf(picked.key)} />
              <StatWell p={picked} />
              <LensTabs lens={props.lens} onLens={props.onLens} review={reviews[picked.key] ?? { status: 'new', events: [] }} />
              <div className="la-detail-body">
                <LensBody lens={props.lens} p={picked} a={analysis} ingest={ingest} review={reviews[picked.key] ?? { status: 'new', events: [] }} />
              </div>
            </div>
            {deciding && deciding.key === picked.key ? (
              <DecisionForm deciding={deciding} p={picked} onCancel={props.onCancelDecision} onDecide={props.onDecide} />
            ) : (
              <div className="la-bar">
                <span className="la-bar-text mn-truncate">
                  Suppressing it stops <b>{perWeek(picked.saved)}</b>, hides <b className={picked.proposal.hidden ? 'mn-bad' : undefined}>{picked.proposal.hidden}</b> real {plural(picked.proposal.hidden, 'incident', 'incidents')}
                </span>
                <Actions p={picked} status={statusOf(picked.key)} role={role} onAct={props.onAct} />
              </div>
            )}
          </>
        ) : (
          <p className="la-none la-none-pane">Pick a pattern to see its evidence.</p>
        )}
      </section>
    </div>
  );
}

function Row({ p, status, current, index, onPick }: { p: Pattern; status: Status; current: boolean; index: number; onPick: () => void }) {
  return (
    <button className="la-row" aria-current={current || undefined} onClick={onPick} style={{ '--i': Math.min(index, 14) } as CSSProperties}>
      <StatusDot status={status} />
      <span className="la-row-main">
        <span className="la-row-name mn-truncate">{p.signature}</span>
        <span className="la-row-meta mn-truncate">
          <span className="mn-mono">{p.id}</span> · {p.service}
        </span>
      </span>
      <Spark weeks={p.weeks} />
      <span className="la-row-n" title={`${p.count} alerts, ${p.incidents} became incidents`}>
        <b>{p.count}</b>
        {p.incidents > 0 && <em>{p.incidents}</em>}
      </span>
    </button>
  );
}
