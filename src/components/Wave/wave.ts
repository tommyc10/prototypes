/* The distortion wave (distortion-waves, libraries.dev/waves): one view carried into another,
 * bent by a wave that leaves the button that started it. Used in two places only: signing in
 * (useHandoff) and a decision on a rule landing in its card (WaveSwap).
 *
 * The caller lays the two views over each other in one grid cell. runWave makes a controller
 * for one run, and the caller's cleanup destroys it, so nothing pictures or watches the page
 * once the wave has gone.
 *
 * The colours come from the theme. Grey by default, the chart ramp's greys, because colour
 * here means a status; green only where the result is a status that green means (a rule now
 * active). Reduced motion, or no WebGL 2: the library crossfades instead. */

import { WaveController, type Palette, type PaletteLike, type RGB, type SourceLike, type WaveStyleInput } from 'distortion-waves';

/** Quieter than the library's own vertical wave: no chromatic aberration (it splits text into
 *  red, green and blue fringes), the band and rim dimmed so the light at the edges stays below
 *  the page's own white, and half the swell, because on pages this full of text a full swell
 *  reads as doubled words as it passes. */
const QUIET: WaveStyleInput = {
  aberration: 0,
  strength: 0.6,
  rimStrength: 0.55,
  amplitude: 17,
  swell: 11,
};

/** Across the window, once a shift: the front crosses in 1.3s, the edges clear by 2s. */
export const WINDOW_WAVE: WaveStyleInput = {
  ...QUIET,
  anticipation: 0.3,
  travel: 1.3,
  rimFade: 1.5,
  hairlineFade: 1.5,
  particleLife: 1.4,
  particleCount: 36,
};

/** Across a card: the front crosses in 0.9s, the edges clear by 1.4s. */
export const CARD_WAVE: WaveStyleInput = {
  ...QUIET,
  anticipation: 0.2,
  travel: 0.9,
  rimFade: 1.1,
  hairlineFade: 1.1,
  particleLife: 1,
  particleCount: 20,
};

export type WaveTone = 'grey' | 'green';

function token(el: Element, name: string) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

function rgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? [...h].map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Grey: the chart ramp's middle greys, its brightest only at the leading edge, so light on
 *  dark and dark on paper. Green: the status green, lighter ahead and deeper behind. */
export function palette(el: Element, tone: WaveTone = 'grey'): PaletteLike {
  if (tone === 'green') return token(el, '--green');
  const [t1, t2, t3] = ['--tone-1', '--tone-2', '--tone-3'].map((name) => rgb(token(el, name)));
  return { colors: [t2!, t3!, t2!, t3!, t2!, t3!, t2!], ahead: t1!, behind: t3! } satisfies Palette;
}

/** Waits this long for the pictures before the wave leaves anyway; the lens eases in late. */
const PICTURE_WAIT = 450;
/** If the wave never says it has finished, it counts as finished. */
const GIVE_UP = 4000;

/** Undoes what the controller wrote on a layer. */
function release(layer: HTMLElement) {
  layer.style.opacity = '';
  layer.style.pointerEvents = '';
  layer.removeAttribute('inert');
  layer.removeAttribute('aria-hidden');
}

/**
 * Runs one wave over `root` from the `from` layer to the `to` layer, then calls `done` (once,
 * also if the wave never reports back). Returns the cleanup: it stops the wave wherever it is,
 * lets the controller go and leaves both layers as they were. Call it once the caller has
 * swapped its views back, in the same commit, so neither view flashes.
 */
export function runWave(
  root: HTMLElement,
  from: HTMLElement,
  to: HTMLElement,
  { source, style, tone, done }: { source?: SourceLike; style: WaveStyleInput; tone?: WaveTone; done: () => void },
) {
  const wave = new WaveController(root, from, to);
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    done();
  };
  wave.update({ type: 'vertical', palette: palette(root, tone), waveStyle: style, prewarm: false, onFinish: finish });

  let left = false;
  const leave = () => {
    if (left || finished) return;
    left = true;
    wave.play({ source });
  };
  const wait = setTimeout(leave, PICTURE_WAIT);
  wave.prepare().then(leave, leave);
  const giveUp = setTimeout(finish, GIVE_UP);

  return () => {
    finished = true;
    clearTimeout(wait);
    clearTimeout(giveUp);
    wave.destroy();
    release(from);
    release(to);
  };
}
