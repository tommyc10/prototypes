/* Throwaway. 3 Field: the chart is the page. Every pattern is a bubble, placed by the two
 * things that decide it: how regular it is (across) and how often it turns out to be real (up).
 * So the question "investigate or suppress?" is answered by where a bubble sits: bottom right
 * is safe to hold back, anything high wants a person.
 *
 * The upload is drawn on the same field: the file's rows scatter across it as they are read,
 * then gather into the patterns they belong to. Drag a box to take several at once. */

import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSize } from '../../../src/pages/hindcast/hooks/useSize';
import { ADVICE_LABEL, REGULAR, RISKY, STATUS_LABEL, WEEK, can, count, dayMonth, plural, share, type Advice, type Pattern, type Status } from '../model';
import { LensBody, LensTabs, StatWell } from '../lenses';
import { Actions, DecisionForm, FilterRow, PatternHead, SearchBox, StatusDot, usePageKeys, type VariantProps } from '../shared';
import { Stages, UploadFlow } from '../upload';

const PAD = { l: 56, r: 40, t: 28, b: 76 };
const DOTS = 150;

interface Spot {
  x: number;
  y: number;
  r: number;
}

/** A repeatable 0 to 1 for the nth thing, so the scatter is the same on every render. */
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Where each bubble sits. Across is regularity, up is the share that became incidents (on a
 *  square-root scale, so the crowd near zero has room), then bubbles that overlap are nudged apart. */
function place(patterns: Pattern[], width: number, height: number) {
  const top = Math.max(0.3, ...patterns.map((p) => p.incidentShare));
  const most = Math.max(1, ...patterns.map((p) => p.count));
  const w = width - PAD.l - PAD.r;
  const h = height - PAD.t - PAD.b;
  const yOf = (s: number) => PAD.t + h - Math.sqrt(Math.min(s, top) / top) * h;
  const xOf = (r: number) => PAD.l + r * w;
  const spots = patterns.map((p) => ({ key: p.key, x: xOf(p.regularity), y: yOf(p.incidentShare), r: 13 + Math.sqrt(p.count / most) * Math.min(30, h / 9) }));
  for (let pass = 0; pass < 120; pass++) {
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        const a = spots[i];
        const b = spots[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const gap = a.r + b.r + 10;
        let d = Math.hypot(dx, dy);
        if (d >= gap) continue;
        if (d < 0.01) [dx, dy, d] = [rand(i + j) - 0.5, -0.5, 0.7];
        const push = (gap - d) / 2;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push * 0.6;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push * 0.6;
      }
    }
    for (const s of spots) {
      s.x = Math.max(PAD.l + s.r * 0.4, Math.min(width - PAD.r - s.r * 0.6, s.x));
      s.y = Math.max(PAD.t + s.r, Math.min(PAD.t + h - s.r - 2, s.y));
    }
  }
  // A name sits under its bubble only where it covers nothing: the biggest patterns choose first.
  const named = new Set<string>();
  const boxes: { l: number; r: number; t: number; b: number }[] = [];
  const hits = (a: { l: number; r: number; t: number; b: number }) => boxes.some((b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t) || spots.some((s) => s.x + s.r > a.l && s.x - s.r < a.r && s.y + s.r > a.t + 2 && s.y - s.r < a.b);
  patterns.forEach((p, i) => {
    const s = spots[i];
    const half = Math.min(150, p.signature.length * 6.4 + 12) / 2;
    const box = { l: s.x - half, r: s.x + half, t: s.y + s.r + 4, b: s.y + s.r + 22 };
    if (box.l < PAD.l || box.r > width - 4 || hits(box)) return;
    named.add(p.key);
    boxes.push(box);
  });
  return { spots: new Map<string, Spot>(spots.map((s) => [s.key, s])), named, xOf, yOf, top };
}

const GROUPS: { advice: Advice; label: string }[] = [
  { advice: 'investigate', label: 'Investigate first' },
  { advice: 'suppress', label: 'Safe to propose' },
  { advice: 'watch', label: 'Watch' },
];

const NONE: Pattern[] = [];
const OPEN: Status[] = ['new', 'investigating', 'proposed'];

