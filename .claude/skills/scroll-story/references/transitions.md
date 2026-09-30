# Transitions catalogue

Each recipe says what it *means* to the viewer and gives code lifted from the Midnight build.
All code assumes the kit (`timeline/kit.ts`): `s.tl` is the master timeline, `t` the chapter
start, `one/all/box` find and measure, and `enter/leave/swap/count/type/press/pointer` are the
helpers. Eases: `story-out` (arrive/leave), `story-in-out` (travel), `none` (machines).

## Contents
- Between chapters: portal zoom · slats into a chart · iris · slide with parallax · bands ·
  3D orbit · camera dive · grow to meet · collapse into a unit · pour into a stack ·
  FLIP into place · fold into a chip · step back · bookend return
- Within a chapter: rain / stack · lift and fly (with scramble) · camera lean-in · pointer
  click · form open/close · typing · counters · badge swap · decision recorded · hold to
  confirm (abandoned) · conveyor through a gate · line draws with a clock · list fills
  oldest-first · flare a row · caption lines rise

---

## Portal zoom
*"Go into this."* The strongest way to scroll *into* the next scene, repeatable in and out.
Draw the next scene as a miniature (same component, `scale(w/1440)`) on the current one, then:
```ts
portal(s, { outer: L1, inner: L2, target: ME_CARD, at: t + 0.1, duration: 1.9, fade: [0.3, 0.55] });
// later, back out into the same spot:
portal(s, { outer: L1, inner: L2, target: ME_CARD, at: t2, duration: 1.6, direction: 'out' });
```
Log-scale, locked layers, exact rewind. Options (`backdrop`, `beyond`, `prime`, `onZoom`) and
the rules are in `references/directions.md` §7; the code is `src/lib/camera.ts`.

## Slats into a chart
*"This colour is made of those weeks."* Build a full-bleed field from N slats (one per bar),
then gather them into the chart: each slat scales to its bar and moves to its column.
```ts
slats.forEach((slat, i) => s.tl.to(slat, {
  x: BAR.x + i * BAR.step - i * SLAT_W, y: BAR.base - h(i), scaleX: BAR.w / SLAT_W, scaleY: h(i) / 900,
  transformOrigin: '0 0', duration: 1.5, ease: 'story-in-out' }, t + 0.1 + i * 0.04));
```
Put a contrasting colour behind the slats so the field "opens" as they gather.

## Iris
*"Pressing this opens the next thing."* The next scene grows out of the button you clicked.
```ts
const c = centerOf(box(s, approve));
gsap.set(next, { clipPath: `circle(0px at ${c.x}px ${c.y}px)` });
s.tl.set(next, { visibility: 'visible' }, at);
s.tl.to(next, { clipPath: `circle(1700px at ${c.x}px ${c.y}px)`, duration: 1.2, ease: 'story-in-out' }, at);
```

## Slide with parallax
Next page slides in over the old, which drifts slower: `next x: 1440 → 0` and
`old x: 0 → −520`, same duration and ease.

## Bands
Horizontal bands of the next colour wipe in, staggered: `scaleX: 0 → 1`, origin left,
stagger 0.06.

## 3D orbit
*"Step back and look at it from here."* See `references/directions.md` §5: a camera object
(target, distance, tilt, turn) tweened as one, redrawing the world's inverse transform.

## Camera dive
*"Let's go into this one."* Scale a whole scene around one element until it fills the screen,
fade the scene, and the next scene grows up behind it.

```ts
// geometry.ts: put the centre of `target` at stage point (toX, toY) while scaling by `scale`
export function focus(target: Box, scale: number, toX = 720, toY = 450) {
  const c = centerOf(target);
  return { x: toX - c.x * scale, y: toY - c.y * scale, scale, transformOrigin: '0 0' };
}

s.tl.to(target, { '--halo': 1, scale: 1.04, duration: 0.6 }, 0.8);          // mark it first
s.tl.to(wall, { ...focus(box(s, target), 9, 970, 452), duration: 1.8, ease: 'story-in-out' }, 1.4);
s.tl.to(wall, { autoAlpha: 0, duration: 0.7, ease: 'none' }, 2.4);            // fade late in the move
```
Give the zoomed layer `will-change: transform` in CSS (cheap while zooming; it's gone before
the softness shows). Scale 3–4 for a notification, 8–10 for a row in a dense wall.

## Grow to meet
*The thing we dove into.* The incoming element starts small and grows as the camera "arrives".
```ts
gsap.set(card, { autoAlpha: 0, scale: 0.72 });
s.tl.to(card, { autoAlpha: 1, scale: 1, duration: 1 }, t);   // starts while the dive is fading
```

