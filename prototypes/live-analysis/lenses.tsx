/* Throwaway: the five ways of looking at one pattern. Every variant shows the same lenses and
 * decides for itself where they sit: tabs in a pane, a drawer, a rail.
 *
 *   Evidence     the weeks, the hours it arrives at, and the file's own rows
 *   Rules        what covers it today against what we'd propose
 *   Maths        every figure, with the working that produced it
 *   Source       where all of this came from: the file, its hash, the columns, the rows
 *   Review       who did what, and why */

import { useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  ACT_PAST,
  FIELDS,
  MIN_COUNT,
  PEOPLE,
  RISKY,
  WEEK,
  bytes,
  calcs,
  clock,
  count,
  dayMonth,
  hourLabel,
  mins,
  perWeek,
  plural,
  share,
  type Analysis,
  type Pattern,
  type Review,
  type RuleFit,
} from './model';
import type { Ingest, LensKey } from './shared';

export const LENSES: { key: LensKey; label: string; short: string }[] = [
  { key: 'evidence', label: 'Evidence', short: 'Evidence' },
  { key: 'rules', label: 'Rule comparison', short: 'Rules' },
  { key: 'maths', label: 'Calculations', short: 'Maths' },
  { key: 'source', label: 'Provenance', short: 'Source' },
  { key: 'review', label: 'Review', short: 'Review' },
];

/** The lens tabs. `short` for a narrow home. */
export function LensTabs({ lens, onLens, review, short, well }: { lens: LensKey; onLens: (l: LensKey) => void; review: Review; short?: boolean; well?: boolean }) {
  return (
    <div className={well ? 'la-seg la-lens-tabs' : 'mn-tabs la-lens-tabs'} role="tablist" aria-label="Lenses">
      {LENSES.map((l) => (
        <button key={l.key} role="tab" className="mn-tab" data-active={l.key === lens || undefined} aria-selected={l.key === lens} onClick={() => onLens(l.key)}>
          {short ? l.short : l.label}
          {l.key === 'review' && review.events.length > 0 && <span>{review.events.length}</span>}
        </button>
      ))}
    </div>
  );
}

/** The four figures that decide most patterns, in a metric well. */
export function StatWell({ p }: { p: Pattern }) {
  return (
    <div className="la-well" role="group" aria-label="Figures">
      <div>
        <b>{perWeek(p.perWeek).replace(' a week', '')}</b>
        <span>a week</span>
      </div>
      <div>
        <b>{share(p.regularity)}</b>
        <span>in the same 3 hours</span>
      </div>
      <div data-bad={p.incidentShare >= RISKY ? '' : undefined}>
        <b>{share(p.incidentShare)}</b>
        <span>became incidents</span>
      </div>
      <div>
        <b>{Number.isNaN(p.medianMins) ? '–' : mins(p.medianMins)}</b>
        <span>median to resolve</span>
      </div>
    </div>
  );
}

/* ---------- evidence ---------- */

