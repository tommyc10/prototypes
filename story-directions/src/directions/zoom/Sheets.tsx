/* The two pages you zoom into: the alert's and the rule's. Each is a full 1440 × 900 Midnight
 * screen, and the same component is also drawn as a miniature inside the scene before it, so
 * every zoom crossfades between two copies of the same markup.
 *
 * `phase` draws a miniature in a particular state. Full-size pages use the end state; the
 * timeline sets their starting state. Content sits right of x 520: captions own the left. */

import { CONDITIONS, RULE, TEMPS, TICKET } from '../../shared/story';

const W = 820;
const H = 220;
const MIN = 65;
const MAX = 73;
const y = (t: number) => 18 + ((MAX - t) / (MAX - MIN)) * (H - 50);
const pts = TEMPS.map((t, i) => [(i / (TEMPS.length - 1)) * W, y(t)] as const);
const LINE = pts.reduce((d, [px, py], i) => {
  if (i === 0) return `M${px},${py}`;
  const [qx, qy] = pts[i - 1];
  const mx = (qx + px) / 2;
  return `${d} C${mx},${qy} ${mx},${py} ${px},${py}`;
}, '');
const PEAK = pts[TEMPS.indexOf(Math.max(...TEMPS))];

export function TicketSheet({ phase = 'end' }: { phase?: 'start' | 'end' }) {
  const start = phase === 'start';
  return (
    <div className="z-sheet" data-phase={phase}>
      <header className="z-head">
        <span className="mono subtle">{TICKET.id}</span>
        <span className="badge-swap">
          <span className="badge z-open" style={start ? undefined : { opacity: 0 }}>
            <span className="dot" data-s="open" />
            Open
          </span>
          {!start && (
            <span className="badge z-cleared">
              <span className="dot" data-s="cleared" />
              Auto-cleared
            </span>
          )}
        </span>
        <span className="z-chip">P3</span>
        <span className="mono subtle z-at">{TICKET.at}</span>
      </header>
      <h2 className="z-title">{TICKET.title}</h2>
      <p className="z-sub">
        Paged <strong>{TICKET.group}</strong> · Death Star · 1 person woken
      </p>
      <svg className="z-chart" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
        <defs>
          <clipPath id="z-over">
            <rect x="0" y="0" width={W} height={y(70)} />
          </clipPath>
        </defs>
        <line className="z-threshold" x1="0" x2={W} y1={y(70)} y2={y(70)} />
        <text className="z-threshold-label" x={W} y={y(70) - 8} textAnchor="end">
          70 °C warning line
        </text>
        {!start && (
          <>
            <path className="z-line" d={LINE} />
            <path className="z-line z-line-over" d={LINE} clipPath="url(#z-over)" />
          </>
        )}
        <g className="z-peak" opacity={start ? 0 : 1}>
          <circle cx={PEAK[0]} cy={PEAK[1]} r="4.5" />
          <text x={PEAK[0] + 12} y={PEAK[1] - 10}>
            {TICKET.peak}
          </text>
        </g>
        <text className="z-ax" x="0" y={H - 4}>
          {TICKET.at}
        </text>
        <text className="z-ax" x={W} y={H - 4} textAnchor="end">
          {TICKET.clearedAt}
        </text>
      </svg>
      <dl className="z-fields">
        <div>
          <dt>CI</dt>
          <dd className="mono">{TICKET.ci}</dd>
        </div>
        <div>
          <dt>Peak</dt>
          <dd>{TICKET.peak}</dd>
        </div>
        <div>
          <dt>Open for</dt>
          <dd>
            <span className="num z-clock">{start ? 0 : TICKET.seconds}</span> s
          </dd>
        </div>
      </dl>
      {!start && <p className="z-foot">✓ Cleared on its own. Nobody touched it.</p>}
    </div>
  );
}

export function RuleSheet({ phase = 'end' }: { phase?: 'proposed' | 'end' }) {
  const proposed = phase === 'proposed';
  return (
    <div className="z-sheet z-rule" data-phase={phase}>
      <header className="z-head">
        <span className="mono subtle">{RULE.id}</span>
        <span className="badge-swap">
          <span className="badge z-proposed" style={proposed ? undefined : { opacity: 0 }}>
            <span className="dot" data-s="proposed" />
            Proposed
          </span>
          {!proposed && (
            <span className="badge z-active">
              <span className="dot" data-s="active" />
              Active
            </span>
          )}
        </span>
        <span className="mono subtle z-at">Pattern miner v4.2</span>
      </header>
      <h2 className="z-title">{RULE.name}</h2>
      <p className="z-sub">
        Scoped to <strong>Tractor Beam Ops</strong> · Death Star
      </p>
      <div className="z-stats">
        <Stat label="Confidence" value={`${RULE.confidence}%`} meter={RULE.confidence} />
        <Stat label="Purity" value="98%" meter={98} />
        <Stat label="Incidents" value="214" />
        <Stat label="Escalated" value="0" />
      </div>
      <div className="code z-code">
        {CONDITIONS.map((c, i) => (
          <div className="z-code-line" key={c.label}>
            <span className="code-kw">{i === 0 ? 'where' : '  and'}</span>
            <span>{c.label.toLowerCase()}</span>
            <span className="code-op">{c.op}</span>
            <span className="code-val z-cond-val">{c.general}</span>
          </div>
        ))}
      </div>
      <div className="well z-replay">
        {RULE.replay.map((r) => (
          <div key={r.label} data-bad={undefined}>
            <b className="num">
              {r.value}
              {r.suffix}
            </b>
            <span>{r.label}</span>
          </div>
        ))}
      </div>
      <div className="z-approve">
        <div className="z-input">
          <span className="z-reason-text">{proposed ? '' : RULE.reason}</span>
        </div>
        <span className="btn z-approve-btn" data-variant="primary">
          Approve rule <kbd>⌘↵</kbd>
        </span>
      </div>
      <p className="z-decided" style={proposed ? { opacity: 0 } : undefined}>
        <span className="z-check">✓</span>
        <span>
          <strong>Approved</strong> by {RULE.who} · {RULE.when} · logged to audit
        </span>
      </p>
    </div>
  );
}

function Stat({ label, value, meter }: { label: string; value: string; meter?: number }) {
  return (
    <div className="z-stat">
      <span>{label}</span>
      <b>{value}</b>
      {meter !== undefined && (
        <div className="meter">
          <span style={{ transform: `scaleX(${meter / 100})` }} />
        </div>
      )}
    </div>
  );
}
