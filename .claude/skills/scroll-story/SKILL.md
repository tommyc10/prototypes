---
name: scroll-story
description: Build scroll-driven product stories in React with GSAP ScrollTrigger. Choose Fly (a 3D camera through floating product UI) or Midnight (the original screen-based walkthrough), with working reference builds, a starter, transition recipes, and verification scripts. Use for cinematic product demos, launch pages, scroll-animated workflows, and scrollytelling; works with Claude Code and Codex.
---

# Scroll story

Build a page where **the scroll bar is the play button**: the screen pins, and scrolling plays
(and rewinds) a film of the product doing its job. Each chapter hands the viewer to the next
by physically carrying something across: a ticket shrinks into one square of a chart, a query
flies into the rule page, the page folds down into a gate.

The two primary reference builds are **Fly** (`story-directions/`, default direction) and
**Midnight** (`midnight-story/`). These are local source directories when available.
Use the same skill in Claude Code or Codex. Read `references/builds.md` to locate the source
and scaffold the chosen version; `references/midnight-case-study.md` documents the original.

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

Work through these in order. Steps 1–3 decide whether the result is memorable; steps 4–8 are
mostly craft on a proven base.

### 1. Understand the product and mine the repo

Find out what the product does and which flow to tell. If the product's code is in the repo,
read it first: its theme/tokens file, its key components (cards, badges, buttons, tables), its
mock data and its domain language. The story should reuse these, not reinvent them. If it's
unclear who the story is for or which flow matters, ask one short question. Otherwise pick the
flow that best shows the product's value and say so.

### 2. Pick a direction

Choose between the two primary versions, preserving the product's own colours, type and components:

- **Fly**: a 3D camera dollies, orbits and cranes through floating UI. Use for cinematic stories
  about scale and systems. This is the selected default for the current Midnight prototype.
- **Midnight**: the original screen-based product walkthrough, with a camera dive, fly-tos,
  approval, guardrails, audit and optional Pip. Use for a detailed demonstration of a workflow.

Honour an explicit choice. Otherwise infer the fit from the brief and state your choice; ask
only if the distinction materially affects an unclear request. Call the original **Midnight**,
not Console. Zoom remains a liked alternative for repeated dives into individual records;
Snap is an optional experiment. Do not combine directions unless requested.
Read `references/builds.md` for the chosen source and `references/directions.md` for motion details.

### 3. Storyboard before you build

Read `references/storyboarding.md`. Produce a chapter table: for each chapter, the caption
title, what the viewer sees, what the scroll does, and **what carries into the next chapter**.
Typically 5–9 chapters plus an opening and an ending that bookend each other. Show the table to
the user before building when they're around; it's the cheapest point to change direction.

### 4. Scaffold from the chosen build

For **Fly**, start from `story-directions/` as described in `references/builds.md`; its 3D
world and orbit camera are not in the generic starter. For the full **Midnight** version,
start from `midnight-story/`. Keep the chosen engine, then adapt the product and chapters.

For a minimal **Midnight-style** story instead of the full reference, copy `assets/starter/` to the target folder (skip `node_modules`/`dist`), then `npm install`
and `npm run dev` (port 5199). It's a working mini story with the whole engine already in it:

| File | What it gives you |
| --- | --- |
| `src/lib/gsap.ts` | GSAP and plugins registered once; three easing curves |
| `src/lib/geometry.ts` | The 1440 × 900 stage, `focus()` (camera) and `morph()` (fly-to) |
| `src/lib/camera.ts` | `portal()`: the zoom *into* a scene drawn as a miniature inside the current one |
| `src/story/timeline/kit.ts` | Captions, `enter`/`leave`, `swap`, `count`, `type`, `press`, `pointer` |
| `src/story/Film.tsx` | Pin + scrub, stage scaling, progress rail, first-load intro, the ready gate, `window.__film` in dev |
| `src/story/Storyboard.tsx` | The static fallback |
| `src/story/timeline/chapters.ts` | An example: camera dive → ticket → collapse into a unit chart → quiet ending |

Replace the example's tokens (`styles/tokens.css`) with the product's, its copy
(`story/data.ts`), its scenes and its chapters. If the project already has a stack, port the
engine files into it instead; they depend only on React, GSAP and `@gsap/react`.

### 5. Build scenes in their END state

Read `references/architecture.md` before writing scenes. In Midnight, each scene is a full-stage component
(`.scene`, absolutely positioned on the 1440 × 900 stage), laid out in plain pixels, and drawn
**as it looks when its chapter is finished**: the badge already says "Approved", the counter
already reads 214, the reason is already typed. Keep captions clear of the canvas: they live at
x 96–476, so scene content goes roughly in x 520–1400. For Fly, keep the shared
fixed screen stage but place world objects in 3D using `space.ts`; preserve the transform
chain described in `references/directions.md` §5 instead of flattening them into 2D scenes.

### 6. Choreograph the chapters

One chapter = one function in `timeline/` that sets its starting state with `gsap.set`, then
places `s.tl.to(...)` tweens at `t + seconds`, and finishes by moving `s.t` on and calling
`mark()`. Reach for the recipes in `references/transitions.md` (portal zoom, camera dive,
collapse into a unit, lift-and-fly with scramble, FLIP into place, fold into a chip, slats,
iris, conveyor through a gate, pointer clicks, hold-to-confirm, the bookend) and check `references/gsap.md` for the API and
its traps. Motion values come from `references/motion.md`.

### 7. Optional: a guide character

A small mascot who hops between perches, reacts in speech bubbles and changes mood with the
story makes it memorable. Midnight's is Pip, a dragon from the bot-avatars library.
`references/guide-character.md` has the full recipe. Offer it; don't force it.

### 8. Fallback, verify, hand off

- Keep the chosen fallback complete: Midnight uses `Storyboard.tsx` stills; Fly uses the
  readable chapter text in `shared/Board.tsx`.
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
   the browser doesn't paint them and nothing hidden can be tabbed to. In Fly, use visibility
   on 3D ancestors and opacity only on leaf panels so hiding never flattens the world.

## References

Read what the current step needs; you don't need all of them up front.

| File | Read it when |
| --- | --- |
| `references/builds.md` | Choosing and scaffolding Fly or Midnight in either agent (steps 2–4) |
| `references/directions.md` | Fly / Midnight motion, plus optional Zoom and Snap recipes (step 2) |
| `references/storyboarding.md` | Planning chapters, captions, pacing (step 3) |
| `references/architecture.md` | Before writing scenes or touching `Film.tsx` (steps 4–5) |
| `references/transitions.md` | Choreographing chapters: the recipe catalogue with code (step 6) |
| `references/gsap.md` | Any GSAP API question: ScrollTrigger, timelines, plugins, traps |
| `references/motion.md` | Choosing eases and durations; performance; accessibility; the polish checklist |
| `references/guide-character.md` | Adding a mascot guide (step 7) |
| `references/verification.md` | Checking the build (step 8) |
| `references/midnight-case-study.md` | Seeing how a full story was put together, beat by beat |

If the official GSAP skills (`gsap-core`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-react`,
`gsap-plugins`) or Emil Kowalski's `animate` / `emil-design-eng` skills are installed, they go
deeper on their topics; this skill is self-contained without them.
