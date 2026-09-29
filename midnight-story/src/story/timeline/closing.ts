/* Suppression → guardrail → audit → outro: the rule at work, the rule that shouldn't exist,
 * the paper trail, and the wall again, quiet this time. */

import { gsap, SplitText } from '../../lib/gsap';
import { centerOf, focus, STAGE_H, STAGE_W } from '../../lib/geometry';
import { RULE_0419 } from '../data';
import { GATE_X, LANE, PILL_W } from '../scenes/Gate';
import { type Story, all, box, captionIn, captionOut, count, enter, leave, mark, one, pointer } from './kit';
import { buildRulePage, closeComposer, openComposer, recordDecision, writeReason } from './middle';

export function suppression(s: Story) {
  const t = s.t;
  const win = one(s, '.sc-rule .win');
  const gate = one(s, '.gt-rule');

  captionOut(s, 'decision', t);

  // The whole rule page folds down into the gate it has become.
  const w = box(s, win);
  const g = centerOf(box(s, gate));
  const k = box(s, gate).w / w.w;
  s.tl.to(one(s, '.sc-rule .toast'), { autoAlpha: 0, y: 8, duration: 0.3 }, t);
  s.tl.to(
    win,
    { x: g.x - w.x - (w.w * k) / 2, y: g.y - w.y - (w.h * k) / 2, scale: k, transformOrigin: '0 0', duration: 1.2, ease: 'mn-in-out' },
    t + 0.2,
  );
  s.tl.to(win, { autoAlpha: 0, filter: 'blur(6px)', duration: 0.5 }, t + 0.9);
  s.tl.set(one(s, '.sc-gate'), { autoAlpha: 1 }, t + 0.6);
  enter(s, gate, t + 1, { y: 0, scale: 1.12, blur: 6 });
  s.tl.set(one(s, '.sc-rule'), { autoAlpha: 0 }, t + 1.5);

  // The pipes come up around it.
  gsap.set(one(s, '.gt-beam'), { scaleY: 0 });
  s.tl.to(one(s, '.gt-beam'), { scaleY: 1, duration: 0.7, ease: 'mn-in-out' }, t + 1.4);
  enter(s, all(s, '.gt-incoming, .gt-lane'), t + 1.5, { y: 0, x: -12 });
  enter(s, one(s, '.gt-tray'), t + 1.7);
  enter(s, one(s, '.gt-queue'), t + 1.8, { y: 0, x: 16 });
  captionIn(s, 'suppression', t + 1.5);

  // The stream. Every alert rides the lane to the gate; matches drop into the pile,
  // the rest carry on to a person.
  const flash = one(s, '.gt-rule-flash');
  const pile = one(s, '.gt-tray-count');
  const paged = one(s, '.gt-paged-n');
  const rows = all(s, '.gt-row');
  const note = one(s, '.gt-note');
  gsap.set([pile, paged], { textContent: 0 });
  gsap.set(rows, { autoAlpha: 0, x: -8 });
  gsap.set(note, { autoAlpha: 0, y: 6 });

  const STAGGER = 0.62;
  const RIDE = 0.7;
  const start = t + 2.3;
  const pills = all(s, '.gt-pill');
  pills.forEach((pill, i) => {
    const at = start + i * STAGGER;
    const hit = at + RIDE;
    const endX = parseFloat(pill.style.left);
    const endY = parseFloat(pill.style.top);
    const slot = Number(pill.dataset.slot);
    const live = pill.querySelector<HTMLElement>('.gt-pill-live')!;
    const dead = pill.querySelector<HTMLElement>('.gt-pill-dead')!;

    gsap.set(pill, { x: LANE.x - endX - 24, y: LANE.y - endY, autoAlpha: 0 });
    gsap.set(live, { autoAlpha: 1 });
    gsap.set(dead, { autoAlpha: 0 });
    s.tl.to(pill, { autoAlpha: 1, duration: 0.2, ease: 'none' }, at);
    s.tl.to(pill, { x: GATE_X - PILL_W / 2 - endX, duration: RIDE, ease: 'none' }, at);
    s.tl.to(flash, { keyframes: [{ opacity: 0.9, duration: 0.06 }, { opacity: 0, duration: 0.35 }], ease: 'none' }, hit);

    if (pill.dataset.match !== undefined) {
      s.tl.to(live, { autoAlpha: 0, duration: 0.2 }, hit);
      s.tl.to(dead, { autoAlpha: 1, duration: 0.2 }, hit);
      s.tl.to(pill, { x: 0, y: 0, duration: 0.6, ease: 'mn-in-out' }, hit + 0.05);
      s.tl.set(pile, { textContent: slot + 1 }, hit + 0.5);
    } else {
      s.tl.to(pill, { x: 0, y: 0, duration: 0.75, ease: 'mn-in-out' }, hit);
      s.tl.to(pill, { autoAlpha: 0, duration: 0.2 }, hit + 0.7);
      s.tl.to(rows[slot], { autoAlpha: 1, x: 0, duration: 0.35 }, hit + 0.65);
      s.tl.set(paged, { textContent: slot + 1 }, hit + 0.7);
      if (pill.dataset.callout !== undefined) s.tl.to(note, { autoAlpha: 1, y: 0, duration: 0.5 }, hit + 0.9);
    }
  });

  // Meanwhile, the engine has something new.
  const end = start + (pills.length - 1) * STAGGER + RIDE + 1;
  enter(s, one(s, '.gt-proposal'), end, { y: -10, blur: 4 });

  s.t = end + 1.2;
  mark(s, 'suppression', t, s.t);
}

