# /scroll-story, a Claude Code skill

Builds scroll-driven product stories: a pinned, cinematic page where scrolling plays (and
rewinds) a film of a product's workflow, with camera moves that "scroll into" each step. It's
modelled on **Midnight: the story** (`midnight-story/` in this repo).

## Use it

In Claude Code (terminal or the VS Code extension), in any project:

```
/scroll-story build a scroll story for our onboarding flow, following one new user from sign-up to first invoice
```

Claude also reaches for it by itself when you ask for a scroll-animated product page or demo.
It'll storyboard the chapters with you, scaffold from a working starter, build the scenes and
choreography, add a guide character if you want one, then verify it with screenshots.
Opus gives the best results for this kind of long, visual build.

## Install

- **In this repo**: nothing to do. It's in `.claude/skills/scroll-story/`, so Claude Code picks
  it up when you open the repo.
- **Everywhere, for you**: copy the folder into your personal skills:
  ```bash
  cp -R .claude/skills/scroll-story ~/.claude/skills/
  ```
- **For another project's team**: copy it into that project's `.claude/skills/` and commit it.

## What's inside

```
scroll-story/
├── SKILL.md                     the workflow and the rules (what Claude reads first)
├── references/
│   ├── storyboarding.md         protagonist, arc, carry-overs, captions, pacing
│   ├── architecture.md          stage, pin + scrub, end-state scenes, one timeline, load gate
│   ├── transitions.md           ~20 recipes with code: camera dive, collapse, FLIP, fold, conveyor…
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
(http://localhost:5199).
