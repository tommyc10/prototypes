#!/usr/bin/env node
/* Seek-and-screenshot for a scroll story. Opens the page, jumps the scroll to exact timeline
 * times (via the dev-only window.__film hook that Film.tsx sets), waits for the scrub to
 * settle, and saves a screenshot of each. Also collects console errors.
 *
 * Needs Playwright:  npm i -D playwright   (Chromium downloads on first run: npx playwright install chromium)
 *
 *   node shoot.mjs --url "$STORY_URL" --out ./shots                 # start, each chapter settled, end
 *   node shoot.mjs --url "$STORY_URL" --times 0.5,2.2,6 --out ./shots                             # exact times
 *   node shoot.mjs --url "$STORY_URL" --every 1 --out ./shots                                     # a frame every second of film
 *   node shoot.mjs --url "$STORY_URL" --rewind --times 5,1 --out ./shots                          # jump to the end first, then back
 *   node shoot.mjs --url "$STORY_URL" --mobile --out ./shots                                      # 390px storyboard, full page
 *   node shoot.mjs --url "$STORY_URL" --reduced --out ./shots                                     # reduced motion, full page
 */

import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const url = opt('url', process.env.STORY_URL);
if (!url || url.startsWith('--')) {
  console.error('Pass --url <running-project-url> or set STORY_URL to the URL printed by the project dev server.');
  process.exit(1);
}
const out = opt('out', './shots');
const settle = Number(opt('settle', 1700)); // ms: scrub: 1 needs ~1s to catch up
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const errors = [];
const watch = (page, tag) => {
  page.on('pageerror', (e) => errors.push(`${tag} pageerror: ${e.message}`));
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errors.push(`${tag} ${m.type()}: ${m.text()}`));
};

if (flag('mobile') || flag('reduced')) {
  const page = await browser.newPage(
    flag('mobile') ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' },
  );
  watch(page, flag('mobile') ? 'mobile' : 'reduced');
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const isFilm = await page.evaluate(() => !!document.querySelector('.film'));
  const file = `${out}/${flag('mobile') ? 'mobile' : 'reduced'}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(`${file}  (film rendered: ${isFilm}; expected false)`);
} else {
  const page = await browser.newPage({ viewport: { width: Number(opt('width', 1440)), height: Number(opt('height', 900)) } });
  watch(page, 'film');
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__film, null, { timeout: 15000 });
  const film = await page.evaluate(() => ({
    duration: window.__film.tl.duration(),
    start: window.__film.st.start,
    end: window.__film.st.end,
    marks: window.__film.marks,
  }));
  console.log(`film: ${film.duration.toFixed(2)}s of timeline, ${Math.round(film.end - film.start)}px of scroll`);
  console.log('chapters:', film.marks.map((m) => `${m.id} ${m.start.toFixed(1)}–${m.end.toFixed(1)}`).join(' · '));

  let times;
  if (opt('times')) times = opt('times').split(',').map(Number);
  else if (opt('every')) {
    const step = Number(opt('every'));
    times = Array.from({ length: Math.floor(film.duration / step) + 1 }, (_, i) => +(i * step).toFixed(2));
  } else times = [0, ...film.marks.map((m) => +(m.end - 0.25).toFixed(2)), film.duration]; // each chapter, settled

  await page.waitForTimeout(2500); // let the first-load intro finish
  const seek = async (t) => {
    const y = film.start + (film.end - film.start) * (t / film.duration);
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(settle);
  };
  if (flag('rewind')) await seek(film.duration);
  for (const t of times) {
    await seek(t);
    const file = `${out}/${flag('rewind') ? 'rewind' : 't'}-${t.toFixed(2).padStart(6, '0')}s.png`;
    await page.screenshot({ path: file });
    console.log(file);
  }
}

console.log(errors.length ? `\n${errors.length} console problem(s):\n${errors.join('\n')}` : '\nno console errors');
await browser.close();
process.exit(errors.length ? 1 : 0);
