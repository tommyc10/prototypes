/* Hero → ticket → recurrence: dive into one alert, watch it clear itself, then pull back
 * and see it was never just one. */

import { gsap } from '../../lib/gsap';
import { focus, morph } from '../../lib/geometry';
import { type Story, all, box, captionIn, captionOut, count, enter, leave, mark, one, swap } from './kit';

/** Stage point the camera flies the chosen alert to: the middle of the canvas, right of the captions. */
const CANVAS = { x: 970, y: 452 };

export function hero(s: Story) {
  const wall = one(s, '.sc-wall');
  const rows = all(s, '.wall-row');
  const target = one(s, '.wall-row[data-target]');
  const others = rows.filter((r) => r !== target);

  // The wall starts loud: every alert lit (its end state is the quiet outro).
  gsap.set(wall, { attr: { 'data-state': 'live' } });
  gsap.set(rows, { opacity: 1 });
  gsap.set(target, { '--halo': 0 });

  // Scroll starts: the headline clears away and the wall steps back, all but one alert.
  s.tl.to(one(s, '.hero'), { autoAlpha: 0, y: -48, filter: 'blur(6px)', duration: 1 }, 0);
  s.tl.to(one(s, '.hero-cue'), { autoAlpha: 0, duration: 0.4 }, 0);
  s.tl.to(one(s, '.sc-hero'), { autoAlpha: 0, duration: 0.8 }, 0.4);
  s.tl.to(others, { opacity: 0.3, duration: 0.8, stagger: { amount: 0.3, from: 'random' } }, 0.5);
  s.tl.to(target, { '--halo': 1, color: '#ededed', scale: 1.04, duration: 0.6 }, 0.8);

  // The dive: the camera flies into the alert until it's all you can see.
  s.tl.to(wall, { ...focus(box(s, target), 9, CANVAS.x, CANVAS.y), duration: 1.8, ease: 'mn-in-out' }, 1.4);
  s.tl.to(wall, { autoAlpha: 0, duration: 0.7, ease: 'none' }, 2.4);

  s.t = 2.3;
}

export function ticket(s: Story) {
  const t = s.t;
  const scene = one(s, '.sc-ticket');
  const card = one(s, '.tk');

  // …and lands on the ticket behind it, which rushes up to meet the camera.
  s.tl.set(scene, { autoAlpha: 1 }, t);
  gsap.set(card, { autoAlpha: 0, scale: 0.72 });
  s.tl.to(card, { autoAlpha: 1, scale: 1, duration: 1 }, t);
  captionIn(s, 'ticket', t + 0.6);

  // 74 seconds in the life of an alert: the temperature crosses the line, then falls back.
  const run = t + 1.1;
  const lines = all(s, '.tk-line');
  const RUN = 2.4;
  gsap.set(lines, { drawSVG: '0%' });
  s.tl.to(lines, { drawSVG: '100%', duration: RUN, ease: 'none' }, run);
  gsap.set(one(s, '.tk-peak'), { autoAlpha: 0 });
  s.tl.to(one(s, '.tk-peak'), { autoAlpha: 1, duration: 0.3 }, run + RUN / 3);
  count(s, one(s, '.tk-timer'), run, RUN, 0, 'none');

  // It clears on its own.
  swap(s, one(s, '.tk-open'), one(s, '.tk-cleared'), run + RUN);
  enter(s, one(s, '.tk-foot'), run + RUN + 0.15, { y: 8 });

  s.t = run + RUN + 1.2;
  mark(s, 'ticket', t, s.t);
}

export function recurrence(s: Story) {
  const t = s.t;
  const scene = one(s, '.sc-rec');
  const card = one(s, '.tk');
  const cells = all(s, '.rec-cell');
  const mine = one(s, '.rec-cell[data-ticket]');
  const history = cells.filter((c) => c !== mine);

  captionOut(s, 'ticket', t);

  // The ticket collapses into a single square: this week's.
  s.tl.set(scene, { autoAlpha: 1 }, t);
  s.tl.to(card, { ...morph(box(s, card), box(s, mine)), duration: 1.3, ease: 'mn-in-out' }, t + 0.1);
  s.tl.to(card, { autoAlpha: 0, duration: 0.35, ease: 'none' }, t + 1.05);
  gsap.set(mine, { autoAlpha: 0 });
  s.tl.to(mine, { autoAlpha: 1, duration: 0.3 }, t + 1.1);
  s.tl.set(one(s, '.sc-ticket'), { autoAlpha: 0 }, t + 1.45);

  // Then the 213 before it fill in, week by week, and the count runs with them.
  const rain = t + 1.5;
  enter(s, one(s, '.rec-head'), t + 1.2);
  enter(s, one(s, '.rec-axis'), t + 1.6, { y: 6 });
  gsap.set(history, { autoAlpha: 0, y: -60 });
  s.tl.to(history, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.011 }, rain);
  count(s, one(s, '.rec-count'), rain, history.length * 0.011 + 0.4, 1, 'none');
  captionIn(s, 'recurrence', t + 1.4);
  enter(s, all(s, '.rec-facts > div'), rain + 2.4, { stagger: 0.14 });

  s.t = rain + 3.8;
  mark(s, 'recurrence', t, s.t);
  leave(s, all(s, '.rec-head, .rec-axis, .rec-facts > div'), s.t + 0.1, { blur: 0 });
}
