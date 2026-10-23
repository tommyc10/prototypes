# 002 — Let the root-cause chip appear without animating

- **Status**: DONE
- **Commit**: de3a3c2 (plus uncommitted working tree: `src/pages/outlook/` is not yet committed; the excerpts below are the code as of 23 Oct 2026)
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 1 file, delete ~12 lines

## Problem

On the Hindcast view, picking a root cause shows a chip in the top bar ("Bad deploy ×"). The chip pops in with a scale-and-fade every time it appears. The most common way to pick a cause is **J / K**, a keyboard action repeated tens of times a day, and keyboard actions must never animate (DESIGN.md: "Keyboard-opened things appear instantly"; AUDIT: "Animation on a keyboard shortcut → No animation").

```css
/* src/pages/outlook/components/TopBar/TopBar.css:141-145 — current */
  transition:
    background-color 150ms ease,
    transform 160ms var(--ease-out);
  animation: ol-chip-in 180ms var(--ease-out);
}
```

```css
/* src/pages/outlook/components/TopBar/TopBar.css:166-171 — current */
@keyframes ol-chip-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

```css
/* src/pages/outlook/components/TopBar/TopBar.css:195-199 — current */
@media (prefers-reduced-motion: reduce) {
  .ol-cause-chip {
    animation: none;
  }
}
```

## Target

The chip appears and disappears instantly. Its press feedback (`:active { transform: scale(0.97) }` with `transform 160ms var(--ease-out)`) and its hover colour stay exactly as they are.

## Repo conventions to follow

- Pressable things keep `transform: scale(0.97)` on `:active` (DESIGN.md "Press"). That rule is at `TopBar.css:151-153` and stays.
- The other top-bar controls (`.ol-view`, `.ol-service`) have no arrival animation: imitate them.

## Steps

1. `src/pages/outlook/components/TopBar/TopBar.css`: delete the line `  animation: ol-chip-in 180ms var(--ease-out);` from the `.ol-cause-chip` rule. The `transition:` declaration above it stays.
2. Same file: delete the whole `@keyframes ol-chip-in { … }` block.
3. Same file: delete the whole `@media (prefers-reduced-motion: reduce) { .ol-cause-chip { animation: none; } }` block at the end of the file. It has nothing left to turn off.

## Boundaries

- Do NOT touch the chip's `transition`, `:active`, `:hover` or `:focus-visible` rules.
- Do NOT touch `TopBar.tsx` or any other file.
- If a step doesn't match the code you find (drift), STOP and report instead of improvising.

## Verification

- **Mechanical**: `grep -n "ol-chip-in" src/pages/outlook -r` prints nothing. `./node_modules/.bin/vite build --outDir /tmp/outlook-check --emptyOutDir` ends with `✓ built`.
- **Feel check** (`#/outlook`):
  - Press **J**: the chip is there on the very next frame, with no fade or scale. In DevTools → Animations, nothing is recorded.
  - Click a cause in the Root causes panel: the chip appears instantly too.
  - Press and hold on the chip: it still shrinks slightly (scale 0.97). Releasing clears the cause.
- **Done when**: the chip never animates on appearance, and its press and hover feedback are unchanged.
