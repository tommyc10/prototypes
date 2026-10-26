/* The Halloween scene: a graveyard under a full moon, after Tesla's parked Halloween view, and
 * all of it moving. A witch crosses the moon, bats circle it, lightning cracks, stars twinkle,
 * leaves fall, the owl blinks, a zombie hand claws out of the ground, ghosts rise from the
 * graves, wisps drift, fog rolls and the pumpkins bounce and laugh.
 *
 * "sky" is the whole night (the sign-in page). "ground" is the graveyard alone, a band along
 * the foot of a page (Home, an empty pane). Hidden from screen readers, never catches a click;
 * with reduced motion it holds still. */

import { useId } from 'react';
import { BatShape, GhostArt, Pumpkin, PumpkinDefs, WitchShape } from './Creatures';
import './NightScene.css';

type Variant = 'sky' | 'ground';

// Fixed, so the night looks the same on every load.
const STARS = [
  [72, 60],
  [190, 140],
  [260, 40],
  [380, 96],
  [470, 30],
  [560, 130],
  [640, 70],
  [720, 24],
  [780, 150],
  [860, 60],
  [930, 210],
  [1180, 60],
  [1260, 150],
  [1330, 40],
  [1400, 120],
  [140, 250],
  [330, 220],
  [610, 240],
  [820, 300],
  [1300, 300],
  [40, 330],
  [500, 330],
  [1420, 250],
  [1220, 360],
  [700, 360],
];
const LEAVES = [
  { x: 160, d: 11, delay: 0 },
  { x: 420, d: 14, delay: -5 },
  { x: 690, d: 12, delay: -9 },
  { x: 900, d: 15, delay: -2 },
  { x: 1120, d: 10, delay: -7 },
  { x: 1340, d: 13, delay: -11 },
  { x: 260, d: 16, delay: -13 },
];
const WISPS = [
  { x: 470, y: 740, d: 7, delay: 0 },
  { x: 610, y: 720, d: 9, delay: -3 },
  { x: 1010, y: 735, d: 8, delay: -5 },
  { x: 820, y: 760, d: 10, delay: -1 },
];

