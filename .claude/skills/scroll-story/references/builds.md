# Choose and reuse Fly or Midnight

Both agents use these same sources and instructions. Source paths below refer to local
project directories when available, not to the skill directory.

| Version | Source | Preview | Choose it for |
| --- | --- | --- | --- |
| **Fly** | `story-directions/` | `npm run dev`, port 5191; no query or `?d=fly` | 3D travel, scale, orbiting a wall of alerts, a gate seen from above |
| **Midnight** | `midnight-story/` | `npm run dev`, port 5189 | Detailed product workflow, approval, guardrails, audit, optional Pip |

## Find the source

First look for these directories in the current workspace or a user-provided reference
location. If the full source is absent, use the bundled starter with the chosen direction's
recipes in `directions.md` and `transitions.md`. For Fly, build the 3D world and orbit camera
explicitly; the starter alone is a minimal Midnight-style story. If an exact reproduction
is requested, ask for the source location instead of assuming a remote repository.

Copy the selected app into the requested target, excluding `node_modules`, `dist`, `.git`,
logs and `*.tsbuildinfo`. Run `npm install` and `npm run build` in the copy.

## Fly

Start from `story-directions/`. Read these files before adapting it:

- `src/directions/fly/space.ts`: world coordinates, perspective, wall and floor geometry.
- `src/directions/fly/FlyStage.tsx` and `fly.css`: objects and the `preserve-3d` chain.
- `src/directions/fly/timeline.ts`: one tweened orbit camera and all five chapter handoffs.
- `src/shared/Film.tsx`: font/ready gate, stage scaling, pin/scrub and dev seek hook.
- `src/shared/story.ts`, `Frames.tsx`, `MidnightBar.tsx`: copy and chrome.
- `src/shared/Board.tsx`: small-screen and reduced-motion text fallback.
- `src/styles/`: product tokens and shared components.

Fly is the default in `App.tsx`; Zoom and Snap are retained as comparison options in the
reference app. For a single-direction deliverable, render Fly directly and omit the Picker
and unused direction imports. Keep the picker when comparison is part of the request.
Adapt the product's visual language, story, world objects and camera targets together.
Do not put opacity, filters or clipping on ancestors that must preserve 3D; fade leaf panels.

## Midnight

Start from `midnight-story/` for the full original, including approval, guardrails and audit.
Read `midnight-case-study.md` for its chapter timings and file map. Change `src/story/data.ts`,
the scenes, styles and `src/story/timeline/` for the new product. Pip is optional.

Use the bundled `assets/starter/` only when a smaller Midnight-style foundation is desired.
Its three example beats are not the full Midnight narrative. Call this direction Midnight;
older notes may call it Console.

## Verify the selected result

Follow `verification.md` against the selected app's URL. Check a settled chapter, a camera
move midway through, rewind, reload, mobile and reduced motion, then run the production build.
Verify that the default URL renders the requested direction. Replace reference dashboard
links with the target product's destination before shipping a new story.