export function guardrail(s: Story) {
  const t = s.t;
  const gate = one(s, '.sc-gate');
  const scene = '.sc-guard';
  const win = one(s, `${scene} .win`);

  captionOut(s, 'suppression', t);

  // Dive into the new proposal.
  s.tl.to(gate, { ...focus(box(s, '.gt-proposal'), 3.4, 950, 450), duration: 1.4, ease: 'mn-in-out' }, t + 0.2);
  s.tl.to(gate, { autoAlpha: 0, duration: 0.6 }, t + 0.9);
  s.tl.set(one(s, scene), { autoAlpha: 1 }, t + 0.9);
  gsap.set(win, { autoAlpha: 0, scale: 0.8 });
  s.tl.to(win, { autoAlpha: 1, scale: 1, duration: 1 }, t + 1);

  buildRulePage(s, scene, t + 1.3);
  enter(s, all(s, `${scene} .rp-sec h3, ${scene} .rp-p`), t + 1.5, { y: 8 });
  enter(s, one(s, `${scene} .rp-callout`), t + 2, { y: 0, x: -10 });
  enter(s, all(s, `${scene} .rp-incidents li`), t + 2.2, { y: 6, stagger: 0.07 });
  captionIn(s, 'guardrail', t + 1.4);

  // The one real attack run in the evidence flares.
  const real = one(s, `${scene} .rp-incidents li[data-escalated]`);
  const calm = 'inset 0 0 0 1px rgba(240, 86, 92, 0.18), 0 0 0 4px rgba(240, 86, 92, 0)';
  gsap.set(real, { boxShadow: calm });
  s.tl.to(
    real,
    {
      keyframes: [{ boxShadow: 'inset 0 0 0 1px rgba(240, 86, 92, 0.8), 0 0 0 4px rgba(240, 86, 92, 0.16)', duration: 0.3 }, { boxShadow: calm, duration: 0.8 }],
      ease: 'none',
    },
    t + 2.8,
  );

  // Try to approve: the override wants a deliberate hold. Start holding… and let go.
  const a = t + 3.2;
  const hand = pointer(s, scene);
  const approve = one(s, `${scene} .rp-approve`);
  const approveCmp = one(s, `${scene} .rp-cmp-approve`);
  const hold = one(s, `${scene} .cmp-hold`);
  const fill = one(s, `${scene} .cmp-hold-fill`);
  const cancel = one(s, `${scene} .cmp-cancel`);
  const arrow = one(s, `${scene} .cursor`);
  hand.show(a, { x: 1330, y: 800 });
  hand.move(a + 0.1, box(s, approve), 0.8);
  hand.click(a + 0.95, box(s, approve), approve);
  openComposer(s, approveCmp, a + 1.05);
  hand.move(a + 1.5, box(s, hold), 0.6);
  gsap.set(fill, { clipPath: 'inset(0% 100% 0% 0%)' });
  s.tl.to([arrow, hold], { scale: 0.95, duration: 0.1 }, a + 2.15);
  // Holding is slow and linear, like a timer; letting go snaps back fast.
  s.tl.to(fill, { clipPath: 'inset(0% 44% 0% 0%)', duration: 1.3, ease: 'none' }, a + 2.2);
  s.tl.to(fill, { clipPath: 'inset(0% 100% 0% 0%)', duration: 0.2 }, a + 3.5);
  s.tl.to([arrow, hold], { scale: 1, duration: 0.15 }, a + 3.5);
  hand.move(a + 3.8, box(s, cancel), 0.6);
  hand.click(a + 4.45, box(s, cancel), cancel);
  closeComposer(s, approveCmp, a + 4.6);

  // Reject it instead, and say why.
  const reject = one(s, `${scene} .rp-reject`);
  const rejectCmp = one(s, `${scene} .rp-cmp-reject`);
  const input = box(s, `${scene} .rp-cmp-reject .cmp-input`);
  const submit = one(s, `${scene} .rp-cmp-reject .cmp-submit`);
  hand.move(a + 4.8, box(s, reject), 0.7);
  hand.click(a + 5.55, box(s, reject), reject);
  openComposer(s, rejectCmp, a + 5.65);
  hand.move(a + 5.9, { x: input.x + 60, y: input.y + 34 }, 0.5);
  hand.click(a + 6.45, input);
  hand.hide(a + 6.6);
  writeReason(s, `${scene} .rp-cmp-reject`, RULE_0419.reason, a + 6.6, 1.9);
  hand.show(a + 8.6, { x: input.x + input.w - 120, y: input.y + input.h + 14 });
  hand.move(a + 8.7, box(s, submit), 0.6);
  hand.click(a + 9.35, box(s, submit), submit);
  closeComposer(s, rejectCmp, a + 9.5);
  recordDecision(s, scene, a + 9.6, 'rejected');
  hand.hide(a + 10);
  s.tl.to(one(s, '[data-cap="guardrail"] .cap-aside'), { autoAlpha: 1, y: 0, duration: 0.6 }, a + 10);

  s.t = a + 11.2;
  mark(s, 'guardrail', t, s.t);
}

