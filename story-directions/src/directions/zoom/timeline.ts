/* Zoom choreography. Five portal zooms carry the whole story:
 *
 *   opening   board → group          (×6)    into Tractor Beam Ops
 *   alert     group → alert page     (×20)   into one dot, which is a page
 *   pattern   alert → group          (out)   back into its dot; the dots pour into weeks
 *   rule      (pan right)                    leader lines carry the pattern to the engine
 *   decision  group → rule page      (×2.25) into the proposal; reason, approve, Active
 *   gate      rule page → board      (out)   the rule lands on the board; the group goes quiet
 */

import { portal } from '../../lib/camera';
import { boxIn } from '../../lib/geometry';
import { gsap, SplitText } from '../../lib/gsap';
import { all, captionIn as capIn, captionOut as capOut, count, createStory, enter, mark, one, prepareCaption, type, type Story } from '../../lib/kit';
import { CHAPTERS, CONDITIONS, RULE } from '../../shared/story';
import type { Built } from '../../shared/types';
import { CELL, CLOUD, CLUSTER_ZOOM, MARKER, ME_CARD, ME_CELL, PAN, RULE_CARD, TRACTOR_BOX } from './map';

const LIVE = { backgroundColor: '#e0a93e', boxShadow: 'inset 0 0 0 1px #e0a93e' };
const QUIET = { backgroundColor: 'rgba(224, 169, 62, 0)', boxShadow: 'inset 0 0 0 1px #737373' };
const CARD_PLAIN = 'inset 0 1px 0 rgba(255, 255, 255, 0.03), inset 0 0 0 1px rgba(255, 255, 255, 0.07)';
const CARD_RULED = 'inset 0 1px 0 rgba(255, 255, 255, 0.03), inset 0 0 0 1px rgba(69, 196, 122, 0.55)';

/* The caption panel comes and goes with its caption, so it's never up empty over a zoom. */
const panelOf = (s: Story) => s.stage.querySelector('.z-panel')!;
function captionIn(s: Story, id: string, at: number) {
  s.tl.to(panelOf(s), { autoAlpha: 1, y: 0, duration: 0.4 }, at - 0.15);
  return capIn(s, id, at);
}
function captionOut(s: Story, id: string, at: number) {
  s.tl.to(panelOf(s), { autoAlpha: 0, y: 8, duration: 0.35 }, at + 0.1);
  return capOut(s, id, at);
}