## Collapse into a unit
*"This is one of many."* An element shrinks onto one cell of a chart; then its siblings appear.
```ts
// geometry.ts: move/scale box `from` onto box `to` (origin 0 0, centred)
s.tl.to(card, { ...morph(box(s, card), box(s, cell)), duration: 1.3, ease: 'story-in-out' }, t + 0.1);
s.tl.to(card, { autoAlpha: 0, duration: 0.35, ease: 'none' }, t + 1.05);  // crossfade at the end
gsap.set(cell, { autoAlpha: 0 });
s.tl.to(cell, { autoAlpha: 1, duration: 0.3 }, t + 1.1);
```
Make the cell the *latest* one (this week's), so history fills in behind it.

## Rain / stack
*"…and again, and again."* Hundreds of small units drop into place with a tight stagger, and a
count runs alongside.
```ts
gsap.set(history, { autoAlpha: 0, y: -60 });
s.tl.to(history, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.011 }, rain);
count(s, countEl, rain, history.length * 0.011 + 0.4, 1, 'none');   // count keeps pace
```
Position units in React (absolute left/top computed from data), so the timeline only animates.
214 DOM squares is fine.

## Pour into a stack
*"All of these, together."* Every unit converges on one point as the next scene arrives there.
```ts
const into = centerOf(box(s, '.pt-card'));
const boxes = cells.map((c) => box(s, c));
s.tl.to(cells, {
  x: (i: number) => into.x - boxes[i].x - 9,        // function values run when the tween starts
  y: (i: number) => into.y - boxes[i].y - 9,
  scale: 0.4, autoAlpha: 0, duration: 0.9, ease: 'story-in-out',
  stagger: { amount: 0.5, from: 'end' },
}, t + 0.1);
enter(s, stack, t + 0.6, { y: 0, scale: 0.94, duration: 0.8 });
```

## Lift and fly (with scramble)
*"The engine takes this detail and generalises it."* A value lifts off a card as a chip, arcs
to its slot in a query, and scrambles from specific to general.
```ts
const from = box(s, field), to = box(s, slot), h = chip.offsetHeight;
gsap.set(slot, { text: 'tb-coupling-07' });                      // start: the specific value
gsap.set(chip, { x: from.x - 6, y: from.y + from.h / 2 - h / 2, autoAlpha: 0 });
s.tl.to(field, { backgroundColor: 'rgba(224,169,62,.16)', duration: 0.3 }, at);   // highlight source
s.tl.to(chip, { autoAlpha: 1, scale: 1.08, duration: 0.25 }, at + 0.2);           // lift
s.tl.to(chip, { x: to.x - 6, duration: 0.9, ease: 'story-in-out' }, at + 0.35);   // x and y on
s.tl.to(chip, { y: to.y + to.h / 2 - h / 2, duration: 0.9, ease: 'sine.inOut' }, at + 0.35); // different curves → an arc
s.tl.to(slot.parentElement!, { autoAlpha: 1, x: 0, duration: 0.5 }, at + 0.7);    // its line appears
s.tl.to(chip, { autoAlpha: 0, duration: 0.2 }, at + 1.25);
s.tl.to(slot, { scrambleText: { text: 'tb-coupling-*', chars: '*0123456789', speed: 0.6 }, duration: 0.6, ease: 'none' }, at + 1.2);
```
Make the chip **opaque** (solid dark amber, not a translucent wash) or the field shows through
as doubled text. Stagger several values ~1.2 s apart.

## FLIP into place
*"Here's where it lives in the product."* An element flies from one scene to its exact spot in
the next, which builds around it.
```ts
const from = box(s, query), to = box(s, targetQuery), w = box(s, win);
s.tl.to(query, { x: to.x - from.x, y: to.y - from.y, duration: 1.3, ease: 'story-in-out' }, t + 0.3);
// the window fades in scaling around the landing point, so the landing target doesn't move:
gsap.set(win, { autoAlpha: 0, scale: 0.97, transformOrigin: `${to.x - w.x + to.w / 2}px ${to.y - w.y + to.h / 2}px` });
s.tl.to(win, { autoAlpha: 1, scale: 1, duration: 1 }, t + 0.8);
gsap.set(targetQuery, { autoAlpha: 0 });
s.tl.to(targetQuery, { autoAlpha: 1, duration: 0.3, ease: 'none' }, t + 1.5);   // crossfade on landing
s.tl.to(query, { autoAlpha: 0, duration: 0.3, ease: 'none' }, t + 1.6);
```
Translate only, no scale, if the two have the same text size. To fade a card but keep the
flying child visible, fade the card's *background and shadow*, not the card:
```ts
s.tl.to(card, { backgroundColor: 'rgba(22,22,22,0)', boxShadow: '…same shadows with 0 alpha…', duration: 0.5 }, t);
```

## Fold into a chip
*"All of that is now this one small thing, working."* A whole page shrinks onto a small
element in the next scene.
```ts
const w = box(s, win), g = centerOf(box(s, chip)), k = box(s, chip).w / w.w;
s.tl.to(win, { x: g.x - w.x - (w.w * k) / 2, y: g.y - w.y - (w.h * k) / 2, scale: k, transformOrigin: '0 0', duration: 1.2, ease: 'story-in-out' }, t + 0.2);
s.tl.to(win, { autoAlpha: 0, filter: 'blur(6px)', duration: 0.5 }, t + 0.9);
enter(s, chip, t + 1, { y: 0, scale: 1.12, blur: 6 });     // chip resolves as the page arrives
```

## Camera lean-in
*"Look closely at this."* A subtle push (×1.05–1.1) towards a form while something is typed,
then back to 1 before the result, so the whole page is visible when it changes.
```ts
s.tl.to(scene, { ...focus(box(s, composer), 1.08, 940, 500), duration: 1, ease: 'story-in-out' }, t + 1.5);
s.tl.to(scene, { x: 0, y: 0, scale: 1, duration: 0.9, ease: 'story-in-out' }, t + 4.5);
```
Don't `will-change` a layer that rests zoomed; it rasterises soft.

## Pointer click
*A person is doing this.* A fake cursor lives **inside the scene** (so camera moves carry it).
```ts
const hand = pointer(s, '.sc-rule');
hand.show(t + 0.2, { x: 1330, y: 800 });
hand.move(t + 0.3, box(s, approve), 0.9);
hand.click(t + 1.25, box(s, approve), approve);   // cursor dips, ring expands, button presses
hand.hide(t + 2.45);
```

## Form open / close
Open slower than close; materialise with a little blur.
```ts
gsap.set(form, { autoAlpha: 0, y: 10, filter: 'blur(4px)' });
s.tl.to(form, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.45 }, at);
s.tl.to(form, { autoAlpha: 0, y: 8, filter: 'blur(4px)', duration: 0.25 }, later);
```

## Typing
```ts
type(s, el, 'Reviewed 30 samples. All cleared…', at, 2);   // TextPlugin, ease none
// with a caret: a span after the text, autoAlpha on at `at`, off after; blink it with a CSS
// animation on opacity (autoAlpha's visibility still hides it when off).
```

## Counters
```ts
count(s, el, at, 0.9);                   // element holds only digits: 0 → its final value
// "32h": render <b><span class="n">32</span>h</b> and count the span. Integers only.
```

## Badge swap
Two badges stacked in one grid cell (`.badge-swap`); dissolve with a touch of blur.
```ts
swap(s, one(s, '.status-from'), one(s, '.status-to'), at, 0.4);
```

## Decision recorded
The moment of truth lands everywhere at once: badge swaps, the tab's dot changes, the rail's
card swaps, a history row slides in, a toast arrives.
```ts
s.tl.set(tabDot, { attr: { 'data-s': 'active' } }, at);             // attribute flips rewind too
swap(s, statusFrom, statusTo, at, 0.4);
swap(s, pending, done, at + 0.05, 0.4);
gsap.set(newRow, { autoAlpha: 0 }); gsap.set(oldRow, { y: -newRow.offsetHeight });
s.tl.to(oldRow, { y: 0, duration: 0.5, ease: 'story-in-out' }, at + 0.1);   // make room
s.tl.to(newRow, { autoAlpha: 1, duration: 0.4 }, at + 0.35);
gsap.set(toast, { autoAlpha: 0, y: 14 });
s.tl.to(toast, { autoAlpha: 1, y: 0, duration: 0.5 }, at + 0.2);
```

## Hold to confirm, abandoned
*A guardrail you have to mean.* Press, fill slowly and linearly, let go before it completes,
snap back fast.
```ts
gsap.set(fill, { clipPath: 'inset(0% 100% 0% 0%)' });
s.tl.to([cursor, holdBtn], { scale: 0.95, duration: 0.1 }, at);
s.tl.to(fill, { clipPath: 'inset(0% 44% 0% 0%)', duration: 1.3, ease: 'none' }, at + 0.05);
s.tl.to(fill, { clipPath: 'inset(0% 100% 0% 0%)', duration: 0.2 }, at + 1.35);   // release
s.tl.to([cursor, holdBtn], { scale: 1, duration: 0.15 }, at + 1.35);
```

## Conveyor through a gate
*The product at work, at scale.* Items ride a lane to a gate; matches drop into a pile, the rest
continue to a queue. Draw items at their **final** positions (pile or queue slot) and fly them in
from the lane.
```ts
const STAGGER = 0.62, RIDE = 0.7;          // spacing = lane length / RIDE × STAGGER ≥ item width + gap
pills.forEach((pill, i) => {
  const at = start + i * STAGGER, hit = at + RIDE;
  gsap.set(pill, { x: LANE.x - endX - 24, y: LANE.y - endY, autoAlpha: 0 });
  s.tl.to(pill, { autoAlpha: 1, duration: 0.2, ease: 'none' }, at);
  s.tl.to(pill, { x: GATE_X - W / 2 - endX, duration: RIDE, ease: 'none' }, at);    // steady belt
  s.tl.to(flash, { keyframes: [{ opacity: 0.9, duration: 0.06 }, { opacity: 0, duration: 0.35 }], ease: 'none' }, hit);
  if (match) {
    s.tl.to(live, { autoAlpha: 0, duration: 0.2 }, hit); s.tl.to(dead, { autoAlpha: 1, duration: 0.2 }, hit);  // struck through
    s.tl.to(pill, { x: 0, y: 0, duration: 0.6, ease: 'story-in-out' }, hit + 0.05);   // drop to pile
    s.tl.set(pileCount, { textContent: slot + 1 }, hit + 0.5);                          // sets rewind
  } else {
    s.tl.to(pill, { x: 0, y: 0, duration: 0.75, ease: 'story-in-out' }, hit);          // on to the queue
    s.tl.to(pill, { autoAlpha: 0, duration: 0.2 }, hit + 0.7);
    s.tl.to(rows[slot], { autoAlpha: 1, x: 0, duration: 0.35 }, hit + 0.65);           // becomes a row
  }
});
```
Include one near-miss (same source, over the threshold) and call it out. That's the moment
people remember.

## Line draws with a clock
```ts
gsap.set(lines, { drawSVG: '0%' });
s.tl.to(lines, { drawSVG: '100%', duration: 2.4, ease: 'none' }, at);
count(s, timer, at, 2.4, 0, 'none');                      // clock runs with the line
```
Colour the over-threshold part with a second copy of the path clipped to the region above the
threshold (`clipPath` rect); draw both together.

## List fills oldest-first
An audit log shown newest-first, revealed bottom-up so it plays in the order it happened; the
timeline rail draws with it.
```ts
enter(s, all(s, '.au-entry').reverse(), t + 0.9, { y: 14, stagger: 0.45 });
gsap.set(rail, { scaleY: 0, transformOrigin: 'bottom' });
s.tl.to(rail, { scaleY: 1, duration: 1.6, ease: 'none' }, t + 0.9);
```

## Flare a row
```ts
const calm = 'inset 0 0 0 1px rgba(240,86,92,.18), 0 0 0 4px rgba(240,86,92,0)';   // same shadow count
gsap.set(row, { boxShadow: calm });
s.tl.to(row, { keyframes: [{ boxShadow: 'inset 0 0 0 1px rgba(240,86,92,.8), 0 0 0 4px rgba(240,86,92,.16)', duration: 0.3 }, { boxShadow: calm, duration: 0.8 }], ease: 'none' }, at);
```

## Step back
```ts
leave(s, one(s, '.sc-guard'), t + 0.1, { y: 0, scale: 0.96, blur: 6, duration: 0.7 });
```

## Bookend return
*The same place, transformed.* Bring back the opening layer from slightly zoomed-in, settle to
1, and change its state. A `fromTo` on a layer that animated earlier needs
`immediateRender: false`.
```ts
s.tl.set(wall, { attr: { 'data-state': 'quiet' } }, t + 0.3);
s.tl.fromTo(wall,
  { x: (1440 - 1440 * 1.15) / 2, y: (900 - 900 * 1.15) / 2, scale: 1.15, autoAlpha: 0, transformOrigin: '0 0' },
  { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 1.8, immediateRender: false }, t + 0.3);
s.tl.to(noiseRows, { opacity: 0.16, duration: 0.6, stagger: { amount: 0.8, from: 'random' } }, t + 0.9);
s.tl.to(protagonistRow, { opacity: 0.16, duration: 0.9 }, t + 1.9);   // the one we followed goes quiet last
```

## Caption lines rise
Handled by `captionIn` / `captionOut` in the kit: SplitText lines with masks, rising 105% →
0 with a 0.08 s stagger; out with a small lift and 4px blur. Add
`padding-bottom: .08em; margin-bottom: -.08em` to the line masks or descenders get clipped.
