/* Fly: Midnight's UI floating in real CSS 3D, and a camera that dollies, orbits and cranes
 * through it. Rules for 3D in the DOM that this file keeps:
 *   - every level between the world and a moving object has transform-style: preserve-3d;
 *   - nothing on that path gets opacity < 1, filter or overflow (they flatten 3D), so fades
 *     happen on the leaf panels and whole objects are hidden with visibility;
 *   - nothing sits on the camera's path, so nothing ever crosses the lens. */

import type { ReactNode } from 'react';
import { Captions } from '../../shared/MidnightBar';
import { Hero, Outro } from '../../shared/Frames';
import { CONDITIONS, RULE, STREAM, TEMPS, TICKET } from '../../shared/story';
import { LANE, STARS, TILE, TILES, WALL, Z } from './space';

/** An object in the world, positioned at (x, y, z) by its centre. */
function Obj({ className, x = 0, y = 0, z, children }: { className: string; x?: number; y?: number; z: number; children: ReactNode }) {
  return (
    <div className={`dp-o ${className}`} style={{ transform: `translate3d(${x}px, ${y}px, ${z}px)` }}>
      {children}
    </div>
  );
}

const LW = 600;
const LH = 140;
const ly = (t: number) => 10 + ((73 - t) / 8) * (LH - 20);
const pts = TEMPS.map((t, i) => [(i / (TEMPS.length - 1)) * LW, ly(t)] as const);
const LINE = pts.reduce((d, [px, py], i) => {
  if (i === 0) return `M${px},${py}`;
  const [qx, qy] = pts[i - 1];
  const mx = (qx + px) / 2;
  return `${d} C${mx},${qy} ${mx},${py} ${px},${py}`;
}, '');

export function FlyStage({ onReplay }: { onReplay: () => void }) {
  return (
    <>
      <div className="layer dp-space" />
      <div className="layer dp-3d">
        <div className="dp-world">
          {STARS.map((s, i) => (
            <i
              key={i}
              className="dp-star"
              data-hot={s.hot || undefined}
              style={{ width: s.s * 0.8, height: s.s * 0.8, transform: `translate3d(${s.x}px, ${s.y}px, ${s.z}px)` }}
            />
          ))}

          {/* the alert */}
          <Obj className="dp-o-ticket" z={Z.ticket}>
            <div className="dp-card dp-ticket card">
              <header>
                <span className="mono subtle">{TICKET.id}</span>
                <span className="badge-swap">
                  <span className="badge dp-open">
                    <span className="dot" data-s="open" />
                    Open
                  </span>
                  <span className="badge dp-cleared">
                    <span className="dot" data-s="cleared" />
                    Auto-cleared
                  </span>
                </span>
              </header>
              <h3>{TICKET.title}</h3>
              <svg width={LW} height={LH} viewBox={`0 0 ${LW} ${LH}`} aria-hidden>
                <line className="dp-thresh" x1="0" x2={LW} y1={ly(70)} y2={ly(70)} />
                <path className="dp-line" d={LINE} />
              </svg>
              <div className="dp-timer">
                <span className="num dp-timer-n">{TICKET.seconds}</span>
                <span className="subtle">seconds open · {TICKET.ci}</span>
              </div>
            </div>
          </Obj>

          {/* the 214, as a wall of pages by week */}
          <Obj className="dp-o-wall" x={WALL.x} y={WALL.y} z={Z.wall}>
            <div className="dp-wall" style={{ left: -WALL.w / 2, top: -WALL.h / 2, width: WALL.w, height: WALL.h }}>
              <span className="num dp-wall-n">214</span>
              <span className="dp-wall-label">alerts like it · 12 weeks</span>
              {TILES.map((t, i) => (
                <i key={i} className="dp-tile" data-mine={t.mine || undefined} style={{ left: t.x, top: t.y, width: TILE.w, height: TILE.h }} />
              ))}
            </div>
          </Obj>

          {/* the rule, and the conditions that fly into it */}
          <Obj className="dp-o-rule" z={Z.rule}>
            <div className="dp-card dp-rule card">
              <header>
                <span className="mono subtle">{RULE.id}</span>
                <span className="badge-swap">
                  <span className="badge dp-proposed">
                    <span className="dot" data-s="proposed" />
                    Proposed
                  </span>
                  <span className="badge dp-active">
                    <span className="dot" data-s="active" />
                    Active
                  </span>
                </span>
              </header>
              <h3>{RULE.name}</h3>
              <dl className="dp-rows">
                {CONDITIONS.map((c) => (
                  <div key={c.label}>
                    <dt>
                      {c.label} <span>{c.op}</span>
                    </dt>
                    <dd className="dp-slot" />
                  </div>
                ))}
              </dl>
              <footer>
                <span className="subtle">{RULE.confidence}% confidence · 214 incidents</span>
                <span className="btn dp-approve" data-variant="primary">
                  Approve <kbd>A</kbd>
                </span>
              </footer>
              <i className="dp-sweep" />
            </div>
          </Obj>
          {CONDITIONS.map((c) => (
            <div className="dp-o dp-chip" key={c.label}>
              <span className="dp-chip-val">{c.general}</span>
            </div>
          ))}
          <div className="dp-o dp-reticle" aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </div>
          <Obj className="dp-o-composer" y={250} z={Z.rule}>
            <div className="dp-card dp-composer">
              <span className="dp-kicker">Approve {RULE.id}</span>
              <p className="dp-reason">{RULE.reason}</p>
              <div className="well dp-replay">
                {RULE.replay.map((r) => (
                  <div key={r.label}>
                    <b>
                      <span className="num dp-replay-n">{r.value}</span>
                      {r.suffix}
                    </b>
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Obj>

          {/* the gate: a floor the camera cranes up to look down on */}
          <Obj className="dp-o-floor" z={Z.floor}>
            <div className="dp-grid" />
            <i className="dp-lane" style={{ left: LANE.from, width: LANE.pass - LANE.from + 120 }} />
            <div className="dp-stand dp-gate" style={{ left: LANE.gate - 110 }}>
              <i className="dp-gate-ring" />
              <span className="badge dp-gate-label">
                <span className="dot" data-s="active" />
                {RULE.id}
              </span>
            </div>
            <div className="dp-stand dp-beacon" style={{ left: LANE.pass + 60 }}>
              <i className="dp-beacon-beam" />
              <span className="dp-beacon-label">88.4 °C · pages a person</span>
            </div>
            {STREAM.map((a, i) => (
              <div className="dp-orb" data-match={a.match || undefined} key={i}>
                <div className="dp-stand">
                  <i className="dp-orb-ball" />
                </div>
              </div>
            ))}
          </Obj>
        </div>
      </div>

      <Hero cue="Scroll to fly in" />
      <Outro onReplay={onReplay} replay="Fly back to the start" />
      <Captions />
    </>
  );
}
