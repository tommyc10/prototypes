---
name: scroll-story
description: Build a scroll-driven product story ("scrollytelling") site, a pinned, cinematic page where scrolling plays a film of a product's workflow, with camera moves that "scroll into" each step, choreographed with GSAP ScrollTrigger in React. Modelled on the Midnight story (one alert followed from noise to an approved rule), with a working starter, a transitions catalogue, an optional guide character, and verification scripts. Use this whenever someone wants a scroll-animated product demo, launch or marketing page, an Apple-style scroll page, a "walk through our flow as you scroll" site, a feature story, an interactive product film, or asks to turn a product, dashboard or workflow into a scroll experience, even if they don't say "GSAP" or "scrollytelling".
---

# Scroll story

Build a page where **the scroll bar is the play button**: the screen pins, and scrolling plays
(and rewinds) a film of the product doing its job. Each chapter hands the viewer to the next
by physically carrying something across: a ticket shrinks into one square of a chart, a query
flies into the rule page, the page folds down into a gate.

The reference build is **Midnight: the story** (`midnight-story/` in the tommyc10/prototypes
repo). It follows one alert through a rule-governance dashboard in 10 scenes and ~64 s of
timeline. Everything here was learned building it; see `references/midnight-case-study.md`.

## What good looks like

A viewer should feel they're *inside* the product, not watching slides. Concretely:

- **One protagonist.** Follow a single concrete thing (one alert, one order, one invoice) the
  whole way. Abstract flows become consequences of the step before.
- **Every transition carries something.** Nothing just cross-fades. The object from this scene
  becomes (or flies into, or collapses into) the next one.
- **It looks like the real product.** Reuse the product's tokens, components and mock data, so
  the story sells the actual UI.
- **Scrolling back is exact.** Every counter counts down, every fly-to flies back, every typed
  line un-types. That comes free from the architecture below, as long as you keep its rules.
- **Captions explain, motion shows.** One short caption per chapter on the left; the product
  acts it out on the right.
- **It degrades gracefully.** Reduced motion or small screens get a calm storyboard.

## Workflow

Work through these in order. Steps 1–2 decide whether the result is memorable; steps 3–7 are
mostly craft on a proven base.

### 1. Understand the product and mine the repo

Find out what the product does and which flow to tell. If the product's code is in the repo,
read it first: its theme/tokens file, its key components (cards, badges, buttons, tables), its
mock data and its domain language. The story should reuse these, not reinvent them. If it's
unclear who the story is for or which flow matters, ask one short question. Otherwise pick the
flow that best shows the product's value and say so.

### 2. Storyboard before you build

Read `references/storyboarding.md`. Produce a chapter table: for each chapter, the caption
title, what the viewer sees, what the scroll does, and **what carries into the next chapter**.
Typically 5–9 chapters plus an opening and an ending that bookend each other. Show the table to
the user before building when they're around; it's the cheapest point to change direction.

### 3. Scaffold from the starter

Copy `assets/starter/` to the target folder (skip `node_modules`/`dist`), then `npm install`
and `npm run dev` (port 5199). It's a working mini story with the whole engine already in it:

| File | What it gives you |
| --- | --- |
| `src/lib/gsap.ts` | GSAP and plugins registered once; three easing curves |
| `src/lib/geometry.ts` | The 1440 × 900 stage, `focus()` (camera) and `morph()` (fly-to) |
| `src/story/timeline/kit.ts` | Captions, `enter`/`leave`, `swap`, `count`, `type`, `press`, `pointer` |
| `src/story/Film.tsx` | Pin + scrub, stage scaling, progress rail, first-load intro, the ready gate, `window.__film` in dev |
| `src/story/Storyboard.tsx` | The static fallback |
| `src/story/timeline/chapters.ts` | An example: camera dive → ticket → collapse into a unit chart → quiet ending |

Replace the example's tokens (`styles/tokens.css`) with the product's, its copy
(`story/data.ts`), its scenes and its chapters. If the project already has a stack, port the
engine files into it instead; they depend only on React, GSAP and `@gsap/react`.

### 4. Build scenes in their END state

