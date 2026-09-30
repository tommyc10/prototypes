/* Fly choreography: an orbit camera flying one world.
 *
 * The camera looks at a target point T from distance d, tilted by rx and turned by ry. The
 * world is transformed inversely, so T always sits at the stage's focal point (900, 450). At
 * d = 1200 (the perspective distance) things at T appear at their true size.
 *
 *   hero      dolly through the star field to the alert (z 0 → −4200)
 *   pattern   pull back and orbit: the alert is one tile in a wall of 214
 *   rule      swing back to the front; conditions fly out of the wall into the rule
 *   decision  a reticle locks on Approve; the approval panel comes forward in z
 *   gate      crane up and tilt down onto a floor; alerts flow through a gate
 *   ending    pull far back into the stars
 */

import { gsap, SplitText } from '../../lib/gsap';
import { all, box, captionIn, captionOut, count, createStory, enter, mark, one, prepareCaption, type } from '../../lib/kit';
import { CHAPTERS, CONDITIONS, RULE, STREAM } from '../../shared/story';
import type { Built } from '../../shared/types';
import { LANE, MINE_WORLD, TILE, WALL, Z } from './space';

const P = 1200;
const FOCUS = { x: 900, y: 450 };

interface Cam {
  tx: number;
  ty: number;
  tz: number;
  d: number;
  rx: number;
  ry: number;
}

