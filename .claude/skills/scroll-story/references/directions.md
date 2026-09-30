# Directions: different ways to move through the same product

A direction is a **motion grammar**: how the scroll behaves, how the camera moves, and how one
scene hands over to the next. It is **not** a new visual style. Keep the product's own look
(its tokens, type, cards, badges, buttons): the story sells the real UI. What makes two
stories feel different is how you travel through them.

The primary choices are **Fly** (`assets/fly/`, Fly opens by default) and **Midnight**
(`assets/midnight/`, the original walkthrough). See `builds.md` for source locations.
Zoom and Snap remain optional variations in `assets/fly/` (`?d=zoom | snap | fly`).

## Contents
1. What changes and what doesn't · 2. Choosing · 3. Zoom · 4. Snap · 5. Fly · 6. Midnight ·
7. The portal zoom · 8. Snap to beats · 9. Inventing more

## 1. What changes and what doesn't

**Stays the same**: the product's visual language · pinned + scrubbed by one timeline ·
scenes drawn in their end state · exact rewind · a caption per chapter · the chapter rail ·
the load gate · the fallback · every transition carries something.

**Changes**: whether the scroll is smooth or snaps · the camera (none, 2D zoom, 3D) · the
transition moves · where captions sit (left column, glass panel) · small chrome (a zoom or
depth readout).

## 2. Choosing

| If the story is about… | Direction | Grammar in one line |
| --- | --- | --- |
| Going from the whole system down to one record and back | **Zoom** | Scroll *into* the UI, again and again, with portal zooms |
| A launch / keynote pace, one idea per beat | **Snap** | Each flick plays one move; the layout does the travelling |
| Scale, systems, flow | **Fly** | A 3D camera flies through floating UI |
| A calm walkthrough of the product | **Midnight** | The starter / midnight-story: fly-tos, one dive |

Choose Fly or Midnight from the brief unless the user requests another direction. Honour an
explicit choice and name it in the storyboard table. Zoom and Snap are optional alternatives.

## 3. Zoom

- **World**: a board of the product's own cards (in Midnight, one card per assignment group,
  open alerts as amber dots). Every deeper screen is also drawn as a **miniature** in the one
  above it, so every zoom is a portal zoom (§7).
- **Beats**: zoom into the group card · into one dot, which is the alert's page · zoom back out
  as the dots pour into a weekly chart (dots tween position, radius and colour into squares) ·
  pan to the engine, leader lines draw from annotations into the rule's conditions · zoom into
  the rule page; type the reason, press Approve, badge → Active · zoom all the way out: the rule
  lands on the board as a card, its group turns green and its dots go hollow; one red dot stays.
- **Details**: dim everything but the target before each dive (fly *to* something, not through
  a crowd) · the inner layer's background fades in only on landing (`backdrop`) so the board
  shows around it mid-zoom · captions in a glass panel that comes and goes with each caption ·
  a zoom readout from `onZoom`.

## 4. Snap

- **Scroll**: snaps to each chapter's resting frame (§8). One flick = one move played through.
- **Beats**: scroll *through the counter of the "o"* in the headline (portal with `prime` so
  the next page shows through the hole, `beyond` + a growing `clip-path: ellipse()` from
  `onZoom` so the hole swallows the screen; release the clip once through) · the page is 12
  **slats** that gather into the bar chart while the alert card squashes onto this week's bar ·
  the next page **slides in** as the old one drifts slower (parallax) · an **iris** opens out of
  the Approve button · **bands** wipe the next page in · alerts ride a lane to a gate; matches
  are struck through and **drop** (power2.in) · the ending irises out of the one that got
  through; the headline returns with "noise" struck out.
- **Details**: fit the letter's window to its actual counter (screenshot mid-dive and
  adjust) · space conveyor items so a dropped one is gone before the next arrives ·
  `?nosnap` for testing, or screenshots snap to the nearest rest.

## 5. Fly

- **World**: one CSS 3D scene (`perspective: 1200px`): the product's cards floating at
  different depths, alerts as faint points of light, a wall of chart tiles, a floor with a gate.
- **Orbit camera**: target (tx, ty, tz), distance d, tilt rx, turn ry; the world gets
  `translate3d(fx, fy, P − d) rotateX(rx) rotateY(ry) translate3d(−tx, −ty, −tz)`, redrawn from
  one tweened `cam` object. At d = perspective, things at the target are true size.
- **Beats**: dolly to the alert · pull back and orbit; the card shrinks through space onto its
  tile; the rest arrive from z −900 · swing to the front; condition chips fly out of the wall into
  the rule and settle from amber to the rule's colours · a reticle locks on Approve; the approval
  panel comes forward in z while the rule softens (rack focus); a light sweep flips it Active ·
  crane up and tilt 56° onto the floor; spheres roll through a ring gate, matches sink, one rolls
  on and raises a red beacon · pull far back for the ending.
- **3D rules** (break them and it silently flattens): `preserve-3d` on every level from the
  world to a moving object; no opacity < 1, filter, `overflow` or `backdrop-filter` on those
  levels (fade leaf panels, hide objects with visibility); nothing on the camera's path;
  standing objects lean back to face a tilted camera. Fade the hero **layer**, not just its
  text, or its scrim darkens the whole scene.

## 6. Midnight

The starter and `assets/midnight/`: a fixed stage of product screens, fly-tos between them,
one camera dive at the start, a pointer acting out clicks. Calm and product-first.

## 7. The portal zoom

`src/lib/camera.ts` in the starter.

```ts
portal(s, {
  outer: groupLayer,          // the scene you're in (a full-stage layer)
  inner: alertLayer,          // the scene you're going into (a full-stage layer)
  target: ME_CARD,            // where the inner sits, as a miniature, on the outer (stage aspect)
  at: t + 0.1, duration: 1.9,
  direction: 'in',            // 'out' plays it backwards: the inner shrinks back into target
  fade: [0.3, 0.55],          // z range where the inner fades in over its miniature
  backdrop: innerBg,          // optional: inner background fades in only on landing
  beyond: 2.6,                // optional: keep diving after landing (through a hole)
  prime: true,                // optional: pose both layers now (a glimpse before the zoom)
  onZoom: (z, scale) => {},   // optional: readouts, clip-paths
});
```

- The miniature is the same component at `scale(target.w / 1440)`, so the crossfade is between
  two copies of the same markup. If the miniature's state changes (before/after), stack two
  phases and swap them while the full-size layer covers the screen.
- Log-scale (`s = k^z`) about the fixed point `k·o/(k − 1)`; a linear scale tween rushes the
  start and crawls at the end.
- Only the portal moves the two layers (it writes their transform every frame); animate
  children for everything else.

## 8. Snap to beats

In `Film.tsx`'s ScrollTrigger:

```ts
const rests = [0, ...marks.map((m) => (m.end - 0.25) / tl.duration()), 1];
snap: {
  snapTo: (v, self) => ScrollTrigger.snapDirectional(rests)(v, self?.direction ?? 1),
  duration: { min: 0.8, max: 2.4 }, delay: 0.08, ease: 'power1.inOut',
},
```

Directional, so a small flick forward always moves on a beat (never snaps back). Turn it off
with a query flag for testing.

## 9. Inventing more

Other grammars that keep the product's look: a **horizontal track** (vertical scroll drives a
sideways film strip of screens); a **stack** (screens pile up like cards, each new one sliding
over the last); a **scan** (a line sweeps the product and everything it passes updates); a
**split** (text scrolls normally on the left while one pinned product panel morphs on the
right). The test: can you say the grammar in one sentence, and does every chapter boundary
carry something?
