# Choose and reuse Fly or Midnight

Both agents use the sources bundled with this skill. All `assets/` paths below are relative
to the directory containing `SKILL.md`, regardless of the current working directory.
No separate checkout or reference repository is required. Copy *from* the skill directory
*into* the target repo (see "Two repos" in `SKILL.md`); never install, build or run inside
the skill directory.

| Version | Source | Preview | Choose it for |
| --- | --- | --- | --- |
| **Fly** | `assets/fly/` | Project dev-server URL; no query or `?d=fly` | 3D travel, scale, orbiting a wall of alerts, a gate seen from above |
| **Midnight** | `assets/midnight/` | Project dev-server URL | Detailed product workflow, approval, guardrails, audit, optional Pip |

## Use the bundled source

Copy `assets/fly/` or `assets/midnight/` from this skill into the story folder in the target repo. Both
include source code, package manifests, lockfiles, and build configuration. Midnight also
includes Pip's avatar implementation and MIT license. `assets/starter/` is a smaller optional
Midnight-style foundation, not a substitute for the full builds.

Exclude `node_modules`, `dist`, `.git`, logs and `*.tsbuildinfo` when copying. Run `npm install`, dev and build commands from the target. In an existing
project, integrate the source and dependencies while preserving its package scripts, stack
and server configuration. For a new standalone copy, run `npm install` and `npm run build`.
Use the dev-server URL printed at startup; the bundled configurations do not force a port.
Set `DASHBOARD_URL` to the target product's destination; `/dashboard` is a placeholder.

## Fly

Start from `assets/fly/`. Read these files before adapting it:

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

Start from `assets/midnight/` for the full original, including approval, guardrails and audit.
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