export function buildZoom(stage: HTMLElement): Built {
  const s = createStory(stage);
  const L0 = one(s, '.z-L0');
  const L1 = one(s, '.z-L1');
  const L2 = one(s, '.z-L2');
  const L3 = one(s, '.z-L3');
  const outro = one(s, '.m-outro');

  gsap.set([L1, L2, L3], { visibility: 'hidden' });
  gsap.set([one(s, '.z-panel'), outro], { autoAlpha: 0, y: 8 });
  CHAPTERS.forEach((c) => prepareCaption(s, c.id));

  // The board starts loud: every alert live, no group ruled yet.
  const quietDots = all(s, '.z-dot[data-quiet]');
  const ruledCards = all(s, '.z-group[data-id="tractor"], .z-group[data-ruled]');
  gsap.set(quietDots, LIVE);
  gsap.set(ruledCards, { boxShadow: CARD_PLAIN });
  const me = one(s, '.z-me');
  gsap.set(me, { ...LIVE, '--ring': 0 });

  const zoom = { v: 1 };
  const at = (base: number) => (_z: number, scale: number) => (zoom.v = base * scale);

  /* ---------- opening: the board, then into the group ---------- */

  s.tl.addLabel('hero', 0);
  const hero = one(s, '.m-hero');
  s.tl.to(one(s, '.m-hero .hero'), { autoAlpha: 0, y: -40, filter: 'blur(6px)', duration: 1 }, 0);
  s.tl.to(one(s, '.m-hero .hero-cue'), { autoAlpha: 0, duration: 0.4 }, 0);
  s.tl.to(hero, { autoAlpha: 0, duration: 0.6 }, 0.4);
  const others = all(s, '.z-group:not([data-id="tractor"]), .z-dot[data-g]:not([data-g="tractor"])');
  s.tl.to(others, { opacity: 0.25, duration: 0.8 }, 0.5);
  s.tl.to(me, { '--ring': 1, duration: 0.6 }, 0.8);

  // The group's dots up close start where the board's dots are, drawn larger so the handover
  // doesn't jump, and settle to their own size as the zoom lands.
  const pts = all(s, '.z-L1 .z-pt:not(.z-pt-me)');
  CLOUD.forEach((p, i) => gsap.set(pts[i], { x: p.x - 5 - p.cell.x, y: p.y - 5 - p.cell.y, scale: 2.6, borderRadius: '50%', ...LIVE }));
  const meCard = one(s, '.z-me-card');
  const head = one(s, '.z-group-view');
  gsap.set(head, { autoAlpha: 0, y: 10 });
  portal(s, { outer: L0, inner: L1, target: TRACTOR_BOX, at: 1.1, duration: 2.2, fade: [0.22, 0.5], backdrop: one(s, '.z-bg'), onZoom: at(1) });
  s.tl.to(pts, { scale: 1, duration: 1.1 }, 2.2);
  s.tl.to(head, { autoAlpha: 1, y: 0, duration: 0.6 }, 2.6);
  s.tl.to(meCard, { opacity: 1, duration: 0.5 }, 2.3);
  s.t = 3.3;

  /* ---------- 01: into the dot, which is a page ---------- */

  let t = s.t;
  const [miniStart, miniEnd] = all(s, '.z-me-card .z-phase');
  gsap.set(miniStart, { autoAlpha: 1 });
  gsap.set(miniEnd, { autoAlpha: 0 });
  // Everything but our alert steps back before the dive.
  s.tl.to(pts, { opacity: 0.2, duration: 0.5 }, t);
  portal(s, { outer: L1, inner: L2, target: ME_CARD, at: t + 0.1, duration: 1.9, fade: [0.3, 0.55], onZoom: at(CLUSTER_ZOOM) });
  captionIn(s, 'alert', t + 1.4);

  const lines = all(s, '.z-L2 .z-line');
  const peak = one(s, '.z-L2 .z-peak');
  gsap.set(lines, { drawSVG: '0%' });
  gsap.set(peak, { opacity: 0 });
  s.tl.to(lines, { drawSVG: '100%', duration: 2.4, ease: 'none' }, t + 2.2);
  s.tl.to(peak, { opacity: 1, duration: 0.3 }, t + 3.0);
  count(s, one(s, '.z-L2 .z-clock'), t + 2.2, 2.4, 0, 'none');
  const open = one(s, '.z-L2 .z-open');
  const cleared = one(s, '.z-L2 .z-cleared');
  gsap.set(open, { autoAlpha: 1 });
  gsap.set(cleared, { autoAlpha: 0, filter: 'blur(3px)' });
  s.tl.to(open, { autoAlpha: 0, filter: 'blur(3px)', duration: 0.35 }, t + 4.7);
  s.tl.to(cleared, { autoAlpha: 1, filter: 'blur(0px)', duration: 0.35 }, t + 4.8);
  enter(s, one(s, '.z-L2 .z-foot'), t + 4.9, { y: 8 });
  // Behind the full page, the miniature changes to match, ready for the zoom back out.
  s.tl.set(miniStart, { autoAlpha: 0 }, t + 5.4);
  s.tl.set(miniEnd, { autoAlpha: 1 }, t + 5.4);
  s.t = t + 6.2;
  mark(s, 'alert', t, s.t);

  /* ---------- 02: back out; the dots pour into weeks ---------- */

  t = s.t;
  captionOut(s, 'alert', t);
  portal(s, { outer: L1, inner: L2, target: ME_CARD, at: t + 0.1, duration: 1.6, direction: 'out', fade: [0.3, 0.55], onZoom: at(CLUSTER_ZOOM) });

  const mePt = one(s, '.z-pt-me');
  gsap.set(mePt, { autoAlpha: 0 });
  // Scattered alerts become squares in a chart: position, shape and colour, left to right.
  s.tl.to(pts, { opacity: 1, duration: 0.5 }, t + 1.6);
  s.tl.to(pts, { x: 0, y: 0, borderRadius: 3, backgroundColor: '#2b2b2b', boxShadow: 'inset 0 0 0 1px #2b2b2b', duration: 1.4, ease: 'story-in-out', stagger: { each: 0.004 } }, t + 1.8);
  const w = CELL / 1440;
  s.tl.to(meCard, { x: ME_CELL.x - ME_CARD.x, y: ME_CELL.y + (CELL - 900 * w) / 2 - ME_CARD.y, scale: w, duration: 1.3, ease: 'story-in-out' }, t + 1.8);
  s.tl.to(meCard, { opacity: 0, duration: 0.3, ease: 'none' }, t + 2.9);
  s.tl.to(mePt, { autoAlpha: 1, duration: 0.3 }, t + 2.95);
  enter(s, one(s, '.z-count'), t + 1.7);
  count(s, one(s, '.z-count-n'), t + 1.9, 1.4, 1, 'none');
  enter(s, one(s, '.z-axis'), t + 2.6, { y: 6 });
  enter(s, all(s, '.z-anno'), t + 3.3, { y: 8, stagger: 0.2 });
  captionIn(s, 'pattern', t + 2);
  s.t = t + 5.6;
  mark(s, 'pattern', t, s.t);

  /* ---------- 03: pan to the engine; the pattern becomes conditions ---------- */

  t = s.t;
  captionOut(s, 'pattern', t);
  const pan = one(s, '.z-pan');
  s.tl.to(pan, { x: PAN, duration: 2, ease: 'story-in-out' }, t + 0.1);

  const page = one(s, '.z-rule-card .z-sheet');
  const k = RULE_CARD.w / 1440;
  const vals = all(s, '.z-rule-card .z-cond-val');
  const annos = all(s, '.z-anno');
  all(s, '.z-leaders path').forEach((path, i) => {
    const a = boxIn(annos[i], pan);
    const v = boxIn(vals[i], page);
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h;
    const bx = RULE_CARD.x + v.x * k - 8;
    const by = RULE_CARD.y + (v.y + v.h / 2) * k;
    gsap.set(path, { attr: { d: `M${ax},${ay} C${ax},${ay + 160} ${bx - 420},${by} ${bx},${by}` }, drawSVG: '0%' });
  });
  s.tl.to(all(s, '.z-leaders path'), { drawSVG: '100%', duration: 1.8, stagger: 0.15, ease: 'story-in-out' }, t + 0.3);
  CONDITIONS.forEach((c, i) => {
    gsap.set(vals[i], { text: c.specific });
    s.tl.to(vals[i], { scrambleText: { text: c.general, chars: '*0123456789', speed: 0.5 }, duration: 0.7, ease: 'none' }, t + 2.1 + i * 0.35);
  });
  captionIn(s, 'rule', t + 1.4);
  s.t = t + 4.4;
  mark(s, 'rule', t, s.t);

  /* ---------- 04: into the proposal; a person approves it ---------- */

  t = s.t;
  captionOut(s, 'rule', t);
  portal(s, { outer: L1, inner: L3, target: { ...RULE_CARD, x: RULE_CARD.x + PAN }, at: t + 0.1, duration: 1.7, fade: [0.15, 0.4], onZoom: at(CLUSTER_ZOOM) });
  captionIn(s, 'decision', t + 1.3);

  const proposed = one(s, '.z-L3 .z-proposed');
  const active = one(s, '.z-L3 .z-active');
  const decided = one(s, '.z-L3 .z-decided');
  const btn = one(s, '.z-L3 .z-approve-btn');
  gsap.set(proposed, { autoAlpha: 1 });
  gsap.set(active, { autoAlpha: 0, filter: 'blur(3px)' });
  gsap.set(decided, { autoAlpha: 0, y: 8 });
  type(s, one(s, '.z-L3 .z-reason-text'), RULE.reason, t + 1.9, 1.9);
  s.tl.to(btn, { keyframes: [{ scale: 0.96, duration: 0.08 }, { scale: 1, duration: 0.18 }] }, t + 4.1);
  s.tl.to(proposed, { autoAlpha: 0, filter: 'blur(3px)', duration: 0.35 }, t + 4.3);
  s.tl.to(active, { autoAlpha: 1, filter: 'blur(0px)', duration: 0.35 }, t + 4.4);
  s.tl.to(decided, { autoAlpha: 1, y: 0, duration: 0.5 }, t + 4.5);
  s.t = t + 5.9;
  mark(s, 'decision', t, s.t);

  /* ---------- 05: all the way out; the rule lands on the board and its group goes quiet ---------- */

  t = s.t;
  captionOut(s, 'decision', t);
  const marker = one(s, '.z-L0 .z-marker');
  gsap.set(marker, { autoAlpha: 0 });
  s.tl.set(marker, { autoAlpha: 1 }, t + 0.1);
  portal(s, { outer: L0, inner: L3, target: MARKER, at: t + 0.1, duration: 2.3, direction: 'out', fade: [0.15, 0.4], onZoom: at(1) });

  const tractorCard = one(s, '.z-group[data-id="tractor"]');
  const badge = one(s, '.z-group-rule');
  gsap.set(badge, { autoAlpha: 0, y: 4 });
  s.tl.to(tractorCard, { boxShadow: CARD_RULED, duration: 0.6 }, t + 2.5);
  s.tl.to(badge, { autoAlpha: 1, y: 0, duration: 0.4 }, t + 2.7);
  s.tl.to(all(s, '.z-dot[data-g="tractor"][data-quiet]'), { ...QUIET, duration: 0.4, stagger: { amount: 1, from: 'random' } }, t + 2.9);
  s.tl.to(me, { ...QUIET, '--ring': 0, duration: 0.5 }, t + 4);
  // New alerts land in the group and go quiet at once…
  all(s, '.z-L0 .z-new').forEach((n, i) => {
    gsap.set(n, { autoAlpha: 0, scale: 0.4, ...LIVE });
    s.tl.to(n, { autoAlpha: 1, scale: 1, duration: 0.2 }, t + 4.3 + i * 0.3);
    s.tl.to(n, { ...QUIET, duration: 0.3 }, t + 4.65 + i * 0.3);
  });
  // …except the one that's over the line.
  const hot = one(s, '.z-L0 .z-hot');
  gsap.set(hot, { autoAlpha: 0, scale: 0.4 });
  s.tl.to(hot, { autoAlpha: 1, scale: 1, duration: 0.4 }, t + 5.5);
  enter(s, one(s, '.z-tip'), t + 5.7, { y: 6 });
  captionIn(s, 'gate', t + 2.6);
  s.t = t + 7.4;
  mark(s, 'gate', t, s.t);

  /* ---------- ending: every other rule lands; the board goes quiet ---------- */

  t = s.t;
  captionOut(s, 'gate', t);
  s.tl.to(others, { opacity: 1, duration: 0.8 }, t + 0.2);
  s.tl.to(all(s, '.z-group[data-ruled]'), { boxShadow: CARD_RULED, duration: 0.6, stagger: 0.2 }, t + 0.5);
  s.tl.to(all(s, '.z-dot[data-quiet]:not([data-g="tractor"])'), { ...QUIET, duration: 0.3, stagger: { amount: 1.2, from: 'random' } }, t + 0.8);
  s.tl.to(one(s, '.z-tip'), { autoAlpha: 0, duration: 0.3 }, t + 0.8);

  const title = SplitText.create(one(s, '.outro-title'), { type: 'lines', mask: 'lines' });
  gsap.set(title.lines, { yPercent: 105 });
  s.tl.to(outro, { autoAlpha: 1, y: 0, duration: 0.6 }, t + 1.4);
  s.tl.to(title.lines, { yPercent: 0, duration: 0.8 }, t + 1.5);
  enter(s, one(s, '.outro-sub'), t + 1.8);
  enter(s, all(s, '.outro-stat'), t + 2, { stagger: 0.1 });
  all(s, '.outro-num').forEach((n, i) => count(s, n, t + 2.1 + i * 0.1, 1));
  enter(s, one(s, '.outro-actions'), t + 2.4, { y: 8 });
  s.t = t + 3.8;
  s.tl.set({}, {}, s.t);

  const readout = stage.closest('.film')?.querySelector<HTMLElement>('.z-zoom');
  return {
    story: s,
    onUpdate: () => {
      if (readout) readout.textContent = `×${zoom.v < 10 ? zoom.v.toFixed(1) : Math.round(zoom.v)}`;
    },
    intro: () => {
      gsap
        .timeline({ defaults: { ease: 'story-out' } })
        .from(all(s, '.z-group'), { y: 24, opacity: 0, duration: 1.1, stagger: { amount: 0.6, from: 'random' } }, 0)
        .from(all(s, '.z-dot[data-g]'), { opacity: 0, duration: 0.6, stagger: { amount: 1, from: 'random' } }, 0.3)
        .from(all(s, '.m-hero .hero > *'), { autoAlpha: 0, y: 14, filter: 'blur(6px)', duration: 1, stagger: 0.12 }, 0.35)
        .from(one(s, '.m-hero .hero-cue'), { autoAlpha: 0, duration: 0.8 }, 1.2);
    },
  };
}
