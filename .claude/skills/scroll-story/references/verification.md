# Verifying a scroll story

Scroll films break in three places: **mid-transition**, **on the way back up**, and **on
load**. Check all three, plus the fallback and the build. The scripts are in `scripts/`; they
need Playwright:

```bash
mkdir -p /tmp/story-check && cd /tmp/story-check && npm init -y >/dev/null && npm i playwright
npx playwright install chromium      # first time only
cp <skill>/scripts/*.mjs .
```

They rely on `window.__film` (set by `Film.tsx` in dev). Start or reuse the target project's
dev server using its existing scripts and configuration. Set `STORY_URL` to the actual URL
printed by that server, including any app path or direction query. Both scripts accept
`--url` or the `STORY_URL` environment variable; neither assumes a port.

## 1. Settled frames: does each chapter land?

```bash
node shoot.mjs --url "$STORY_URL" --out ./shots
```
Shoots the start, each chapter just before it ends (settled), and the end. **Look at every
image.** Check: captions don't overlap scene content; nothing is clipped by the stage edge or
the top bar; counters show final values; the badge has flipped.

## 2. Mid-transition frames: do the moves look intentional?

```bash
node shoot.mjs --url "$STORY_URL" --times 2.2,7.9,12.7,20.9 --out ./shots      # pick times inside transitions
node shoot.mjs --url "$STORY_URL" --every 0.5 --out ./frames                    # or a flipbook of the whole film
```
Check the camera dive at its midpoint, each fly-to halfway, the fold, the pour. Common finds:
a translucent chip showing doubled text, a card scaling from the wrong origin, a layer that
should have been hidden still painting behind.

## 3. Rewind: does scrolling back restore everything?

```bash
node shoot.mjs --url "$STORY_URL" --rewind --times 34,14.5,5,0.2 --out ./shots
```
Jumps to the end first, then back. Compare with the forward shots at the same times: counters
back at their mid values, pills back in the lane, typed text shorter, scrambled values specific
again, the opening state restored (for example the wall back to "live").

## 4. Load: no flash on reload

```bash
node check-load.mjs --url "$STORY_URL" --reloads 5
```
Reloads with fonts slowed and fails if the stage is ever visible before the film marks itself
`data-ready`. Scenes are drawn finished, so an early stage shows every scene at once.

## 5. Fallbacks

```bash
node shoot.mjs --url "$STORY_URL" --mobile --out ./shots     # 390px: expect the storyboard, full page
node shoot.mjs --url "$STORY_URL" --reduced --out ./shots    # reduced motion at desktop size: also the storyboard
```
Check each still is cropped to its scene and readable, and each caption sits above its still.

## 6. Build and console

```bash
npm run build            # tsc + vite: must pass
```
Every script prints console errors and warnings, and exits non-zero if there are any.

## What the scripts can't tell you

Feel. Pacing, whether a pause is long enough to read a caption, whether a transition is too
fast on a trackpad. Scroll it yourself with a trackpad *and* a mouse wheel, ideally the next day.
Say so when handing over, rather than claiming it "feels right".