function WeekBars({ p, a }: { p: Pattern; a: Analysis }) {
  const [hot, setHot] = useState<number | null>(null);
  const max = Math.max(1, ...p.weeks);
  const weekStart = (i: number) => a.from + i * WEEK;
  return (
    <section className="la-bars" onPointerLeave={() => setHot(null)}>
      <div className="la-sec-head">
        <h3>Week by week</h3>
        <span className="la-read">
          {hot == null ? (
            <>
              Most in a week: <b>{max}</b>
            </>
          ) : (
            <>
              Week of {dayMonth(weekStart(hot))}: <b>{p.weeks[hot]}</b> {plural(p.weeks[hot], 'alert')}
              {p.incidentWeeks[hot] > 0 && (
                <>
                  , <b className="mn-bad">{p.incidentWeeks[hot]}</b> became {plural(p.incidentWeeks[hot], 'an incident', 'incidents')}
                </>
              )}
            </>
          )}
        </span>
      </div>
      <div className="la-bars-plot">
        {p.weeks.map((n, i) => (
          <div key={weekStart(i)} className="la-wk" data-hot={hot === i || undefined} data-now={i === p.weeks.length - 1 || undefined} onPointerEnter={() => setHot(i)}>
            <i style={{ height: `${(n / max) * 100}%` }} />
            <b style={{ height: `${(p.incidentWeeks[i] / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="la-axis">
        <span>{dayMonth(a.from)}</span>
        <ul className="la-legend" aria-label="Key">
          <li>
            <i data-tone="alerts" /> Alerts
          </li>
          <li>
            <i data-tone="incident" /> Became incidents
          </li>
        </ul>
        <span>{dayMonth(weekStart(p.weeks.length - 1))}</span>
      </div>
    </section>
  );
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Heat({ p }: { p: Pattern }) {
  const [hot, setHot] = useState<[number, number] | null>(null);
  const span = Math.min(3, 24 - p.peakFrom);
  return (
    <section className="la-heat" onPointerLeave={() => setHot(null)}>
      <div className="la-sec-head">
        <h3>When it arrives</h3>
        <span className="la-read">
          {hot ? (
            <>
              {DAYS[hot[0]]} {hourLabel(hot[1])}: <b>{p.heat[hot[0]][hot[1]]}</b>
            </>
          ) : (
            <>
              <b>{p.peakCount}</b> of {p.count} between {hourLabel(p.peakFrom)} and {hourLabel(p.peakFrom + 3)}
            </>
          )}
        </span>
      </div>
      <div className="la-heat-grid" role="img" aria-label={`Weekday by hour. ${p.peakCount} of ${p.count} arrive between ${hourLabel(p.peakFrom)} and ${hourLabel(p.peakFrom + 3)}.`}>
        {p.heat.map((day, d) => (
          <div key={d} className="la-heat-row">
            <span>{DAYS[d][0]}</span>
            {day.map((n, h) => (
              <i key={h} onPointerEnter={() => setHot([d, h])} style={n ? { background: `color-mix(in srgb, var(--fg) ${Math.round(14 + (n / p.heatMax) * 78)}%, transparent)` } : undefined} />
            ))}
          </div>
        ))}
        <div className="la-heat-row la-heat-peak" aria-hidden>
          <span />
          <b style={{ gridColumn: `${p.peakFrom + 2} / span ${span}` }} />
        </div>
        <div className="la-heat-row la-heat-hours" aria-hidden>
          <span />
          {[0, 6, 12, 18].map((h) => (
            <em key={h} style={{ gridColumn: `${h + 2} / span 6` }}>
              {hourLabel(h)}
            </em>
          ))}
        </div>
      </div>
    </section>
  );
}

function Rows({ p }: { p: Pattern }) {
  const rows = p.rows.slice(-60).reverse();
  return (
    <section className="la-rows">
      <div className="la-sec-head">
        <h3>Rows from the file</h3>
        <span className="la-read">
          {rows.length < p.count ? `Newest ${rows.length} of ${p.count}` : `All ${p.count}`}
        </span>
      </div>
      <div className="la-rows-scroll">
        <table>
          <thead>
            <tr>
              <th>Line</th>
              <th>Raised</th>
              <th>Severity</th>
              <th>Outcome</th>
              <th className="la-num">Took</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.line}>
                <td className="mn-mono">{count(r.line)}</td>
                <td>
                  {dayMonth(r.at)} <span className="mn-subtle">{clock(r.at)}</span>
                </td>
                <td>P{r.sev}</td>
                <td>{r.incident ? <span className="la-incident">Incident</span> : <span className="mn-subtle">Cleared</span>}</td>
                <td className="la-num">{Number.isNaN(r.mins) ? '–' : mins(r.mins)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Evidence({ p, a }: { p: Pattern; a: Analysis }) {
  return (
    <div className="la-evidence">
      <WeekBars p={p} a={a} />
      <Heat p={p} />
      <Rows p={p} />
    </div>
  );
}

/* ---------- rule comparison ---------- */

function RuleCard({ title, fit, of, empty }: { title: string; fit: RuleFit | null; of: number; empty?: string }) {
  return (
    <div className="la-rule" data-empty={!fit || undefined}>
      <div className="la-rule-top">
        <span className="la-rule-title">{title}</span>
        {fit?.id && <span className="mn-mono mn-subtle">{fit.id}</span>}
      </div>
      {fit ? (
        <>
          <div className="la-rule-name mn-truncate">{fit.name}</div>
          <pre className="la-code">
            {fit.condition.map((line, i) => (
              <span key={i}>
                <em>{i ? 'and' : 'when'}</em> {line}
                {'\n'}
              </span>
            ))}
          </pre>
          <div className="la-rule-figs">
            <div>
              <b>
                {fit.caught}
                <small> of {of}</small>
              </b>
              <span>alerts held back</span>
              <span className="la-meter" aria-hidden>
                <i style={{ transform: `scaleX(${fit.caught / of})` }} />
              </span>
            </div>
            <div data-bad={fit.hidden ? '' : undefined}>
              <b>{fit.hidden}</b>
              <span>real {plural(fit.hidden, 'incident', 'incidents')} hidden</span>
            </div>
          </div>
        </>
      ) : (
        <p className="la-rule-none">{empty}</p>
      )}
    </div>
  );
}

function Rules({ p, a }: { p: Pattern; a: Analysis }) {
  const { existing, proposal } = p;
  const both = existing ? [...existing.lines].filter((l) => proposal.lines.has(l)).length : 0;
  const fresh = proposal.caught - both;
  const pages = p.count - proposal.caught;
  const parts = [
    { key: 'both', n: both, label: 'Held back today' },
    { key: 'fresh', n: fresh, label: 'Newly held back' },
    { key: 'pages', n: pages, label: 'Still pages: P1' },
  ];
  return (
    <div className="la-compare">
      {existing && existing.hidden > 0 && (
        <p className="la-callout" data-tone="red">
          <b>{existing.id}</b> has hidden <b>{existing.hidden}</b> real {plural(existing.hidden, 'incident', 'incidents')} in {a.scope.weeks} weeks. Investigate it before proposing anything wider.
        </p>
      )}
      {proposal.hidden > 0 && !(existing && existing.hidden > 0) && (
        <p className="la-callout" data-tone="red">
          The proposal would have hidden <b>{proposal.hidden}</b> real {plural(proposal.hidden, 'incident', 'incidents')} in {a.scope.weeks} weeks. It isn’t safe as it stands.
        </p>
      )}
      <div className="la-rule-pair">
        <RuleCard title="Today" fit={existing} of={p.count} empty="No rule touches this pattern. Every one of these alerts reaches a person." />
        <RuleCard title="Proposed" fit={proposal} of={p.count} />
      </div>
      <section className="la-diff">
        <div className="la-sec-head">
          <h3>What changes</h3>
          <span className="la-read">
            Stops <b>{perWeek(p.saved)}</b> more, hides <b className={proposal.hidden ? 'mn-bad' : undefined}>{proposal.hidden}</b> real {plural(proposal.hidden, 'incident', 'incidents')}
          </span>
        </div>
        <div className="la-diff-bar" role="img" aria-label={parts.map((x) => `${x.label}: ${x.n}`).join(', ')}>
          {parts.map((x) => (
            <i key={x.key} data-part={x.key} style={{ flexGrow: x.n }} />
          ))}
        </div>
        <ul className="la-legend">
          {parts.map((x) => (
            <li key={x.key}>
              <i data-part={x.key} /> {x.label} <b>{x.n}</b>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------- calculations ---------- */

function Maths({ p, a }: { p: Pattern; a: Analysis }) {
  return (
    <dl className="la-maths">
      {calcs(p, a).map((c) => (
        <div key={c.label}>
          <dt>{c.label}</dt>
          <dd>
            <b data-tone={c.tone}>{c.value}</b>
            <span className="mn-mono">{c.working}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- provenance ---------- */

function Source({ p, a, ingest }: { p: Pattern; a: Analysis; ingest: Ingest }) {
  const source = ingest.source!;
  const data = ingest.data!;
  const lines = p.rows.map((r) => r.line);
  const copy = () => navigator.clipboard?.writeText(source.hash).then(() => toast('Hash copied'));
  return (
    <dl className="la-source">
      <div>
        <dt>File</dt>
        <dd>
          <b>{source.name}</b>
          <span>
            {bytes(source.size)}, read {dayMonth(source.readAt)} at {new Date(source.readAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} by {source.by}
          </span>
        </dd>
      </div>
      <div>
        <dt>SHA-256</dt>
        <dd>
          <button className="la-hash mn-mono" onClick={copy} title="Copy the whole hash">
            {source.hash.slice(0, 16)}…{source.hash.slice(-8)} <Copy size={12} />
          </button>
          <span>The same file always gives the same hash, so anyone can check they are looking at this one.</span>
        </dd>
      </div>
      <div>
        <dt>Rows</dt>
        <dd>
          <b>
            {count(data.rows.length)} of {count(ingest.table!.rows.length)} kept
          </b>
          <span>
            {data.dropped.length
              ? `Dropped ${data.dropped.length}: ${data.dropped
                  .slice(0, 4)
                  .map((d) => `line ${count(d.line)} (${d.why})`)
                  .join(', ')}${data.dropped.length > 4 ? '…' : ''}.`
              : 'Every row could be read.'}
          </span>
        </dd>
      </div>
      <div>
        <dt>Columns</dt>
        <dd className="la-source-cols">
          {FIELDS.filter((f) => ingest.mapping[f.key]).map((f) => (
            <span key={f.key}>
              <span className="mn-mono">{ingest.mapping[f.key]}</span> → {f.label}
            </span>
          ))}
        </dd>
      </div>
      <div>
        <dt>In scope</dt>
        <dd>
          <b>
            {dayMonth(a.from)} to {dayMonth(a.to - 1)}
          </b>
          <span>
            {a.scope.weeks} weeks, {a.scope.service === 'all' ? 'every service' : a.scope.service}, {a.scope.sevs.length === 4 ? 'every severity' : a.scope.sevs.map((s) => `P${s}`).join(' and ')}: {count(a.rows.length)} rows.
          </span>
        </dd>
      </div>
      <div>
        <dt>This pattern</dt>
        <dd>
          <b>
            {p.count} rows with this service and alert name
          </b>
          <span className="mn-mono">
            lines {lines.slice(0, 6).map(count).join(', ')}
            {lines.length > 6 ? ` … ${count(lines[lines.length - 1])}` : ''}
          </span>
        </dd>
      </div>
      <div>
        <dt>Method</dt>
        <dd>
          <span>
            Rows are grouped by service and alert name. A group is a pattern once it has {MIN_COUNT} alerts across 3 different weeks. Rules are replayed over the same rows; P1 always pages.
          </span>
        </dd>
      </div>
    </dl>
  );
}

/* ---------- review ---------- */

const titleOf = (name: string) => Object.values(PEOPLE).find((x) => x.name === name)?.title ?? '';

function ReviewLog({ p, review }: { p: Pattern; review: Review }) {
  const found = { who: 'Live analysis', text: `Found ${p.count} alerts across ${p.weeksActive} weeks`, note: p.why };
  return (
    <ol className="la-log">
      {[...review.events].reverse().map((e, i) => (
        <li key={review.events.length - i} data-act={e.act}>
          <i aria-hidden />
          <div>
            <p>
              <b>{e.who}</b> <span className="mn-subtle">{titleOf(e.who)}</span>
            </p>
            <p>
              {p.id} {ACT_PAST[e.act]} · <span className="mn-subtle">{new Date(e.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
            {e.note && <blockquote>{e.note}</blockquote>}
          </div>
        </li>
      ))}
      <li data-act="found">
        <i aria-hidden />
        <div>
          <p>
            <b>{found.who}</b>
          </p>
          <p>{found.text}</p>
          <blockquote>{found.note}</blockquote>
        </div>
      </li>
    </ol>
  );
}

/** One lens, whichever is asked for. */
export function LensBody({ lens, p, a, ingest, review }: { lens: LensKey; p: Pattern; a: Analysis; ingest: Ingest; review: Review }) {
  return (
    <div className="la-lens" data-lens={lens}>
      {lens === 'evidence' && <Evidence p={p} a={a} />}
      {lens === 'rules' && <Rules p={p} a={a} />}
      {lens === 'maths' && <Maths p={p} a={a} />}
      {lens === 'source' && <Source p={p} a={a} ingest={ingest} />}
      {lens === 'review' && <ReviewLog p={p} review={review} />}
    </div>
  );
}
