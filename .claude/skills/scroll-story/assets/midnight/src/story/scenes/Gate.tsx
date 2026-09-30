/* Chapter 6: the approved rule as a gate. Live alerts stream in from the left; matches drop
 * into the suppressed pile, everything else carries on to the on-call queue.
 * Pills are drawn where they finish; the story flies them in from the lane. */

import { Bot } from 'lucide-react';
import { STREAM } from '../data';
import './Gate.css';

export const LANE = { x: 560, y: 411 };
export const GATE_X = 880;
export const PILL_W = 196;
export const STACK = { x: GATE_X - PILL_W / 2, y: 668, step: 5 };
export const SLOT = { x: 1110, y: 312, step: 50 };

let matched = 0;
let passed = 0;
const PILLS = STREAM.map((a) => {
  const end = a.match
    ? { x: STACK.x, y: STACK.y - matched * STACK.step, slot: matched++ }
    : { x: SLOT.x, y: SLOT.y + passed * SLOT.step, slot: passed++ };
  return { ...a, end };
});
export const MATCHED = matched;
export const PASSED = passed;

export function Gate() {
  return (
    <div className="scene sc-gate">
      <div className="gt-incoming">
        <span className="dot" data-s="open" />
        Incoming alerts
        <span className="subtle">live</span>
      </div>
      <div className="gt-lane" />

      <div className="gt-beam" />
      <div className="gt-rule">
        <div className="gt-rule-top">
          <span className="dot" data-s="active" />
          <strong>RUL-0412</strong>
          <span className="subtle">Active</span>
        </div>
        <div className="mono gt-rule-cond">tb-coupling-* · &lt; 72 °C · &lt; 90s</div>
        <span className="gt-rule-flash" />
      </div>

      <div className="gt-tray">
        <div className="gt-tray-head">
          <span>Suppressed</span>
          <span className="subtle">logged, not deleted</span>
        </div>
        <div className="gt-tray-count num">{MATCHED}</div>
      </div>

      <section className="gt-queue">
        <header className="gt-queue-head">
          <span>
            <strong>On-call queue</strong>
            <span className="subtle">Tractor Beam Ops</span>
          </span>
          <span className="gt-paged">
            <span className="num gt-paged-n">{PASSED}</span> paged
          </span>
        </header>
        {PILLS.filter((p) => !p.match).map((p, k) => (
          <div className="gt-row" key={p.id} data-callout={p.callout || undefined} style={{ top: 58 + k * SLOT.step }}>
            <span className="dot" data-s={p.callout ? 'bad' : 'open'} />
            <span className="mono subtle">{p.id}</span>
            <span className="truncate">{p.title}</span>
          </div>
        ))}
      </section>

      <p className="gt-note">
        <strong>Same coupling, 88 °C and climbing.</strong> It’s over the line, so it still pages a person.
      </p>

      {PILLS.map((p) => (
        <div
          className="gt-pill"
          key={p.id}
          data-match={p.match || undefined}
          data-callout={p.callout || undefined}
          data-slot={p.end.slot}
          style={{ left: p.end.x, top: p.end.y }}
        >
          <span className="gt-pill-face gt-pill-live">
            <span className="dot" data-s="open" />
            <span className="mono">{p.ci}</span>
            <span className="mono subtle">{p.detail.split(' · ')[0]}</span>
          </span>
          <span className="gt-pill-face gt-pill-dead">
            <span className="dot" data-s="rejected" />
            <span className="mono">{p.ci}</span>
            <span className="mono">{p.detail.split(' · ')[0]}</span>
          </span>
        </div>
      ))}

      <aside className="gt-proposal">
        <span className="pt-bot">
          <Bot size={14} strokeWidth={1.75} />
        </span>
        <span className="gt-proposal-text">
          <span className="gt-proposal-top">
            <span className="dot" data-s="proposed" />
            New proposal · <span className="mono">RUL-0419</span>
          </span>
          <strong>Thermal exhaust port proximity sensor</strong>
          <span className="subtle">Correlation engine 2.9 · Reactor Core</span>
        </span>
      </aside>
    </div>
  );
}