export function audit(s: Story) {
  const t = s.t;
  const card = one(s, '.au');

  captionOut(s, 'guardrail', t);
  leave(s, one(s, '.sc-guard'), t + 0.1, { y: 0, scale: 0.96, blur: 6, duration: 0.7 });
  s.tl.set(one(s, '.sc-audit'), { autoAlpha: 1 }, t + 0.3);
  enter(s, card, t + 0.4, { y: 30, duration: 0.9 });

  // The log fills in the order it happened: oldest at the bottom, newest on top.
  const entries = all(s, '.au-entry').reverse();
  enter(s, entries, t + 0.9, { y: 14, stagger: 0.45 });
  gsap.set(one(s, '.au-rail'), { scaleY: 0, transformOrigin: 'bottom' });
  s.tl.to(one(s, '.au-rail'), { scaleY: 1, duration: 1.6, ease: 'none' }, t + 0.9);
  enter(s, one(s, '.au-foot'), t + 2.8, { y: 6 });
  captionIn(s, 'audit', t + 0.8);

  s.t = t + 4.4;
  mark(s, 'audit', t, s.t);
}

export function outro(s: Story) {
  const t = s.t;
  const wall = one(s, '.sc-wall');
  const rows = all(s, '.wall-row');
  const target = one(s, '.wall-row[data-target]');

  captionOut(s, 'audit', t);
  leave(s, one(s, '.au'), t + 0.1, { y: -10, scale: 0.96, blur: 6, duration: 0.7 });
  s.tl.set(one(s, '.sc-audit'), { autoAlpha: 0 }, t + 0.8);

  // Back to the wall, from a little closer than before, settling out. Quiet now.
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
    rows.filter((r) => r.dataset.noise !== undefined && r !== target),
    { opacity: 0.16, duration: 0.6, stagger: { amount: 0.8, from: 'random' } },
    t + 0.9,
  );
  // The alert we followed is the last to go quiet.
  s.tl.to(target, { opacity: 0.16, color: '#a3a3a3', duration: 0.9 }, t + 1.9);
  s.tl.to(
    rows.filter((r) => r.dataset.noise === undefined),
    { opacity: 1, duration: 0.6 },
    t + 0.9,
  );

  // The last word.
  const scene = one(s, '.sc-outro');
  const title = one(s, '.outro-title');
  const split = SplitText.create(title, { type: 'lines', mask: 'lines' });
  gsap.set(scene, { autoAlpha: 0 });
  gsap.set(split.lines, { yPercent: 105 });
  s.tl.set(scene, { autoAlpha: 1 }, t + 1);
  s.tl.to(split.lines, { yPercent: 0, duration: 0.8 }, t + 1.1);
  enter(s, one(s, '.outro-sub'), t + 1.4);
  enter(s, all(s, '.outro-stat'), t + 1.6, { stagger: 0.1 });
  all(s, '.outro-num').forEach((n, i) => count(s, n, t + 1.7 + i * 0.1, 1));
  enter(s, one(s, '.outro-actions'), t + 2, { y: 8 });

  s.t = t + 3.4;
  s.tl.addLabel('outro', t + 1);
  // Make sure the timeline runs all the way to the end of the hold.
  s.tl.set({}, {}, s.t);
}
