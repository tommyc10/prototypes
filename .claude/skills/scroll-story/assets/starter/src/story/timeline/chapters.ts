/* The example film, in four beats. Each chapter is a function that places tweens at exact
 * times: `t` is when the chapter starts, everything else is `t + seconds`, and it ends by
 * moving `s.t` on and calling `mark()` so the progress rail knows where it lives.
 *
 * Techniques on show (see references/transitions.md for the full catalogue):
 *   hero     camera dive: scale the wall ×9 around one row with focus()
 *   ticket   grow-to-meet, typing, a clock, a badge swap
 *   pattern  collapse-into-a-unit with morph(), a rain of units, a running count
 *   outro    return to the opening, quiet: a bookend */

import { gsap, SplitText } from '../../lib/gsap';
import { focus, morph, STAGE_H, STAGE_W } from '../../lib/geometry';
import { type Story, all, box, captionIn, captionOut, count, enter, leave, mark, one, swap, type } from './kit';

/** Where the camera lands things: the middle of the canvas, right of the captions. */
const CANVAS = { x: 960, y: 440 };

export function hero(s: Story) {
  const wall = one(s, '.sc-wall');
  const rows = all(s, '.wall-row');
  const target = one(s, '.wall-row[data-target]');
  const others = rows.filter((r) => r !== target);

  // Start loud (the markup's end state is the quiet outro).
  gsap.set(wall, { attr: { 'data-state': 'live' } });
  gsap.set(rows, { opacity: 1 });
  gsap.set(target, { '--halo': 0 });

  s.tl.to(one(s, '.hero'), { autoAlpha: 0, y: -48, filter: 'blur(6px)', duration: 1 }, 0);
  s.tl.to(one(s, '.hero-cue'), { autoAlpha: 0, duration: 0.4 }, 0);
  s.tl.to(one(s, '.sc-hero'), { autoAlpha: 0, duration: 0.8 }, 0.4);
  s.tl.to(others, { opacity: 0.3, duration: 0.8, stagger: { amount: 0.3, from: 'random' } }, 0.5);
  s.tl.to(target, { '--halo': 1, color: '#ededed', scale: 1.04, duration: 0.6 }, 0.8);

  // The dive: fly into the row until it's all you can see.
  s.tl.to(wall, { ...focus(box(s, target), 9, CANVAS.x, CANVAS.y), duration: 1.8, ease: 'story-in-out' }, 1.4);
  s.tl.to(wall, { autoAlpha: 0, duration: 0.7, ease: 'none' }, 2.4);

  s.t = 2.3;
}

export function ticket(s: Story) {
  const t = s.t;
  const card = one(s, '.tk');

  // …and land on the ticket behind it, which rushes up to meet the camera.
  s.tl.set(one(s, '.sc-ticket'), { autoAlpha: 1 }, t);
  gsap.set(card, { autoAlpha: 0, scale: 0.72 });
  s.tl.to(card, { autoAlpha: 1, scale: 1, duration: 1 }, t);
  captionIn(s, 'ticket', t + 0.6);

  // Someone handles it by hand: the reply gets typed while the clock runs.
  const reply = one(s, '.tk-typed');
  type(s, reply, reply.textContent ?? '', t + 1.2, 2);
  count(s, one(s, '.tk-timer'), t + 1.2, 2.2, 0, 'none');
  swap(s, one(s, '.tk-open'), one(s, '.tk-solved'), t + 3.4);

  s.t = t + 4.6;
  mark(s, 'ticket', t, s.t);
}

export function pattern(s: Story) {
  const t = s.t;
  const card = one(s, '.tk');
  const cells = all(s, '.pt-cell');
  const mine = one(s, '.pt-cell[data-mine]');
  const history = cells.filter((c) => c !== mine);

  captionOut(s, 'ticket', t);

  // The ticket collapses into a single square: this week's.
  s.tl.set(one(s, '.sc-pat'), { autoAlpha: 1 }, t);
  s.tl.to(card, { ...morph(box(s, card), box(s, mine)), duration: 1.3, ease: 'story-in-out' }, t + 0.1);
  s.tl.to(card, { autoAlpha: 0, duration: 0.35, ease: 'none' }, t + 1.05);
  gsap.set(mine, { autoAlpha: 0 });
  s.tl.to(mine, { autoAlpha: 1, duration: 0.3 }, t + 1.1);
  s.tl.set(one(s, '.sc-ticket'), { autoAlpha: 0 }, t + 1.45);

  // Then the ones before it rain in, week by week, and the count runs with them.
  const rain = t + 1.5;
  enter(s, one(s, '.pt-head'), t + 1.2);
  enter(s, one(s, '.pt-axis'), t + 1.6, { y: 6 });
  gsap.set(history, { autoAlpha: 0, y: -60 });
  s.tl.to(history, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.015 }, rain);
  count(s, one(s, '.pt-count'), rain, history.length * 0.015 + 0.4, 1, 'none');
  captionIn(s, 'pattern', t + 1.4);

  s.t = rain + history.length * 0.015 + 1.6;
  mark(s, 'pattern', t, s.t);
}

export function outro(s: Story) {
  const t = s.t;
  const wall = one(s, '.sc-wall');
  const rows = all(s, '.wall-row');
  const target = one(s, '.wall-row[data-target]');

  captionOut(s, 'pattern', t);
  leave(s, all(s, '.pt-head, .pt-chart, .pt-axis'), t + 0.1, { y: -10, scale: 0.98, blur: 6, duration: 0.7 });
  s.tl.set(one(s, '.sc-pat'), { autoAlpha: 0 }, t + 0.8);

  // Back to the wall, from a little closer, settling out. Quiet now. fromTo with
  // immediateRender: false, or GSAP would apply its start state at build time.
  const k = 1.15;
  s.tl.set(wall, { attr: { 'data-state': 'quiet' } }, t + 0.3);
  s.tl.fromTo(
    wall,
    { x: (STAGE_W - STAGE_W * k) / 2, y: (STAGE_H - STAGE_H * k) / 2, scale: k, autoAlpha: 0, transformOrigin: '0 0' },
    { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 1.8, immediateRender: false },
    t + 0.3,
  );
  s.tl.to(target, { '--halo': 0, scale: 1, duration: 0.4 }, t + 0.3);
  s.tl.to(
    rows.filter((r) => r.dataset.noise !== undefined),
    { opacity: 0.16, duration: 0.6, stagger: { amount: 0.8, from: 'random' } },
    t + 0.9,
  );
  s.tl.to(
    rows.filter((r) => r.dataset.noise === undefined),
    { opacity: 1, duration: 0.6 },
    t + 0.9,
  );

  const scene = one(s, '.sc-outro');
  const split = SplitText.create(one(s, '.outro-title'), { type: 'lines', mask: 'lines' });
  gsap.set(scene, { autoAlpha: 0 });
  gsap.set(split.lines, { yPercent: 105 });
  s.tl.set(scene, { autoAlpha: 1 }, t + 1);
  s.tl.to(split.lines, { yPercent: 0, duration: 0.8 }, t + 1.1);
  enter(s, one(s, '.outro-sub'), t + 1.4);
  enter(s, all(s, '.outro-stat'), t + 1.6, { stagger: 0.1 });
  all(s, '.outro-num').forEach((n, i) => count(s, n, t + 1.7 + i * 0.1, 1));
  enter(s, one(s, '.outro-actions'), t + 2, { y: 8 });

  s.t = t + 3.4;
  // Make sure the timeline runs to the end of the hold.
  s.tl.set({}, {}, s.t);
}