Read `references/architecture.md` before writing scenes. Each scene is a full-stage component
(`.scene`, absolutely positioned on the 1440 × 900 stage), laid out in plain pixels, and drawn
**as it looks when its chapter is finished**: the badge already says "Approved", the counter
already reads 214, the reason is already typed. Keep captions clear of the canvas: they live at
x 96–476, so scene content goes roughly in x 520–1400.

### 5. Choreograph the chapters

One chapter = one function in `timeline/` that sets its starting state with `gsap.set`, then
places `s.tl.to(...)` tweens at `t + seconds`, and finishes by moving `s.t` on and calling
`mark()`. Reach for the recipes in `references/transitions.md` (camera dive, collapse into a
unit, lift-and-fly with scramble, FLIP into place, fold into a chip, conveyor through a gate,
pointer clicks, hold-to-confirm, the bookend) and check `references/gsap.md` for the API and
its traps. Motion values come from `references/motion.md`.

### 6. Optional: a guide character

A small mascot who hops between perches, reacts in speech bubbles and changes mood with the
story makes it memorable. Midnight's is Pip, a dragon from the bot-avatars library.
`references/guide-character.md` has the full recipe. Offer it; don't force it.

### 7. Fallback, verify, hand off

- Fill in `Storyboard.tsx` stills for each chapter (crop boxes on the stage).
- Verify with the scripts (`references/verification.md`): screenshots at settled and
  mid-transition times, a rewind pass, the reload check, the phone/reduced-motion pass,
  `npm run build`. Look at the screenshots; don't just check that they exist.
- Write a README (chapters table, file map, how to change copy and pacing). For a team, offer
  an explainer page like Midnight's `docs/how-it-works.html`.

## The rules that keep it working

These are the things that broke, or nearly broke, in the reference build. The reasons matter
more than the rules, so each has its why.

1. **Fixed stage, pixel layout.** Everything sits on a 1440 × 900 canvas scaled to fit the
   window. Fly-tos and camera moves need targets that never move; on a fixed stage, positions
   are measured once and stay right at any window size.
2. **End state in markup, start state in the timeline; only tween forward.** GSAP records a
   `.to()` tween's start values the first time the playhead reaches it. That's what makes
   rewinding exact, and it's why the static fallback gets finished stills for free.
3. **One master timeline, created paused, scrubbed by one ScrollTrigger.** Don't put
   ScrollTriggers on individual tweens. Chapters append to the one timeline in order.
4. **Build after fonts load; hide the stage until built.** Measuring before fonts land puts
   every fly-to off by a few pixels. And because scenes are drawn finished, showing the stage
   before the start states are set flashes every scene at once (the hero and outro headlines
   on top of each other). `Film.tsx` gates the stage on `data-ready`.
5. **Beware `fromTo` and `from` late in the film.** They apply their start values *immediately*
   at build time unless you pass `immediateRender: false`. Prefer `gsap.set` + `tl.to`.
6. **Don't mutate React-owned DOM.** If a number needs its own span to count, render that span
   in JSX. GSAP may change styles and text, not structure.
7. **`transform` and `opacity` for motion.** Blur only to hide a crossfade seam, and keep it
   ≤ 8px. `will-change: transform` only on layers the camera zooms and then leaves.
8. **Scenes stay hidden when off-stage** (`autoAlpha: 0`, which sets `visibility: hidden`), so
   the browser doesn't paint them and nothing hidden can be tabbed to.

## References

Read what the current step needs; you don't need all of them up front.

| File | Read it when |
| --- | --- |
| `references/storyboarding.md` | Planning chapters, captions, pacing (step 2) |
| `references/architecture.md` | Before writing scenes or touching `Film.tsx` (steps 3–4) |
| `references/transitions.md` | Choreographing chapters: the recipe catalogue with code (step 5) |
| `references/gsap.md` | Any GSAP API question: ScrollTrigger, timelines, plugins, traps |
| `references/motion.md` | Choosing eases and durations; performance; accessibility; the polish checklist |
| `references/guide-character.md` | Adding a mascot guide (step 6) |
| `references/verification.md` | Checking the build (step 7) |
| `references/midnight-case-study.md` | Seeing how a full story was put together, beat by beat |

If the official GSAP skills (`gsap-core`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-react`,
`gsap-plugins`) or Emil Kowalski's `animate` / `emil-design-eng` skills are installed, they go
deeper on their topics; this skill is self-contained without them.