export function Field(props: VariantProps) {
  const { ingest, analysis, shown, picked, statusOf, reviews, role, filters, onFilters, deciding } = props;
  const ready = ingest.phase === 'ready' && !!analysis;
  const [plot, size] = useSize<HTMLDivElement>();
  const [hot, setHot] = useState<string | null>(null);
  const [box, setBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const dragFrom = useRef<{ x: number; y: number } | null>(null);

  const patterns = analysis?.patterns ?? NONE;
  const laid = useMemo(() => place(patterns, size.width || 800, size.height || 500), [patterns, size.width, size.height]);
  const shownKeys = new Set(shown.map((p) => p.key));
  const inBox = taken.length ? shown.filter((p) => taken.includes(p.key)) : [];
  const groups = GROUPS.map((g) => ({ ...g, rows: shown.filter((p) => p.advice === g.advice) }));
  const order = inBox.length ? inBox : groups.flatMap((g) => g.rows);

  usePageKeys(props, ready ? order : [], {
    Escape: () => {
      if (ingest.phase === 'mapping' || ingest.phase === 'reading') ingest.reset();
      else if (picked) props.onPick(null);
      else setTaken([]);
    },
  });

  /* The rows of the file, as dots. Each belongs to a pattern in proportion to its size; the
   * rest belong to nothing and fade when the grouping is done. */
  const dots = useMemo(() => {
    const total = Math.max(1, analysis?.rows.length ?? 1);
    const owners: (string | null)[] = [];
    for (const p of patterns) for (let i = 0; i < Math.max(2, Math.round((p.count / total) * DOTS)); i++) owners.push(p.key);
    return Array.from({ length: DOTS }, (_, i) => ({ fx: rand(i + 1), fy: rand(i + 400), owner: owners[Math.floor(rand(i + 900) * Math.max(owners.length, DOTS * 0.82))] ?? null, jx: rand(i + 50) - 0.5, jy: rand(i + 70) - 0.5 }));
  }, [patterns, analysis?.rows.length]);
  const gathered = ingest.phase === 'analysing' && ingest.stage >= 1;

  const at = (e: ReactPointerEvent) => {
    const r = plot.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const brush = {
    onPointerDown: (e: ReactPointerEvent) => {
      if (!ready || (e.target as HTMLElement).closest('.la-bub') || e.button !== 0) return;
      dragFrom.current = at(e);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: ReactPointerEvent) => {
      if (!dragFrom.current) return;
      const p = at(e);
      if (Math.abs(p.x - dragFrom.current.x) + Math.abs(p.y - dragFrom.current.y) > 6) setBox({ x0: dragFrom.current.x, y0: dragFrom.current.y, x1: p.x, y1: p.y });
    },
    onPointerUp: () => {
      if (!dragFrom.current) return;
      dragFrom.current = null;
      if (!box) {
        setTaken([]);
        props.onPick(null);
        return;
      }
      const [l, r, t, b] = [Math.min(box.x0, box.x1), Math.max(box.x0, box.x1), Math.min(box.y0, box.y1), Math.max(box.y0, box.y1)];
      setTaken(shown.filter((p) => { const s = laid.spots.get(p.key)!; return s.x >= l && s.x <= r && s.y >= t && s.y <= b; }).map((p) => p.key));
      props.onPick(null);
      setBox(null);
    },
  };

  const review = picked ? (reviews[picked.key] ?? { status: 'new' as const, events: [] }) : null;
  const yTicks = [0, RISKY, 0.25, 0.5].filter((t) => t <= laid.top + 0.001);
  const xLine = laid.xOf(REGULAR);
  const yLine = laid.yOf(RISKY);
  const takeable = inBox.filter((p) => can(role, 'investigate', statusOf(p.key)).ok);
  const inPattern = patterns.reduce((weeks, p) => weeks.map((n, i) => n + p.weeks[i]), (analysis?.weeklyTotals ?? []).map(() => 0));
  const stripMax = Math.max(1, ...(analysis?.weeklyTotals ?? [1]));

  return (
    <div className="la-field">
      <div className="la-field-main">
        <header className="la-field-head">
          <div>
            <h2>Where each pattern sits</h2>
            <p>{ready ? 'Across: how regular it is. Up: how often it was real. Size: how many alerts. Drag a box to take several.' : 'Every row of your file lands here, then gathers into the patterns it belongs to.'}</p>
          </div>
          {ready && (
            <FilterRow analysis={analysis} span={ingest.data!.span} services={[...new Set(ingest.data!.rows.map((r) => r.service))].sort()} filters={filters} onFilters={onFilters}>
              <SearchBox value={filters.query} onChange={(query) => onFilters({ query })} inputRef={props.searchRef} />
            </FilterRow>
          )}
        </header>

        <div className="la-plot" ref={plot} data-ready={ready || undefined} data-phase={ingest.phase} {...brush}>
          {/* The frame: two thresholds cut the field into what to do. */}
          <div className="la-plot-frame" aria-hidden style={{ left: PAD.l, right: PAD.r, top: PAD.t, bottom: PAD.b }} />
          <i className="la-plot-x" aria-hidden style={{ left: xLine, top: PAD.t, bottom: PAD.b }} />
          <i className="la-plot-y" aria-hidden style={{ top: yLine, left: PAD.l, right: PAD.r }} />
          <span className="la-zone" style={{ left: PAD.l + 12, top: PAD.t + 10 }}>
            Often real: <b>investigate</b>
          </span>
          <span className="la-zone" style={{ right: PAD.r + 12, top: yLine + 10, textAlign: 'right' }}>
            Regular and harmless: <b>safe to propose</b>
          </span>
          <span className="la-zone" style={{ left: PAD.l + 12, top: yLine + 10 }}>
            No rhythm yet: <b>watch</b>
          </span>
          {yTicks.map((t) => (
            <span key={t} className="la-tick la-tick-y" style={{ top: laid.yOf(t), width: PAD.l - 10 }}>
              {share(t)}
            </span>
          ))}
          {[0, 0.25, REGULAR, 0.75, 1].map((t) => (
            <span key={t} className="la-tick la-tick-x" style={{ left: laid.xOf(t), bottom: PAD.b - 44 }}>
              {share(t)}
            </span>
          ))}
          <span className="la-axis-name la-axis-x" style={{ left: PAD.l, right: PAD.r }}>
            Regularity: the share that arrives in the same three hours
          </span>
          <span className="la-axis-name la-axis-y" style={{ top: PAD.t - 22, left: 12 }}>
            Became incidents
          </span>

          {!ready &&
            ingest.phase !== 'empty' &&
            dots.map((d, i) => {
              const s = gathered && d.owner ? laid.spots.get(d.owner) : undefined;
              const x = s ? s.x + d.jx * s.r * 1.1 : PAD.l + 8 + d.fx * (size.width - PAD.l - PAD.r - 16);
              const y = s ? s.y + d.jy * s.r * 1.1 : PAD.t + 8 + d.fy * (size.height - PAD.t - PAD.b - 16);
              return <i key={i} className="la-dotmark" data-lost={(gathered && !d.owner) || undefined} style={{ transform: `translate(${x}px, ${y}px)`, '--i': i } as CSSProperties} aria-hidden />;
            })}
          {ingest.phase === 'analysing' &&
            ingest.stage >= 2 &&
            patterns.map((p) => {
              const s = laid.spots.get(p.key)!;
              return <i key={p.key} className="la-bub-ghost" aria-hidden style={{ width: s.r * 2, height: s.r * 2, transform: `translate(${s.x - s.r}px, ${s.y - s.r}px)` }} />;
            })}

          {ready &&
            patterns.map((p, i) => {
              const s = laid.spots.get(p.key)!;
              const status = statusOf(p.key);
              const dim = !shownKeys.has(p.key) || (taken.length > 0 && !taken.includes(p.key)) || !OPEN.includes(status);
              return (
                <button
                  key={p.key}
                  className="la-bub"
                  data-status={status}
                  data-picked={p.key === picked?.key || undefined}
                  data-hot={p.key === hot || undefined}
                  data-dim={(dim && p.key !== picked?.key) || undefined}
                  data-big={laid.named.has(p.key) || undefined}
                  style={{ width: s.r * 2, height: s.r * 2, transform: `translate(${s.x - s.r}px, ${s.y - s.r}px)`, '--i': i } as CSSProperties}
                  onClick={() => props.onPick(p.key === picked?.key ? null : p.key, 'pointer')}
                  onPointerEnter={() => setHot(p.key)}
                  onPointerLeave={() => setHot(null)}
                  aria-label={`${p.signature}, ${p.service}: ${p.count} alerts, ${share(p.regularity)} regular, ${share(p.incidentShare)} became incidents. ${STATUS_LABEL[status]}.`}
                >
                  <span className="la-bub-disc">{s.r >= 17 && <b>{p.count}</b>}</span>
                  <span className="la-bub-name">{p.signature}</span>
                </button>
              );
            })}
          {box && <i className="la-box" aria-hidden style={{ left: Math.min(box.x0, box.x1), top: Math.min(box.y0, box.y1), width: Math.abs(box.x1 - box.x0), height: Math.abs(box.y1 - box.y0) }} />}

          {(ingest.phase === 'empty' || ingest.phase === 'reading' || ingest.phase === 'mapping') && (
            <div className="la-field-card" data-phase={ingest.phase}>
              <UploadFlow ingest={ingest} analysis={analysis} quiet />
            </div>
          )}
        </div>

        <div className="la-strip" aria-hidden={!ready}>
          <div className="la-strip-label">
            <b>Alerts a week</b>
            {ready && (
              <span>
                {dayMonth(analysis.from)} to {dayMonth(analysis.from + (analysis.scope.weeks - 1) * WEEK)}
              </span>
            )}
          </div>
          <div className="la-strip-bars">
            {ready
              ? analysis.weeklyTotals.map((n, i) => (
                  <div key={analysis.from + i * WEEK} title={`Week of ${dayMonth(analysis.from + i * WEEK)}: ${n} alerts, ${inPattern[i]} in a pattern`}>
                    <i style={{ height: `${(n / stripMax) * 100}%` }} />
                    <i data-part="pattern" style={{ height: `${(inPattern[i] / stripMax) * 100}%` }} />
                    <i data-part="picked" style={{ height: `${((picked ? picked.weeks[i] : inBox.reduce((sum, p) => sum + p.weeks[i], 0)) / stripMax) * 100}%` }} />
                  </div>
                ))
              : Array.from({ length: 12 }, (_, i) => (
                  <div key={i}>{ingest.phase !== 'empty' ? <span className="mn-skel" style={{ height: `${30 + rand(i + 5) * 60}%`, width: '100%' }} /> : <i style={{ height: '6%' }} />}</div>
                ))}
          </div>
          <ul className="la-legend">
            <li>
              <i data-part="rest" /> Every alert
            </li>
            <li>
              <i data-part="pattern" /> In a pattern
            </li>
            <li>
              <i data-part="picked" /> {picked ? picked.id : 'Your selection'}
            </li>
          </ul>
        </div>
      </div>

      <aside className="la-rail">
        {!ready ? (
          ingest.phase === 'analysing' ? (
            <div className="la-rail-wait">
              <h3>Working it out</h3>
              <Stages ingest={ingest} analysis={analysis} />
              <div className="la-rail-ghosts" aria-hidden>
                {Array.from({ length: 7 }, (_, i) => (
                  <span key={i} className="mn-skel" style={{ height: 12, width: `${48 + rand(i + 3) * 44}%` }} />
                ))}
              </div>
            </div>
          ) : (
            <div className="la-rail-wait">
              <h3>What you’ll get</h3>
              <ol className="la-promise">
                <li>
                  <b>A place for every pattern.</b> Where it sits says what to do with it.
                </li>
                <li>
                  <b>The evidence behind it.</b> The weeks, the hours, and the file’s own rows.
                </li>
                <li>
                  <b>Its rule, replayed.</b> What covers it today against what you’d propose.
                </li>
                <li>
                  <b>A trail.</b> The file’s hash, the columns used, and who decided what.
                </li>
              </ol>
            </div>
          )
        ) : picked && review ? (
          <div className="la-inspect" key={picked.key} data-animate={props.arrive || undefined}>
            <button className="mn-link la-back" onClick={() => props.onPick(null)}>
              <ArrowLeft size={13} /> {inBox.length ? `Selection of ${inBox.length}` : 'Every pattern'} <kbd>Esc</kbd>
            </button>
            <PatternHead p={picked} status={statusOf(picked.key)} />
            <StatWell p={picked} />
            <LensTabs lens={props.lens} onLens={props.onLens} review={review} short well />
            <div className="la-inspect-body">
              <LensBody lens={props.lens} p={picked} a={analysis} ingest={ingest} review={review} />
            </div>
            {deciding && deciding.key === picked.key ? (
              <DecisionForm deciding={deciding} p={picked} onCancel={props.onCancelDecision} onDecide={props.onDecide} />
            ) : (
              <footer className="la-rail-foot">
                <Actions p={picked} status={statusOf(picked.key)} role={role} onAct={props.onAct} wide />
              </footer>
            )}
          </div>
        ) : inBox.length ? (
          <div className="la-ranked">
            <header>
              <h3>
                {inBox.length} {plural(inBox.length, 'pattern')} in the box
              </h3>
              <p>
                {count(inBox.reduce((n, p) => n + p.count, 0))} alerts, {inBox.reduce((n, p) => n + p.incidents, 0)} of them real incidents.
              </p>
            </header>
            <div className="la-ranked-rows">
              {inBox.map((p) => (
                <RailRow key={p.key} p={p} status={statusOf(p.key)} onPick={() => props.onPick(p.key, 'pointer')} onHot={setHot} />
              ))}
            </div>
            <footer className="la-rail-foot">
              <div className="la-actions" data-wide>
                <button className="mn-btn mn-btn-ghost" onClick={() => setTaken([])}>
                  Clear <kbd>Esc</kbd>
                </button>
                <button className="mn-btn" disabled={!takeable.length} onClick={() => takeable.forEach((p) => props.onAct(p, 'investigate', 'pointer'))}>
                  Investigate {takeable.length || ''} {plural(takeable.length, 'pattern')}
                </button>
              </div>
            </footer>
          </div>
        ) : (
          <div className="la-ranked" data-arrive>
            <header>
              <h3>What to look at first</h3>
              <p>
                {patterns.length} patterns in {count(analysis.rows.length)} alerts. {count(analysis.loose)} alerts repeat too rarely to be one.
              </p>
            </header>
            <div className="la-ranked-rows">
              {shown.length === 0 && <p className="la-none">{filters.query ? `No pattern matches “${filters.query}”.` : 'Nothing in this scope repeats often enough to be a pattern.'}</p>}
              {groups.map(
                (g) =>
                  g.rows.length > 0 && (
                    <section key={g.advice}>
                      <h4 title={ADVICE_LABEL[g.advice]}>
                        {g.label} <span>{g.rows.length}</span>
                      </h4>
                      {g.rows.map((p) => (
                        <RailRow key={p.key} p={p} status={statusOf(p.key)} onPick={() => props.onPick(p.key, 'pointer')} onHot={setHot} />
                      ))}
                    </section>
                  ),
              )}
            </div>
            <footer className="la-keys">
              <span>
                <kbd>J</kbd> <kbd>K</kbd> Navigate
              </span>
              <span>
                <kbd>/</kbd> Search
              </span>
            </footer>
          </div>
        )}
      </aside>
    </div>
  );
}

function RailRow({ p, status, onPick, onHot }: { p: Pattern; status: Status; onPick: () => void; onHot: (key: string | null) => void }) {
  return (
    <button className="la-row" onClick={onPick} onPointerEnter={() => onHot(p.key)} onPointerLeave={() => onHot(null)} onFocus={() => onHot(p.key)} onBlur={() => onHot(null)}>
      <StatusDot status={status} />
      <span className="la-row-main">
        <span className="la-row-name mn-truncate">{p.signature}</span>
        <span className="la-row-meta mn-truncate">
          <span className="mn-mono">{p.id}</span> · {p.service} · {p.why}
        </span>
      </span>
      <span className="la-row-n">
        <b>{p.count}</b>
        {p.incidents > 0 && <em>{p.incidents}</em>}
      </span>
    </button>
  );
}
