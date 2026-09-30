# scroll-story for Claude Code and Codex

Builds scroll-driven product stories: a pinned, cinematic page where scrolling plays (and
rewinds) a film of a product's workflow, with camera moves that "scroll into" each step. It's
based on two primary versions: **Fly** (`story-directions/`, the default 3D film) and
**Midnight** (`midnight-story/`, the original detailed walkthrough).

## Use it

In Claude Code:

```text
/scroll-story use Fly for our onboarding flow, following one user from sign-up to first invoice
/scroll-story use Midnight for a detailed walkthrough of our approval flow
```

In Codex:

```text
$scroll-story use Fly for our onboarding flow
$scroll-story use Midnight for our approval flow
```

Both agents can also select the skill for a relevant product-story request. The skill routes
from the chosen version to its working source, then covers storyboarding, adaptation and
verification. Zoom remains an optional alternative when specifically wanted.

## Install

- **In this repo**: Claude Code reads `.claude/skills/scroll-story/`; Codex reads the
  `.agents/skills/scroll-story` symlink to that same folder.
- **Everywhere, for you**: copy the skill to `~/.claude/skills/scroll-story`, then link
  `~/.codex/skills/scroll-story` to `../../.claude/skills/scroll-story`. Keep one personal copy
  so updates reach both agents. Preserve any existing customizations when installing.
- **For another project's team**: copy the folder into `.claude/skills/scroll-story` and add
  `.agents/skills/scroll-story` as a relative symlink to `../../.claude/skills/scroll-story`.

The full reference applications are local project directories, not bundled in the installed
skill folder. `references/builds.md` explains source discovery and how to proceed with the
bundled starter when the full applications are unavailable.

## What's inside

```
scroll-story/
├── SKILL.md                     the workflow and rules (both agents read this first)
├── references/
│   ├── builds.md                Fly / Midnight source selection and scaffolding
│   ├── directions.md            motion details, including optional Zoom / Snap
│   ├── storyboarding.md         protagonist, arc, carry-overs, captions, pacing
│   ├── architecture.md          stage, pin + scrub, end-state scenes, one timeline, load gate
│   ├── transitions.md           ~25 recipes with code: portal zoom, iris, slats, dive, FLIP, fold…
│   ├── gsap.md                  the GSAP you need + the traps we hit
│   ├── motion.md                curves, durations, performance, accessibility, polish checklist
│   ├── guide-character.md       Pip: a mascot that walks viewers through (bot-avatars)
│   ├── verification.md          how to check it: settled, mid-transition, rewind, load, fallback
│   └── midnight-case-study.md   the reference build, beat by beat, and what went wrong
├── assets/starter/              a working mini story (Vite + React + TS + GSAP) to copy
└── scripts/
    ├── shoot.mjs                seek-and-screenshot at timeline times (Playwright)
    └── check-load.mjs           reload check: no flash of every scene at once
```

Try the starter on its own: `cp -R assets/starter /tmp/story && cd /tmp/story && npm install && npm run dev`
Open the URL printed by the dev server. In an existing project, use its configured dev command and port.
