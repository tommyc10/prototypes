/* Snap: Midnight's UI, where the layout itself does the travelling, and the scroll snaps so
 * each flick plays one move through to a resting frame.
 *
 *   opening → 01   through the counter of the "o" in "noise"
 *   01 → 02        the page is twelve slats; they gather into the weekly bar chart
 *   02 → 03        the next page slides in over it (the old one drifts slower: parallax)
 *   03 → 04        an iris opens out of the Approve button
 *   04 → 05        bands wipe across
 *   05 → end       an iris opens out of the one alert that got through
 */

import { Captions, DASHBOARD_URL } from '../../shared/MidnightBar';
import { Hero } from '../../shared/Frames';
import { CONDITIONS, OUTRO, RULE, STREAM, TEMPS, TICKET, WEEKLY } from '../../shared/story';

const LW = 540;
const LH = 150;
const MIN = 65;
const MAX = 73;
const ly = (t: number) => 14 + ((MAX - t) / (MAX - MIN)) * (LH - 34);
const pts = TEMPS.map((t, i) => [(i / (TEMPS.length - 1)) * LW, ly(t)] as const);
const LINE = pts.reduce((d, [px, py], i) => {
  if (i === 0) return `M${px},${py}`;
  const [qx, qy] = pts[i - 1];
  const mx = (qx + px) / 2;
  return `${d} C${mx},${qy} ${mx},${py} ${px},${py}`;
}, '');

export const SLAT_W = 120;
export const BAR = { x: 600, step: 64, w: 40, base: 800, max: 330 };
export const barHeight = (n: number) => (n / Math.max(...WEEKLY)) * BAR.max;