export function buildFly(stage: HTMLElement): Built {
  const s = createStory(stage);
  const world = one(s, '.dp-world');
  CHAPTERS.forEach((c) => prepareCaption(s, c.id));

  const cam: Cam = { tx: 0, ty: 0, tz: 0, d: P, rx: 0, ry: 6 };
  const apply = () => {
    world.style.transform = `translate3d(${FOCUS.x}px, ${FOCUS.y}px, ${P - cam.d}px) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) translate3d(${-cam.tx}px, ${-cam.ty}px, ${-cam.tz}px)`;
  };
  apply();
  /** Move the camera: every property tweens together, then the world is redrawn. */
  const fly = (to: Partial<Cam>, at: number, duration: number, ease = 'story-in-out') =>
    s.tl.to(cam, { ...to, duration, ease, onUpdate: apply, onComplete: apply, onReverseComplete: apply }, at);

  const objs = {
    ticket: one(s, '.dp-o-ticket'),
    wall: one(s, '.dp-o-wall'),
    rule: one(s, '.dp-o-rule'),
    composer: one(s, '.dp-o-composer'),
    floor: one(s, '.dp-o-floor'),
  };
  gsap.set([objs.wall, objs.rule, objs.composer, objs.floor], { visibility: 'hidden' });

  /* ---------- opening: fly through the stars to the alert ---------- */

  s.tl.addLabel('hero', 0);
  s.tl.to(one(s, '.m-hero .hero'), { autoAlpha: 0, y: -30, filter: 'blur(6px)', duration: 0.9 }, 0);
  s.tl.to(one(s, '.m-hero .hero-cue'), { autoAlpha: 0, duration: 0.4 }, 0);
  s.tl.to(one(s, '.m-hero'), { autoAlpha: 0, duration: 0.6 }, 0.4); // its scrim too
  fly({ tz: Z.ticket, ry: 0 }, 0.5, 2.7);
  s.t = 3.2;

  /* ---------- 01: the alert ---------- */

  let t = s.t;
  captionIn(s, 'alert', t + 0.2);
  const line = one(s, '.dp-line');
  gsap.set(line, { drawSVG: '0%' });
  s.tl.to(line, { drawSVG: '100%', duration: 2.2, ease: 'none' }, t + 0.6);
  count(s, one(s, '.dp-timer-n'), t + 0.6, 2.2, 0, 'none');
  const open = one(s, '.dp-open');
  const cleared = one(s, '.dp-cleared');
  gsap.set(open, { opacity: 1 });
  gsap.set(cleared, { opacity: 0 });
  s.tl.to(open, { opacity: 0, duration: 0.3 }, t + 2.9);
  s.tl.to(cleared, { opacity: 1, duration: 0.3 }, t + 3);
  s.t = t + 4.2;
  mark(s, 'alert', t, s.t);

  /* ---------- 02: pull back and orbit; the alert is one tile of 214 ---------- */

  t = s.t;
  captionOut(s, 'alert', t);
  s.tl.set(objs.wall, { visibility: 'visible' }, t + 0.1);
  fly({ tx: 60, ty: WALL.y - 40, tz: Z.wall, d: 2150, rx: 9, ry: -30 }, t + 0.1, 2);
  const card = one(s, '.dp-ticket');
  // The alert shrinks back through space onto its tile.
  s.tl.to(card, { x: MINE_WORLD.x, y: MINE_WORLD.y, z: MINE_WORLD.z - Z.ticket, scale: TILE.w / 660, duration: 1.4, ease: 'story-in-out' }, t + 0.5);
  s.tl.to(card, { opacity: 0, duration: 0.25, ease: 'none' }, t + 1.75);
  s.tl.set(objs.ticket, { visibility: 'hidden' }, t + 2.1);
  const tiles = all(s, '.dp-tile');
  const mine = one(s, '.dp-tile[data-mine]');
  const rest = tiles.filter((x) => x !== mine);
  gsap.set(mine, { opacity: 0 });
  s.tl.to(mine, { opacity: 1, duration: 0.3 }, t + 1.8);
  // The rest arrive out of the depths, week by week.
  gsap.set(rest, { z: -900, opacity: 0 });
  s.tl.to(rest, { z: 0, opacity: 1, duration: 0.6, stagger: 0.009, ease: 'story-out' }, t + 1.2);
  const wallN = one(s, '.dp-wall-n');
  enter(s, [wallN, one(s, '.dp-wall-label')], t + 1.4, { y: 20 });
  count(s, wallN, t + 1.5, 1.8, 1, 'none');
  captionIn(s, 'pattern', t + 1.8);
  s.t = t + 4.6;
  mark(s, 'pattern', t, s.t);

  /* ---------- 03: swing to the front; three conditions fly into the rule ---------- */

  t = s.t;
  captionOut(s, 'pattern', t);
  s.tl.to(tiles, { opacity: 0.18, duration: 0.6 }, t + 0.1);
  s.tl.to([wallN, one(s, '.dp-wall-label')], { opacity: 0, duration: 0.4 }, t + 0.1);
  s.tl.set(objs.rule, { visibility: 'visible' }, t + 0.1);
  fly({ tx: 0, ty: 0, tz: Z.rule, d: 1300, rx: 0, ry: 0 }, t + 0.2, 1.9);
  const rule = one(s, '.dp-rule');
  gsap.set(rule, { opacity: 0, scale: 0.94 });
  s.tl.to(rule, { opacity: 1, scale: 1, duration: 0.8 }, t + 1.3);

  const chips = all(s, '.dp-chip');
  const slots = all(s, '.dp-slot');
  const ruleOrigin = { x: -320, y: -190 };
  chips.forEach((chip, i) => {
    const slot = box(s, slots[i]);
    const ruleBox = box(s, rule);
    // the slot, in world coordinates: the rule card's corner plus the slot's offset in it
    const to = { x: ruleOrigin.x + (slot.x - ruleBox.x), y: ruleOrigin.y + (slot.y - ruleBox.y), z: Z.rule + 2 };
    const from = { x: WALL.x - WALL.w / 2 + 180 + i * 330, y: WALL.y + 30, z: Z.wall + 40 };
    gsap.set(chip, { x: from.x, y: from.y, z: from.z, rotationY: 50, opacity: 0 });
    const val = chip.querySelector<HTMLElement>('.dp-chip-val')!;
    gsap.set(val, { text: CONDITIONS[i].specific });
    s.tl.to(chip, { opacity: 1, duration: 0.4 }, t + 0.8 + i * 0.15);
    s.tl.to(chip, { x: to.x, y: to.y, z: to.z, rotationY: 0, duration: 1.3, ease: 'story-in-out' }, t + 1.3 + i * 0.2);
    s.tl.to(val, { scrambleText: { text: CONDITIONS[i].general, chars: '*0123456789', speed: 0.5 }, duration: 0.7, ease: 'none' }, t + 2.9 + i * 0.3);
  });
  // Written into the rule, the values settle from evidence-amber into the rule's own colours.
  s.tl.to(chips, { backgroundColor: '#0b0b0b', boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.11)', color: '#ededed', duration: 0.6, stagger: 0.1 }, t + 3.9);
  captionIn(s, 'rule', t + 1.6);
  s.t = t + 4.6;
  mark(s, 'rule', t, s.t);

  /* ---------- 04: a reticle locks on Approve; the approval comes forward ---------- */

  t = s.t;
  captionOut(s, 'rule', t);
  const approve = one(s, '.dp-approve');
  const ab = box(s, approve);
  const rb = box(s, rule);
  const ret = one(s, '.dp-reticle');
  const at = { x: ruleOrigin.x + (ab.x - rb.x) + ab.w / 2 - 75, y: ruleOrigin.y + (ab.y - rb.y) + ab.h / 2 - 29, z: Z.rule + 6 };
  gsap.set(ret, { x: at.x, y: at.y, z: at.z, scale: 2.6, opacity: 0 });
  s.tl.to(ret, { scale: 1, opacity: 1, duration: 0.6, ease: 'story-out' }, t + 0.3);
  s.tl.to(ret, { keyframes: [{ scale: 0.86, duration: 0.1 }, { scale: 1, duration: 0.2 }] }, t + 0.95);
  s.tl.to(approve, { keyframes: [{ scale: 0.95, duration: 0.1 }, { scale: 1, duration: 0.2 }] }, t + 0.95);

  const composer = one(s, '.dp-composer');
  s.tl.set(objs.composer, { visibility: 'visible' }, t + 1.05);
  gsap.set(composer, { z: -260, opacity: 0 });
  s.tl.to(composer, { z: 160, opacity: 1, duration: 0.8, ease: 'story-out' }, t + 1.1);
  // Rack focus: the rule behind softens while the approval is up front.
  s.tl.to(rule, { opacity: 0.35, duration: 0.6 }, t + 1.1);
  fly({ ty: 120, d: 1180 }, t + 1.1, 1);
  captionIn(s, 'decision', t + 1.3);
  type(s, one(s, '.dp-reason'), RULE.reason, t + 1.8, 2);
  all(s, '.dp-replay-n').forEach((n, i) => count(s, n, t + 2 + i * 0.1, 0.9));
  s.tl.to(composer, { z: -260, opacity: 0, duration: 0.5, ease: 'story-in-out' }, t + 4.2);
  s.tl.to(ret, { opacity: 0, scale: 1.4, duration: 0.3 }, t + 4.2);
  s.tl.to(rule, { opacity: 1, duration: 0.5 }, t + 4.3);
  fly({ ty: 0, d: 1300 }, t + 4.2, 0.9);
  const sweep = one(s, '.dp-sweep');
  gsap.set(sweep, { opacity: 1, xPercent: 0 });
  s.tl.to(sweep, { x: 900, duration: 0.8, ease: 'story-in-out' }, t + 4.4);
  const proposed = one(s, '.dp-proposed');
  const active = one(s, '.dp-active');
  gsap.set(proposed, { opacity: 1 });
  gsap.set(active, { opacity: 0 });
  s.tl.to(proposed, { opacity: 0, duration: 0.3 }, t + 4.6);
  s.tl.to(active, { opacity: 1, duration: 0.3 }, t + 4.7);
  s.tl.set(objs.composer, { visibility: 'hidden' }, t + 4.8);
  s.t = t + 6;
  mark(s, 'decision', t, s.t);

  /* ---------- 05: crane up and tilt down onto the gate ---------- */

  t = s.t;
  captionOut(s, 'decision', t);
  // Everything behind us fades first, then stops rendering: the camera flies past it.
  s.tl.to([rule, ...chips, ...tiles], { opacity: 0, duration: 0.6 }, t + 0.1);
  s.tl.set([objs.rule, objs.wall, ...chips, ret], { visibility: 'hidden' }, t + 0.8);
  s.tl.set(objs.floor, { visibility: 'visible' }, t + 0.1);
  fly({ tx: 80, ty: 0, tz: Z.floor, d: 1750, rx: 56, ry: 0 }, t + 0.2, 2.4);
  const lane = one(s, '.dp-lane');
  gsap.set(lane, { scaleX: 0 });
  s.tl.to(lane, { scaleX: 1, duration: 1, ease: 'story-in-out' }, t + 1.8);
  enter(s, one(s, '.dp-grid'), t + 1.4, { y: 0, duration: 1 });
  const gateRing = one(s, '.dp-gate');
  enter(s, gateRing, t + 2.2, { y: 0, scale: 0.6, duration: 0.7 });
  const beacon = one(s, '.dp-beacon-beam');
  const beaconLabel = one(s, '.dp-beacon-label');
  gsap.set(beacon, { scaleY: 0 });
  gsap.set(beaconLabel, { opacity: 0 });
  captionIn(s, 'gate', t + 1.9);

  const orbs = all(s, '.dp-orb');
  let last = t;
  orbs.forEach((orb, i) => {
    const go = t + 2.8 + i * 0.7;
    const hit = go + 0.8;
    last = hit;
    gsap.set(orb, { x: LANE.from - 60, opacity: 0 });
    s.tl.to(orb, { x: LANE.from, opacity: 1, duration: 0.2 }, go);
    s.tl.to(orb, { x: LANE.gate, duration: 0.8, ease: 'none' }, go);
    s.tl.to(one(s, '.dp-gate-ring'), { keyframes: [{ scale: 1.08, duration: 0.08 }, { scale: 1, duration: 0.3 }] }, hit);
    if (STREAM[i].match) {
      // Suppressed: it sinks through the floor and goes dark.
      s.tl.to(orb, { z: -320, opacity: 0, duration: 0.7, ease: 'power2.in' }, hit + 0.05);
    } else {
      s.tl.to(orb, { x: LANE.pass, duration: 0.8, ease: 'story-in-out' }, hit);
      s.tl.to(beacon, { scaleY: 1, duration: 0.6, ease: 'story-out' }, hit + 0.6);
      s.tl.to(beaconLabel, { opacity: 1, duration: 0.4 }, hit + 0.9);
    }
  });
  s.t = last + 1.8;
  mark(s, 'gate', t, s.t);

  /* ---------- ending: far back into the stars ---------- */

  t = s.t;
  captionOut(s, 'gate', t);
  // Pull far back and up: the gate sinks below the last line, small among the stars.
  fly({ tx: 0, ty: -1400, tz: Z.floor + 900, d: 5600, rx: 30, ry: -18 }, t + 0.1, 2.6);
  const outro = one(s, '.m-outro');
  const title = SplitText.create(one(s, '.outro-title'), { type: 'lines', mask: 'lines' });
  gsap.set(outro, { autoAlpha: 0 });
  gsap.set(title.lines, { yPercent: 105 });
  s.tl.to(outro, { autoAlpha: 1, duration: 0.6 }, t + 1.3);
  s.tl.to(title.lines, { yPercent: 0, duration: 0.8 }, t + 1.4);
  enter(s, all(s, '.m-outro .outro-sub, .m-outro .outro-stat'), t + 1.8, { stagger: 0.1 });
  all(s, '.m-outro .outro-num').forEach((n, i) => count(s, n, t + 1.9 + i * 0.1, 1));
  enter(s, one(s, '.m-outro .outro-actions'), t + 2.3, { y: 8 });
  s.t = t + 3.8;
  s.tl.set({}, {}, s.t);

  const readout = stage.closest('.film')?.querySelector<HTMLElement>('.fly-readout');
  return {
    story: s,
    onUpdate: () => {
      if (readout) readout.textContent = `${Math.round(-cam.tz).toLocaleString('en-GB')} · ${Math.round(cam.rx)}°`;
    },
    intro: () => {
      gsap
        .timeline({ defaults: { ease: 'story-out' } })
        .from(all(s, '.dp-star'), { opacity: 0, duration: 1.2, stagger: { amount: 1.4, from: 'random' } }, 0)
        .from(all(s, '.m-hero .hero > *'), { autoAlpha: 0, y: 16, filter: 'blur(8px)', duration: 1, stagger: 0.1 }, 0.3)
        .from(one(s, '.m-hero .hero-cue'), { autoAlpha: 0, duration: 0.8 }, 1.1);
    },
  };
}
