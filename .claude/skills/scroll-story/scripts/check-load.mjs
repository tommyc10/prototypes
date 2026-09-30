#!/usr/bin/env node
/* Reload check. Scenes are drawn in their END state and the timeline sets their start state
 * once built, so a story that shows its stage too early flashes every scene at once on load.
 * This reloads the page several times with fonts slowed down (which widens the window where
 * it can go wrong), samples the screen every 40ms, and fails if the stage is ever visible
 * before the film has marked itself ready (data-ready on .film).
 *
 *   node check-load.mjs --url http://localhost:5199 [--reloads 5]
 */

import { chromium } from 'playwright';

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(`--${n}`) ? args[args.indexOf(`--${n}`) + 1] : d);
const url = opt('url', 'http://localhost:5199');
const reloads = Number(opt('reloads', 5));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.route('**/*.woff2', async (r) => {
  await new Promise((s) => setTimeout(s, 600));
  r.continue();
});

let frames = 0;
let early = 0;
for (let i = 0; i < reloads; i++) {
  await page.goto(url, { waitUntil: 'commit' });
  for (let f = 0; f < 50; f++) {
    const bad = await page
      .evaluate(() => {
        const film = document.querySelector('.film');
        const stage = document.querySelector('.stage');
        if (!film || !stage) return false;
        return !film.hasAttribute('data-ready') && getComputedStyle(stage).visibility !== 'hidden';
      })
      .catch(() => false);
    frames++;
    if (bad) early++;
    await page.waitForTimeout(40);
  }
}
const ready = await page.evaluate(() => document.querySelector('.film')?.hasAttribute('data-ready'));
console.log(`${frames} frames over ${reloads} reloads · stage visible before ready: ${early} · ready at the end: ${ready}`);
await browser.close();
process.exit(early || !ready ? 1 : 0);