export function SnapStage({ onReplay }: { onReplay: () => void }) {
  const last = WEEKLY.length - 1;
  return (
    <>
      <Hero cue="Scroll into the o" o />

      {/* ---------- 01 + 02: one page made of slats, which becomes the chart ---------- */}
      <div className="layer s-12">
        {WEEKLY.map((_, i) => (
          <span key={i} className="s-slat" data-now={i === last || undefined} style={{ left: i * SLAT_W }} />
        ))}
        <div className="s-glow" />
        <article className="s-ticket card">
          <header>
            <span className="mono subtle">{TICKET.id}</span>
            <span className="badge-swap">
              <span className="badge s-open">
                <span className="dot" data-s="open" />
                Open
              </span>
              <span className="badge s-cleared">
                <span className="dot" data-s="cleared" />
                Auto-cleared
              </span>
            </span>
            <span className="s-chip">P3</span>
            <span className="mono subtle s-at">{TICKET.at}</span>
          </header>
          <h3>{TICKET.title}</h3>
          <p className="s-sub">
            Paged <strong>{TICKET.group}</strong> · Death Star
          </p>
          <svg width={LW} height={LH} viewBox={`0 0 ${LW} ${LH}`} aria-hidden>
            <defs>
              <clipPath id="s-over">
                <rect x="0" y="0" width={LW} height={ly(70)} />
              </clipPath>
            </defs>
            <line className="s-thresh" x1="0" x2={LW} y1={ly(70)} y2={ly(70)} />
            <path className="s-line" d={LINE} />
            <path className="s-line s-line-over" d={LINE} clipPath="url(#s-over)" />
          </svg>
          <dl className="s-fields">
            <div>
              <dt>CI</dt>
              <dd className="mono">{TICKET.ci}</dd>
            </div>
            <div>
              <dt>Open for</dt>
              <dd>
                <span className="num s-clock">{TICKET.seconds}</span> s
              </dd>
            </div>
          </dl>
          <p className="s-foot">✓ Cleared on its own. Nobody touched it.</p>
        </article>

        <div className="s-count">
          <span className="num s-count-n">214</span>
          <span>alerts like it in 90 days</span>
        </div>
        <span className="s-cap-cell" style={{ left: BAR.x + last * BAR.step, top: BAR.base - barHeight(WEEKLY[last]) - 16, width: BAR.w }} />
        <div className="s-weeks">
          {WEEKLY.map((_, i) => (
            <span key={i} style={{ left: BAR.x + i * BAR.step, width: BAR.w }}>
              {i === last ? 'Now' : `W${i + 1}`}
            </span>
          ))}
        </div>
      </div>

      {/* ---------- 03: the rule ---------- */}
      <div className="layer s-page s-3">
        <div className="s-conds">
          {CONDITIONS.map((c, i) => (
            <div className="s-cond" key={c.label}>
              <span className="s-cond-kw mono">{i === 0 ? 'where' : 'and'}</span>
              <span className="s-cond-label">
                {c.label.toLowerCase()} <span className="subtle">{c.op}</span>
              </span>
              <span className="s-cond-val mono">{c.general}</span>
            </div>
          ))}
        </div>
        <div className="s-rulecard card">
          <div className="s-rulecard-text">
            <span className="s-rulecard-top">
              <span className="mono subtle">{RULE.id}</span>
              <span className="badge">
                <span className="dot" data-s="proposed" />
                Proposed
              </span>
            </span>
            <strong>{RULE.name}</strong>
            <span className="subtle">
              {RULE.confidence}% confidence · 214 incidents · 0 escalated
            </span>
          </div>
          <div className="s-actions">
            <span className="btn s-approve" data-variant="primary">
              Approve <kbd>A</kbd>
            </span>
            <span className="btn" data-variant="danger">
              Reject <kbd>X</kbd>
            </span>
          </div>
        </div>
        <span className="cursor-ring s-ring" aria-hidden />
        <svg className="cursor s-cursor" width="24" height="28" viewBox="0 0 24 28" aria-hidden>
          <path d="M3 2 L3 21.5 L8.2 16.9 L11.9 25 L15.3 23.5 L11.7 15.6 L18.6 15.6 Z" fill="#fafafa" stroke="#0a0a0a" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
      </div>

      {/* ---------- 04: opened by an iris from Approve ---------- */}
      <div className="layer s-page s-4">
        <p className="s-reason">
          <span className="subtle">“</span>
          <span className="s-reason-text">{RULE.reason}</span>
          <span className="subtle">”</span>
        </p>
        <p className="s-decided">
          <span className="s-check">✓</span>
          <span>
            <strong>Approved</strong> by {RULE.who} · {RULE.when} · logged to audit
          </span>
          <span className="badge s-active">
            <span className="dot" data-s="active" />
            Active
          </span>
        </p>
        <dl className="s-stats">
          {RULE.replay.map((r) => (
            <div key={r.label}>
              <dt>
                <span className="num s-stat-n">{r.value}</span>
                {r.suffix}
              </dt>
              <dd>{r.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ---------- 05: wiped in by bands ---------- */}
      <div className="layer s-5">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="s-band" style={{ top: i * 112.5 }} />
        ))}
        <span className="s-lane" />
        <span className="s-gate" />
        <span className="badge s-gate-label">
          <span className="dot" data-s="active" />
          {RULE.id}
        </span>
        {STREAM.map((a, i) => (
          <div className="s-pill" data-match={a.match || undefined} key={i}>
            <span className="dot" data-s="open" />
            <span className="mono">{a.ci}</span>
            <span className="mono subtle">{a.detail}</span>
            <i className="s-strike" />
          </div>
        ))}
        <p className="s-paged">Pages a person →</p>
        <p className="s-tally mono">
          suppressed <b className="num s-tally-s">{STREAM.filter((a) => a.match).length}</b> · paged{' '}
          <b className="num s-tally-p">{STREAM.filter((a) => !a.match).length}</b>
        </p>
      </div>

      {/* ---------- the ending ---------- */}
      <div className="layer s-end">
        <div className="outro">
          <h2 className="outro-title s-end-title">
            <span className="s-end-a">
              Silence the{' '}
              <span className="s-struck">
                noise
                <svg className="s-strikeout" viewBox="0 0 420 60" preserveAspectRatio="none" aria-hidden>
                  <path d="M6,40 C80,28 150,34 220,26 C290,18 350,24 414,14" />
                </svg>
              </span>
              .
            </span>
            <span className="s-end-b">{OUTRO.title}</span>
          </h2>
          <p className="outro-sub">{OUTRO.sub}</p>
          <dl className="outro-stats">
            {OUTRO.stats.map((s) => (
              <div className="outro-stat" key={s.label}>
                <dt>
                  <span className="num s-end-n">{s.value}</span>
                  {s.suffix}
                </dt>
                <dd>{s.label}</dd>
              </div>
            ))}
          </dl>
          <div className="outro-actions">
            <a className="btn" data-variant="primary" href={DASHBOARD_URL}>
              Open the dashboard ↗
            </a>
            <button className="btn" data-variant="ghost" type="button" onClick={onReplay}>
              ↺ Back to the top
            </button>
          </div>
        </div>
      </div>

      <Captions />
    </>
  );
}
