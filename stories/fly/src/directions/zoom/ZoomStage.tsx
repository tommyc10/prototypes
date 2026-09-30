/* Zoom: the whole story on one board you keep scrolling into.
 *
 *   L0 the board    one card per assignment group, alerts as dots
 *   L1 the group    Tractor Beam Ops up close; pans right to the engine
 *   L2 the alert    the alert's page
 *   L3 the rule     the rule's page
 *
 * Each layer after the first is also a miniature inside the one before it (the ticket's page
 * in the group, the rule's page beside it and on the board), so every zoom is continuous.
 * All drawn in their END state. */

import type { ReactNode } from 'react';
import { Captions } from '../../shared/MidnightBar';
import { Hero, Outro } from '../../shared/Frames';
import { CLOUD, GROUPS, HOT, MARKER, ME, ME_CARD, ME_CELL, NEW_DOTS, RULE_CARD } from './map';
import { RuleSheet, TicketSheet } from './Sheets';

/** A page drawn at a smaller size inside another layer. */
function Mini({ box, className, children }: { box: { x: number; y: number; w: number }; className: string; children: ReactNode }) {
  const k = box.w / 1440;
  return (
    <div className={`z-mini ${className}`} style={{ left: box.x, top: box.y, transform: `scale(${k})` }}>
      {children}
    </div>
  );
}

export function ZoomStage({ onReplay }: { onReplay: () => void }) {
  return (
    <>
      {/* ---------- L0: the board ---------- */}
      <div className="layer z-L0 z-canvas">
        {GROUPS.map((g) => (
          <div
            className="z-group"
            data-id={g.id}
            data-ruled={g.ruled || undefined}
            key={g.id}
            style={{ left: g.box.x, top: g.box.y, width: g.box.w, height: g.box.h }}
          >
            <div className="z-group-head">
              <span className="truncate">{g.name}</span>
              <b className="num">{g.count}</b>
            </div>
            {g.id === 'tractor' && (
              <span className="z-group-rule">
                <span className="dot" data-s="active" />
                RUL-0412
              </span>
            )}
          </div>
        ))}
        {GROUPS.flatMap((g) =>
          g.dots.map((d, i) => (
            <span
              key={`${g.id}${i}`}
              className="z-dot"
              data-g={g.id}
              data-signal={d.signal || undefined}
              // End state: quiet where a rule covers the group, unless it's a real incident.
              data-quiet={((g.id === 'tractor' || g.ruled) && !d.signal) || undefined}
              style={{ left: d.x, top: d.y }}
            />
          )),
        )}
        <span className="z-dot z-me" style={{ left: ME.x, top: ME.y }} />
        {NEW_DOTS.map((d, i) => (
          <span key={i} className="z-dot z-new" style={{ left: d.x, top: d.y }} />
        ))}
        <span className="z-dot z-hot" style={{ left: HOT.x, top: HOT.y }} />
        <p className="z-tip" style={{ left: HOT.x - 14, top: HOT.y + 22 }}>
          <span className="dot" data-s="bad" />
          88.4 °C · over the line, still pages
        </p>
        <Mini box={MARKER} className="z-marker">
          <RuleSheet phase="end" />
        </Mini>
      </div>

      {/* ---------- L1: the group up close, and the engine to its right ---------- */}
      <div className="layer z-L1">
        <div className="z-pan">
          {/* Transparent while zooming in, so the board shows around it; fades in on landing. */}
          <div className="z-bg" />
          <header className="z-group-view">
            <span className="mono subtle">Assignment group · Death Star</span>
            <h3>Tractor Beam Ops</h3>
          </header>
          {/* Drawn in the chart (their end state); the story starts them in the cloud. */}
          {CLOUD.map((p, i) => (
            <span key={i} className="z-pt" style={{ left: p.cell.x, top: p.cell.y }} />
          ))}
          <span className="z-pt z-pt-me" style={{ left: ME_CELL.x, top: ME_CELL.y }} />
          <Mini box={ME_CARD} className="z-me-card">
            <div className="z-phase" data-phase="start">
              <TicketSheet phase="start" />
            </div>
            <div className="z-phase" data-phase="end">
              <TicketSheet phase="end" />
            </div>
          </Mini>

          <div className="z-count">
            <span className="num z-count-n">214</span>
            <span>alerts like INC-40231 in 90 days</span>
          </div>
          <div className="z-axis">
            <span>13 Jul</span>
            <span>Each square is one page</span>
            <span>This week</span>
          </div>
          <div className="z-annos">
            <span className="z-anno">Same coupling</span>
            <span className="z-anno">Under 72 °C</span>
            <span className="z-anno">Gone within 90 s</span>
          </div>

          <svg className="z-leaders" width="2880" height="900" aria-hidden>
            <path />
            <path />
            <path />
          </svg>
          <Mini box={RULE_CARD} className="z-rule-card">
            <RuleSheet phase="proposed" />
          </Mini>
        </div>
      </div>

      {/* ---------- L2 and L3: the pages ---------- */}
      <div className="layer z-L2">
        <TicketSheet />
      </div>
      <div className="layer z-L3">
        <RuleSheet />
      </div>

      <Hero cue="Scroll to zoom in" />
      <Outro onReplay={onReplay} replay="Zoom out and start again" />

      {/* Captions float in a glass panel, since the canvas under them keeps changing. */}
      <div className="z-panel">
        <Captions className="z-caps" />
      </div>
    </>
  );
}