export function NightScene({ variant }: { variant: Variant }) {
  const id = useId().replace(/:/g, '');
  const ref = (name: string) => `url(#${id}-${name})`;
  const sky = variant === 'sky';

  return (
    <svg className="hw-scene" data-variant={variant} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="hw-stop-sky-top" />
          <stop offset="0.82" className="hw-stop-sky-low" />
        </linearGradient>
        <linearGradient id={`${id}-horizon`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.45" className="hw-stop-sky-low" stopOpacity="0" />
          <stop offset="0.8" className="hw-stop-sky-low" />
        </linearGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" className="hw-stop-halo" />
          <stop offset="1" className="hw-stop-halo" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-moon`} cx="0.4" cy="0.38" r="0.7">
          <stop offset="0.5" className="hw-stop-moon" />
          <stop offset="1" className="hw-stop-moon-shade" />
        </radialGradient>
        <radialGradient id={`${id}-wisp`}>
          <stop offset="0" className="hw-stop-wisp" />
          <stop offset="1" className="hw-stop-wisp" stopOpacity="0" />
        </radialGradient>
        <PumpkinDefs id={id} />
        <filter id={`${id}-soft`} x="-20%" y="-200%" width="140%" height="500%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        {/* Things that climb out of the ground are cut off at its surface. */}
        <clipPath id={`${id}-above`}>
          <rect x="0" y="0" width="1440" height="800" />
        </clipPath>
      </defs>

      {sky ? (
        <>
          <rect width="1440" height="900" fill={ref('sky')} />
          <g className="hw-stars">
            {STARS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i % 3 ? 1.1 : 1.7} style={{ animationDelay: `${-(i * 0.37) % 3}s`, animationDuration: `${2 + (i % 4)}s` }} />
            ))}
          </g>
          <rect className="hw-lightning" width="1440" height="900" />
          <path className="hw-bolt" d="M620 0l-26 90 30-6-40 110 24-4-34 120" />
          <circle className="hw-halo" cx="1080" cy="190" r="300" fill={ref('halo')} />
          <circle cx="1080" cy="190" r="56" fill={ref('moon')} />
          <g className="hw-crater">
            <circle cx="1062" cy="176" r="9" />
            <circle cx="1098" cy="206" r="12" />
            <circle cx="1084" cy="168" r="5" />
            <circle cx="1060" cy="214" r="6" />
          </g>
          <g className="hw-witch-fly">
            <g className="hw-witch-bob">
              <WitchShape />
            </g>
          </g>
          <g className="hw-cloud" filter={ref('soft')}>
            <ellipse cx="900" cy="250" rx="220" ry="16" />
            <ellipse cx="420" cy="170" rx="260" ry="14" />
          </g>
          <g className="hw-cloud hw-cloud-front" filter={ref('soft')}>
            <ellipse cx="980" cy="205" rx="200" ry="14" />
          </g>
          {[
            { r: 120, d: 9, delay: 0 },
            { r: 165, d: 13, delay: -4 },
            { r: 140, d: 11, delay: -7, reverse: true },
            { r: 200, d: 16, delay: -2 },
          ].map((b, i) => (
            <g
              key={i}
              className="hw-bat-orbit"
              style={{ animationDuration: `${b.d}s`, animationDelay: `${b.delay}s`, animationDirection: b.reverse ? 'reverse' : 'normal' }}
            >
              <g transform={`translate(${1080 + b.r} 190) scale(${0.55 + (i % 2) * 0.2})`}>
                <g
                  className="hw-bat-upright"
                  style={{ animationDuration: `${b.d}s`, animationDelay: `${b.delay}s`, animationDirection: b.reverse ? 'normal' : 'reverse' }}
                >
                  <BatShape />
                </g>
              </g>
            </g>
          ))}
        </>
      ) : (
        <rect y="420" width="1440" height="480" fill={ref('horizon')} />
      )}

      {/* the far hill, and under the full sky the house on it */}
      <path className="hw-hill" d="M0 712C180 668 330 664 470 690S760 716 900 698 1180 664 1300 676 1400 690 1440 686V900H0Z" />
      {sky && (
        <>
          <path className="hw-far" d="M180 690V522h-8l30-92 31 92h-8v18l62-50 47 39v-35h14v47l18 14v-15l24-68 25 68v150Z" />
          <path className="hw-far-tree" d="M455 700c2-30 0-52 4-80m0 30c-14-16-22-30-24-46m24 26c14-12 22-24 26-40m-10 20c8 2 14 0 20-6" strokeWidth="5" />
          <g className="hw-window">
            <path d="M194 560v-12a8 8 0 0 1 16 0v12Z" />
            <circle cx="295" cy="532" r="7" style={{ animationDelay: '-0.9s' }} />
            <rect x="238" y="580" width="16" height="22" style={{ animationDelay: '-3.1s' }} />
            <rect x="336" y="580" width="16" height="22" style={{ animationDelay: '-1.3s' }} />
            <rect x="238" y="622" width="16" height="22" style={{ animationDelay: '-2.1s' }} />
            <rect x="336" y="622" width="16" height="22" style={{ animationDelay: '-4.4s' }} />
            <rect x="194" y="600" width="16" height="22" style={{ animationDelay: '-5.2s' }} />
            <rect x="286" y="656" width="18" height="34" style={{ animationDelay: '-0.6s' }} />
            <rect x="385" y="560" width="10" height="16" style={{ animationDelay: '-2.7s' }} />
          </g>
          {/* someone walks past the upstairs windows */}
          <g className="hw-window-figure">
            <path d="M0 22v-12a4 4 0 0 1 8 0v12Z" transform="translate(240 580)" />
          </g>
        </>
      )}

      <g className="hw-fog" filter={ref('soft')}>
        <ellipse cx="560" cy="770" rx="420" ry="26" />
        <ellipse cx="1120" cy="760" rx="360" ry="22" />
      </g>

      {/* the trees, framing both sides, and an owl */}
      {sky && (
        <>
          <g className="hw-tree">
            <path d="M92 900C104 780 116 660 106 560S70 360 40 230 6 120-10 100" strokeWidth="26" />
            <path d="M104 608C150 560 206 524 264 508S340 476 366 444" strokeWidth="10" />
            <path d="M98 470c40-34 80-58 112-96s64-62 98-74" strokeWidth="8" />
            <path d="M70 336c26-34 52-62 62-92s14-56 18-78" strokeWidth="6" />
            <path d="M102 650C76 620 44 594 0 572" strokeWidth="8" />
            <path
              d="M300 500l32 30M366 444l26-48M366 444l46 14M240 330l10-50M308 300l36 10M308 300l14-42M132 244l58-16M150 168l-10-50M150 168l42-20"
              strokeWidth="3"
            />
            <path d="M1362 900C1352 800 1338 700 1344 600S1378 440 1400 380 1440 300 1460 270" strokeWidth="26" />
            <path d="M1346 566c-36-30-74-52-112-68s-72-38-110-78" strokeWidth="9" />
            <path d="M1372 444c-24-34-48-60-72-82s-36-48-96-88" strokeWidth="7" />
            <path d="M1392 404c10-30 20-52 32-74" strokeWidth="6" />
            <path d="M1182 470l-30 30M1124 420l-34-40M1124 420l-44 10M1262 300l8-50M1204 274l-44 6M1204 274l-12-42" strokeWidth="3" />
          </g>
          <g transform="translate(1238 476)">
            <g className="hw-owl">
              <path className="hw-owl-body" d="M-12 8c0-14 2-22 4-26l3 5h10l3-5c2 4 4 12 4 26 0 8-6 12-12 12s-12-4-12-12Z" />
              <g className="hw-owl-eyes">
                <circle cx="-5" cy="-6" r="3.6" />
                <circle cx="5" cy="-6" r="3.6" />
              </g>
            </g>
          </g>
          {/* a spider on its thread from the left tree */}
          <g className="hw-scene-spider">
            <line x1="300" y1="500" x2="300" y2="610" className="hw-thread" />
            <g transform="translate(300 614)">
              <g className="hw-spider">
                <ellipse className="hw-spider-body" cx="0" cy="0" rx="6" ry="7" />
                <path className="hw-spider-legs" d="M-5-2l-9-6-3 6M-5 1l-10 0-3 7M-5 4l-8 5-2 6M5-2l9-6 3 6M5 1l10 0 3 7M5 4l8 5 2 6" />
              </g>
            </g>
          </g>
        </>
      )}

      {/* the near ground and the graves */}
      <path className="hw-ground" d="M0 796C220 770 470 802 720 790S1180 772 1440 798V900H0Z" />

      {/* ghosts rise out of the graves, and a hand claws its way up */}
      <g clipPath={ref('above')}>
        <g className="hw-rise">
          <GhostArt x="392" y="700" width="60" height="70" />
        </g>
        {sky && (
          <g className="hw-rise" style={{ animationDelay: '-6s' }}>
            <GhostArt x="1068" y="700" width="62" height="72" />
          </g>
        )}
        <g className="hw-zombie" transform={`translate(${sky ? 780 : 720} 798)`}>
          <g className="hw-zombie-arm">
            <path className="hw-zombie-skin" d="M-6 46L-5 0h10l1 46Z" />
            <path className="hw-zombie-skin" d="M-9 2C-10-7-7-14 0-14s10 7 9 16Z" />
            <g className="hw-zombie-fingers">
              <path d="M-7-11l-4-15M-2-13l-1-17M2-13l2-16M6-10l5-12M-9-4l-8-6" />
            </g>
            <path className="hw-zombie-sleeve" d="M-8 22h16l2 8-4-2-3 4-3-3-3 3-3-3-4 2Z" />
          </g>
        </g>
      </g>

      <g className="hw-grave">
        <path d="M400 812v-40a22 22 0 0 1 44 0v40Z" />
        <path d="M516 804v-38h-14v-12h14v-14h12v14h14v12h-14v38Z" />
        <path d="M630 800v-22a14 14 0 0 1 28 0v22Z" />
        {sky && (
          <>
            <path d="M968 806v-32a18 18 0 0 1 36 0v32Z" transform="rotate(-6 986 806)" />
            <path d="M1074 812v-46a25 25 0 0 1 50 0v46Z" />
          </>
        )}
      </g>

      <g className="hw-wisps">
        {WISPS.filter((w) => sky || w.x < 900).map((w, i) => (
          <g key={i} className="hw-wisp" style={{ animationDuration: `${w.d}s`, animationDelay: `${w.delay}s` }}>
            <circle cx={w.x} cy={w.y} r="16" fill={ref('wisp')} />
            <circle className="hw-wisp-core" cx={w.x} cy={w.y} r="2.6" />
          </g>
        ))}
      </g>

      <Pumpkin x={150} y={836} r={34} id={id} />
      <Pumpkin x={226} y={852} r={24} id={id} delay="-1.1s" />
      <Pumpkin x={1196} y={846} r={26} id={id} delay="-0.7s" />
      <Pumpkin x={1282} y={834} r={38} id={id} delay="-1.6s" />

      <g className="hw-fog hw-fog-front" filter={ref('soft')}>
        <ellipse cx="300" cy="868" rx="380" ry="20" />
        <ellipse cx="1000" cy="880" rx="420" ry="22" />
      </g>

      {sky &&
        LEAVES.map((l, i) => (
          <g key={i} transform={`translate(${l.x} 0)`}>
            <path className="hw-leaf" d="M0-9C7-7 9 0 0 11-9 0-7-7 0-9Z" style={{ animationDuration: `${l.d}s`, animationDelay: `${l.delay}s` }} />
          </g>
        ))}
    </svg>
  );
}
