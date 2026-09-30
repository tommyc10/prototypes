/* Pip's part. Where the dragon sits in each scene, when it hops between them, and the
 * script the page reads while scrolling: which line is showing, which way the bubble
 * points, Pip's mood, and the moments it flips for joy.
 *
 * The hops are tweens on the master timeline, so they scrub and rewind like everything
 * else. Lines, moods and sides aren't tweens: Film.tsx looks them up from the playhead's
 * time, so scrolling back un-says a line exactly. Flips only fire going forwards.
 * Runs after the chapters, because it places itself by their labels. */

import type { BotAvatarState } from '../../vendor/bot-avatars';
import { gsap } from '../../lib/gsap';
import { LINES, type Scene } from '../data';
import { type Story, one } from './kit';

export type Side = 'right' | 'left' | 'above';

interface Perch {
  x: number;
  y: number;
  side: Side;
}

/** Pip's box is 72px square; perches are where its centre sits, in stage pixels. */
const HALF = 36;

const PERCH = {
  /** Asleep under the headline. */
  hero: { x: 720, y: 700, side: 'right' },
  /** Sitting on the ticket's top edge. */
  ticket: { x: 715, y: 146, side: 'right' },
  /** On top of this week's square: the ticket, now one of 214. */
  week: { x: 1334, y: 336, side: 'above' },
  /** Under the stack of tickets, watching the values fly. */
  stack: { x: 600, y: 604, side: 'right' },
  /** Beside the caption, when the product fills the canvas. */
  caption: { x: 132, y: 690, side: 'right' },
  /** On the rule chip: the gatekeeper. */
  gate: { x: 880, y: 176, side: 'left' },
  /** On the audit log's top edge. */
  audit: { x: 626, y: 97, side: 'right' },
  /** Above the last line, going back to sleep. */
  outro: { x: 720, y: 206, side: 'right' },
} satisfies Record<string, Perch>;

export interface GuideScript {
  lines: { id: number; from: number; to: number; text: string }[];
  moods: { at: number; mood: BotAvatarState }[];
  sides: { at: number; side: Side }[];
  flips: number[];
}

export function guide(s: Story): GuideScript {
  const el = one(s, '.guide');
  const start = (scene: Scene) => {
    const t = s.tl.labels[scene];
    if (t === undefined) throw new Error(`guide: no label for ${scene}`);
    return t;
  };
  const script: GuideScript = { lines: [], moods: [], sides: [], flips: [] };
  const mood = (scene: Scene, dt: number, m: BotAvatarState) => script.moods.push({ at: start(scene) + dt, mood: m });
  const flip = (scene: Scene, dt: number) => script.flips.push(start(scene) + dt);

  let here: Perch = PERCH.hero;
  gsap.set(el, { x: here.x - HALF, y: here.y - HALF });
  script.sides.push({ at: 0, side: here.side });

  /** A hop: across on a travelling curve, up quickly, down under gravity. */
  const hop = (scene: Scene, dt: number, to: Perch, duration = 1.1) => {
    const at = start(scene) + dt;
    const peak = Math.min(here.y, to.y) - HALF - 70;
    s.tl.to(el, { x: to.x - HALF, duration, ease: 'mn-in-out' }, at);
    s.tl.to(el, { y: peak, duration: duration * 0.45, ease: 'power2.out' }, at);
    s.tl.to(el, { y: to.y - HALF, duration: duration * 0.55, ease: 'power2.in' }, at + duration * 0.45);
    script.sides.push({ at, side: to.side });
    here = to;
  };

  // Opening: asleep until the alert fires, then a startled flip, then along for the dive.
  mood('hero', 0, 'sleeping');
  mood('hero', 0.85, 'default');
  flip('hero', 0.9);
  hop('hero', 1.5, PERCH.ticket, 1.6);
  s.tl.to(el, { keyframes: [{ scale: 1.35, duration: 0.8 }, { scale: 1, duration: 0.8 }], ease: 'mn-in-out' }, start('hero') + 1.5);

  // Follows the ticket into its square.
  hop('recurrence', 0.2, PERCH.week);

  // Helps the engine compare, busy while the values fly.
  hop('pattern', 0.3, PERCH.stack);
  mood('pattern', 1.3, 'working');
  mood('pattern', 5.3, 'default');

  // Steps aside for the rule page, and is busy again while the backtest runs.
  hop('rule', 0.3, PERCH.caption);
  mood('decision', 1.35, 'working');
  mood('decision', 3.3, 'default');
  flip('decision', 5.8);

  // Guards the gate while the stream runs.
  hop('suppression', 0.4, PERCH.gate);
  mood('suppression', 2.3, 'working');
  mood('suppression', 8.8, 'default');

  hop('guardrail', 0.4, PERCH.caption);
  flip('guardrail', 12.9);

  hop('audit', 0.3, PERCH.audit);

  // Back where it started: nothing left to wake it.
  hop('outro', 0.3, PERCH.outro, 1.2);
  mood('outro', 2.2, 'sleeping');

  script.lines = LINES.map((l, id) => ({ id, from: start(l.scene) + l.from, to: start(l.scene) + l.to, text: l.text }));
  return script;
}

/** What Pip is doing at a moment in the film. */
export function guideAt(script: GuideScript, time: number) {
  const latest = <T extends { at: number }>(list: T[]) => list.filter((x) => x.at <= time).pop() ?? list[0];
  return {
    mood: latest(script.moods).mood,
    side: latest(script.sides).side,
    line: script.lines.find((l) => time >= l.from && time < l.to) ?? null,
  };
}
