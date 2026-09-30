/* Snap choreography. The camera barely moves; the layout does the travelling, and the film
 * snaps to each chapter's resting frame (see `snap: true` in index.ts). */

import { portal } from '../../lib/camera';
import { centerOf, morph, STAGE_H, STAGE_W } from '../../lib/geometry';
import { gsap, SplitText } from '../../lib/gsap';
import { all, box, captionIn, captionOut, count, createStory, enter, mark, one, pointer, prepareCaption, type } from '../../lib/kit';
import { CHAPTERS, CONDITIONS, RULE, STREAM, WEEKLY } from '../../shared/story';
import type { Built } from '../../shared/types';
import { BAR, barHeight, SLAT_W } from './SnapStage';

const GATE_X = 1001;
const PASS_X = 1140;
const iris = (r: number, c: { x: number; y: number }) => `circle(${r}px at ${c.x}px ${c.y}px)`;

export function buildSnap(stage: HTMLElement): Built {
  const s = createStory(stage);
  const hero = one(s, '.m-hero');
  const p12 = one(s, '.s-12');
  const p3 = one(s, '.s-3');
  const p4 = one(s, '.s-4');
  const p5 = one(s, '.s-5');
  const end = one(s, '.s-end');
  gsap.set([p3, p4, p5, end], { visibility: 'hidden' });
  CHAPTERS.forEach((c) => prepareCaption(s, c.id));

  /* ---------- opening: through the counter of the o ---------- */

  s.tl.addLabel('hero', 0);
  s.tl.to(all(s, '.m-hero .hero-eyebrow, .m-hero .hero-sub, .m-hero .hero-cue'), { autoAlpha: 0, y: -10, duration: 0.5 }, 0);

  // The next page is already there, seen through the hole in the o. Its clip matches the
  // counter while the letter grows past you, then keeps opening as you go through.
  const win = box(s, '.m-o-window');
  const m = Math.max(win.w / STAGE_W, win.h / STAGE_H);
  const k = 1 / m;
  const rx = win.w / 2 / m;
  const ry = win.h / 2 / m;
  portal(s, {
    outer: hero,
    inner: p12,
    target: win,
    at: 0.4,
    duration: 2.4,
    fade: [-1, 0],
    prime: true,
    beyond: 2.6,
    onZoom: (_z, scale) => {
      const g = Math.pow(Math.max(1, scale / k), 1.8);
      p12.style.clipPath = `ellipse(${rx * g}px ${ry * g}px at 720px 450px)`;
    },
  });
  // Through: the page is no longer seen through anything.
  s.tl.set(p12, { clipPath: 'none' }, 2.85);
  s.t = 2.8;

  /* ---------- 01: the alert ---------- */

  let t = s.t;
  const card = one(s, '.s-ticket');
  captionIn(s, 'alert', t + 0.3);
  gsap.set(card, { autoAlpha: 0, y: 40, scale: 0.96 });
  s.tl.to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9 }, t + 0.4);
  const lines = all(s, '.s-line');
  gsap.set(lines, { drawSVG: '0%' });
  s.tl.to(lines, { drawSVG: '100%', duration: 2.2, ease: 'none' }, t + 1);
  count(s, one(s, '.s-clock'), t + 1, 2.2, 0, 'none');
  const open = one(s, '.s-open');
  const cleared = one(s, '.s-cleared');
  gsap.set(open, { autoAlpha: 1 });
  gsap.set(cleared, { autoAlpha: 0, filter: 'blur(3px)' });
  s.tl.to(open, { autoAlpha: 0, filter: 'blur(3px)', duration: 0.35 }, t + 3.3);
  s.tl.to(cleared, { autoAlpha: 1, filter: 'blur(0px)', duration: 0.35 }, t + 3.4);
  enter(s, one(s, '.s-foot'), t + 3.5, { y: 8 });
  s.t = t + 4.6;
  mark(s, 'alert', t, s.t);

  /* ---------- 02: the page gathers into the weekly chart ---------- */

  t = s.t;
  captionOut(s, 'alert', t);
  s.tl.to(one(s, '.s-glow'), { opacity: 0, duration: 0.5 }, t);
  all(s, '.s-slat').forEach((slat, i) => {
    const h = barHeight(WEEKLY[i]);
    s.tl.to(
      slat,
      {
        x: BAR.x + i * BAR.step - i * SLAT_W,
        y: BAR.base - h,
        scaleX: BAR.w / SLAT_W,
        scaleY: h / STAGE_H,
        transformOrigin: '0 0',
        backgroundColor: '#2b2b2b',
        boxShadow: '1px 0 0 #2b2b2b',
        duration: 1.5,
        ease: 'story-in-out',
      },
      t + 0.1 + i * 0.04,
    );
  });
  // The alert shrinks onto the top of this week's bar.
  const capCell = one(s, '.s-cap-cell');
  s.tl.to(card, { ...morph(box(s, card), box(s, capCell), false), duration: 1.2, ease: 'story-in-out' }, t + 0.3);
  s.tl.to(card, { autoAlpha: 0, duration: 0.25, ease: 'none' }, t + 1.3);
  gsap.set(capCell, { autoAlpha: 0 });
  s.tl.to(capCell, { autoAlpha: 1, duration: 0.3 }, t + 1.35);
  enter(s, one(s, '.s-count'), t + 1.1, { y: 30, duration: 0.8 });
  count(s, one(s, '.s-count-n'), t + 1.2, 1.4, 1);
  enter(s, all(s, '.s-weeks span'), t + 1.7, { y: 6, stagger: 0.03 });
  captionIn(s, 'pattern', t + 1.6);
  s.t = t + 4.2;
  mark(s, 'pattern', t, s.t);

  /* ---------- 03: the next page slides in; the pattern is written as conditions ---------- */

  t = s.t;
  captionOut(s, 'pattern', t);
  gsap.set(p3, { x: STAGE_W });
  s.tl.set(p3, { visibility: 'visible' }, t + 0.1);
  s.tl.to(p3, { x: 0, duration: 1.4, ease: 'story-in-out' }, t + 0.1);
  s.tl.to(p12, { x: -520, duration: 1.4, ease: 'story-in-out' }, t + 0.1); // slower: parallax
  s.tl.set(p12, { visibility: 'hidden' }, t + 1.6);
  captionIn(s, 'rule', t + 1.1);
  enter(s, one(s, '.s-conds'), t + 0.9, { y: 16 });

  all(s, '.s-cond').forEach((row, i) => {
    const at = t + 1.2 + i * 0.3;
    const words = SplitText.create(row.querySelector<HTMLElement>('.s-cond-label')!, { type: 'words', mask: 'words' }).words;
    gsap.set(words, { yPercent: 110 });
    s.tl.to(words, { yPercent: 0, duration: 0.6, stagger: 0.04 }, at);
    const val = row.querySelector<HTMLElement>('.s-cond-val')!;
    gsap.set(val, { text: CONDITIONS[i].specific, clipPath: 'inset(0% 100% 0% 0%)', color: '#e0a93e' });
    s.tl.to(val, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'story-in-out' }, at + 0.25);
    s.tl.to(val, { scrambleText: { text: CONDITIONS[i].general, chars: '*0123456789', speed: 0.5 }, color: '#ededed', duration: 0.7, ease: 'none' }, t + 2.5 + i * 0.3);
  });
  enter(s, one(s, '.s-rulecard'), t + 3.3, { y: 24 });
  s.t = t + 4.8;
  mark(s, 'rule', t, s.t);

  /* ---------- 04: an iris opens out of the Approve button ---------- */

  t = s.t;
  captionOut(s, 'rule', t);
  const approve = one(s, '.s-approve');
  const a = box(s, approve);
  const hand = pointer(s, '.s-3');
  hand.show(t + 0.1, { x: 1360, y: 860 });
  hand.move(t + 0.2, a, 0.7);
  hand.click(t + 0.95, a, approve);
  const c = centerOf(a);
  gsap.set(p4, { clipPath: iris(0, c) });
  s.tl.set(p4, { visibility: 'visible' }, t + 1);
  s.tl.to(p4, { clipPath: iris(1750, c), duration: 1.2, ease: 'story-in-out' }, t + 1);
  hand.hide(t + 1.1);
  s.tl.set(p3, { visibility: 'hidden' }, t + 2.3);
  captionIn(s, 'decision', t + 1.8);
  type(s, one(s, '.s-reason-text'), RULE.reason, t + 1.9, 2.2);
  enter(s, one(s, '.s-decided'), t + 4.2, { y: 8 });
  const active = one(s, '.s-active');
  gsap.set(active, { scale: 0.6 });
  s.tl.to(active, { scale: 1, duration: 0.5, ease: 'back.out(2)' }, t + 4.5);
  enter(s, all(s, '.s-stats > div'), t + 4.4, { stagger: 0.1 });
  all(s, '.s-stat-n').forEach((n, i) => count(s, n, t + 4.5 + i * 0.1, 0.9));
  s.t = t + 6.4;
  mark(s, 'decision', t, s.t);

  /* ---------- 05: bands wipe in; the gate ---------- */

  t = s.t;
  captionOut(s, 'decision', t);
  const bands = all(s, '.s-band');
  gsap.set(bands, { scaleX: 0 });
  s.tl.set(p5, { visibility: 'visible' }, t + 0.1);
  s.tl.to(bands, { scaleX: 1, duration: 0.7, stagger: 0.06, ease: 'story-in-out' }, t + 0.1);
  s.tl.set(p4, { visibility: 'hidden' }, t + 1.3);
  captionIn(s, 'gate', t + 1.2);
  const gate = one(s, '.s-gate');
  gsap.set(gate, { scaleY: 0 });
  s.tl.to(gate, { scaleY: 1, duration: 0.6, ease: 'story-in-out' }, t + 1.3);
  enter(s, all(s, '.s-lane, .s-gate-label'), t + 1.4, { y: 0, x: -16 });

  const tallyS = one(s, '.s-tally-s');
  const tallyP = one(s, '.s-tally-p');
  gsap.set([tallyS, tallyP], { textContent: 0 });
  enter(s, one(s, '.s-tally'), t + 1.8, { y: 6 });
  const paged = one(s, '.s-paged');
  gsap.set(paged, { autoAlpha: 0, x: -10 });
  let suppressed = 0;
  let passed = 0;
  let signal = { x: PASS_X, y: 450 };
  let last = t;
  all(s, '.s-pill').forEach((pill, i) => {
    const at = t + 2 + i * 0.85;
    const hit = at + 0.8;
    const w = pill.offsetWidth;
    last = hit;
    gsap.set(pill, { autoAlpha: 0, x: -40 });
    s.tl.to(pill, { autoAlpha: 1, x: 0, duration: 0.25 }, at);
    s.tl.to(pill, { x: GATE_X - 560 - w / 2, duration: 0.8, ease: 'none' }, at);
    if (STREAM[i].match) {
      s.tl.to(pill.querySelector('.s-strike'), { scaleX: 1, duration: 0.15, ease: 'none' }, hit);
      s.tl.to(pill, { backgroundColor: '#101010', color: '#737373', duration: 0.2 }, hit);
      // Struck through, it drops out of the lane: gravity, so it accelerates.
      s.tl.to(pill, { y: 300, rotation: 6, autoAlpha: 0, duration: 0.55, ease: 'power2.in' }, hit + 0.1);
      s.tl.set(tallyS, { textContent: ++suppressed }, hit + 0.3);
    } else {
      s.tl.to(pill, { backgroundColor: 'rgba(240, 86, 92, 0.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0), inset 0 0 0 1px rgba(240,86,92,0.6), 0 10px 24px rgba(0,0,0,0.45)', duration: 0.2 }, hit);
      s.tl.to(pill, { x: PASS_X - 560, duration: 0.7, ease: 'story-in-out' }, hit + 0.1);
      s.tl.to(paged, { autoAlpha: 1, x: 0, duration: 0.4 }, hit + 0.6);
      s.tl.set(tallyP, { textContent: ++passed }, hit + 0.5);
      signal = { x: PASS_X + w / 2, y: 450 };
    }
  });
  s.t = last + 1.8;
  mark(s, 'gate', t, s.t);

  /* ---------- ending: an iris out of the alert that got through ---------- */

  t = s.t;
  captionOut(s, 'gate', t);
  gsap.set(end, { clipPath: iris(0, signal) });
  s.tl.set(end, { visibility: 'visible' }, t + 0.2);
  s.tl.to(end, { clipPath: iris(1750, signal), duration: 1.1, ease: 'story-in-out' }, t + 0.2);
  enter(s, one(s, '.s-end-a'), t + 0.9, { y: 30, duration: 0.8 });
  const strike = one(s, '.s-strikeout path');
  gsap.set(strike, { drawSVG: '0%' });
  s.tl.to(strike, { drawSVG: '100%', duration: 0.5, ease: 'power2.inOut' }, t + 1.8);
  enter(s, one(s, '.s-end-b'), t + 2.2, { y: 30, duration: 0.8 });
  enter(s, all(s, '.s-end .outro-sub, .s-end .outro-stat'), t + 2.5, { stagger: 0.1 });
  all(s, '.s-end-n').forEach((n, i) => count(s, n, t + 2.6 + i * 0.1, 1));
  enter(s, one(s, '.s-end .outro-actions'), t + 2.9, { y: 8 });
  s.t = t + 4.2;
  s.tl.set({}, {}, s.t);

  return {
    story: s,
    intro: () => {
      gsap
        .timeline({ defaults: { ease: 'story-out' } })
        .from(all(s, '.m-hero .hero-line'), { yPercent: 40, autoAlpha: 0, filter: 'blur(10px)', duration: 1.2, stagger: 0.12 }, 0.1)
        .from(all(s, '.m-hero .hero-eyebrow, .m-hero .hero-sub, .m-hero .hero-cue > *'), { autoAlpha: 0, y: 12, duration: 0.8, stagger: 0.1 }, 0.6);
    },
  };
}
