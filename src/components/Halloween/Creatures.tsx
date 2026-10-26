/* The things that move in Halloween mode: the sheet ghost (Tesla's glowing car-under-a-sheet,
 * as a ghost), bats, the witch, and the jack-o'-lantern. Each is plain SVG; the motion is in
 * Creatures.css, and the ghost's hem ripples with SMIL so it never needs JavaScript. */

import { useId, type SVGProps } from 'react';
import './Creatures.css';

const HEM_A =
  'M20 70C20 30 45 8 60 8S100 30 100 70L104 118C98 112 92 112 88 120C82 128 76 128 72 120C66 112 58 112 54 120C48 128 40 128 36 120C32 112 24 112 16 118Z';
const HEM_B =
  'M20 70C20 30 45 8 60 8S100 30 100 70L102 120C96 128 90 128 86 120C80 112 74 112 70 120C64 128 56 128 52 120C46 112 40 112 34 120C30 128 22 126 18 116Z';

/** A glowing sheet ghost, 120 × 140. Its eyes blink; with data-boo on an ancestor it shouts. */
export function GhostArt(props: SVGProps<SVGSVGElement>) {
  const id = useId().replace(/:/g, '');
  const sheet = `url(#${id}-sheet)`;
  // The hem's ripple is SMIL, which CSS can't stop, so it's left out for reduced motion.
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <svg viewBox="-10 -10 140 160" aria-hidden focusable="false" {...props} className={`hw-ghost-art ${props.className ?? ''}`}>
      <defs>
        <radialGradient id={`${id}-sheet`} cx="0.42" cy="0.3" r="0.85">
          <stop offset="0" className="hw-stop-ghost-1" />
          <stop offset="0.55" className="hw-stop-ghost-2" />
          <stop offset="1" className="hw-stop-ghost-3" />
        </radialGradient>
        <radialGradient id={`${id}-aura`}>
          <stop offset="0" className="hw-stop-aura" />
          <stop offset="1" className="hw-stop-aura" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse className="hw-ghost-aura" cx="60" cy="72" rx="68" ry="76" fill={`url(#${id}-aura)`} />
      <path className="hw-ghost-arm" data-side="l" d="M24 62C10 68 2 80 6 92c6-2 12-8 20-12Z" fill={sheet} />
      <path className="hw-ghost-arm" data-side="r" d="M96 62c14 6 22 18 18 30-6-2-12-8-20-12Z" fill={sheet} />
      <path d={HEM_A} fill={sheet}>
        {!still && <animate attributeName="d" dur="1.2s" repeatCount="indefinite" values={`${HEM_A};${HEM_B};${HEM_A}`} />}
      </path>
      <path className="hw-ghost-fold" d="M44 40c-6 22-6 50-2 74M62 30c2 26 2 56 6 84M80 44c4 22 6 46 4 68" />
      <g className="hw-ghost-eyes">
        <ellipse className="hw-ghost-hole" cx="47" cy="54" rx="7" ry="10" />
        <ellipse className="hw-ghost-hole" cx="73" cy="54" rx="7" ry="10" />
        <ellipse className="hw-ghost-iris" cx="48" cy="57" rx="3" ry="3.6" />
        <ellipse className="hw-ghost-iris" cx="74" cy="57" rx="3" ry="3.6" />
      </g>
      <ellipse className="hw-ghost-mouth" cx="60" cy="80" rx="5.5" ry="7" />
    </svg>
  );
}

/** A bat, centred on (0, 0), about 80 wide. Its wings flap. */
export function BatShape({ eyes = true }: { eyes?: boolean }) {
  return (
    <g className="hw-bat-shape">
      <path className="hw-bat-wing" data-side="l" d="M-3 0C-10-10-24-13-38-6Q-32-2-30 4Q-25-1-20 5Q-14 0-10 6Q-6 1-3 4Z" />
      <path className="hw-bat-wing" data-side="r" d="M3 0C10-10 24-13 38-6Q32-2 30 4Q25-1 20 5Q14 0 10 6Q6 1 3 4Z" />
      <ellipse className="hw-bat-body" cx="0" cy="2" rx="5" ry="8" />
      <path className="hw-bat-body" d="M-5-3l-1-7 4 4 2-1 2 1 4-4-1 7Z" />
      {eyes && (
        <>
          <circle className="hw-bat-eye" cx="-2" cy="-1" r="1.1" />
          <circle className="hw-bat-eye" cx="2" cy="-1" r="1.1" />
        </>
      )}
    </g>
  );
}

export function BatArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-42 -16 84 32" aria-hidden focusable="false" {...props}>
      <BatShape />
    </svg>
  );
}

/** A witch on her broom, facing right, centred on (0, 0). */
export function WitchShape() {
  return (
    <g className="hw-witch">
      <path d="M-62-6L-44 2-64 4-44 4-62 14-42 6Z" />
      <path d="M-46 4L46-6" className="hw-witch-broom" />
      <path d="M-4-22C-20-18-34-6-40 6c12-6 24-8 34-6Z" className="hw-witch-cape" />
      <path d="M-6 0C-10-14-4-26 4-28l4 4c4 6 4 16 2 24Z" />
      <circle cx="6" cy="-32" r="5.5" />
      <path d="M10-32l7 2-6 1Z" />
      <path d="M-8-34L22-38 9-40 14-60 0-40Z" />
      <path d="M8-2l12 8 6-2" className="hw-witch-broom" />
    </g>
  );
}

/** A jack-o'-lantern centred on (0, 0), about 90 wide at r = 34. It bounces, laughs and flickers. */
export function Pumpkin({ x, y, r, id, delay = '0s' }: { x: number; y: number; r: number; id: string; delay?: string }) {
  const face = (
    <>
      <path className="hw-pumpkin-eye" d="M-18-4l7-12 7 12Z" />
      <path className="hw-pumpkin-eye" d="M4-4l7-12 7 12Z" />
      <path className="hw-pumpkin-mouth" d="M-22 6c8 13 36 13 44 0l-6 2-3 5-5-5-4 6-4-6-5 5-3-5Z" />
    </>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${r / 34})`}>
      <ellipse className="hw-candle-glow" cx="0" cy="6" rx="120" ry="70" fill={`url(#${id}-glow)`} style={{ animationDelay: delay }} />
      <g className="hw-pumpkin-bob" style={{ animationDelay: delay }}>
        <path className="hw-stem" d="M-4-24c0-8 2-14 8-18l4 3c-4 3-5 8-4 15Z" />
        <ellipse cx="-17" cy="2" rx="22" ry="26" fill={`url(#${id}-pumpkin)`} />
        <ellipse cx="17" cy="2" rx="22" ry="26" fill={`url(#${id}-pumpkin)`} />
        <ellipse cx="0" cy="0" rx="22" ry="28" fill={`url(#${id}-pumpkin)`} />
        <path className="hw-pumpkin-rib" d="M-8-26c-6 16-6 36 0 54M8-26c6 16 6 36 0 54" />
        <g className="hw-face-glow" filter={`url(#${id}-blur)`} style={{ animationDelay: delay }}>
          {face}
        </g>
        <g className="hw-face" style={{ animationDelay: delay }}>
          {face}
        </g>
      </g>
    </g>
  );
}

/** The gradients and blur a Pumpkin needs, under the id it's given. */
export function PumpkinDefs({ id }: { id: string }) {
  return (
    <>
      <radialGradient id={`${id}-pumpkin`} cx="0.45" cy="0.4" r="0.75">
        <stop offset="0.25" className="hw-stop-pumpkin" />
        <stop offset="1" className="hw-stop-pumpkin-shade" />
      </radialGradient>
      <radialGradient id={`${id}-glow`}>
        <stop offset="0" className="hw-stop-glow" />
        <stop offset="1" className="hw-stop-glow" stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </>
  );
}

/** One lit pumpkin on its own, for the Halloween card. */
export function Lantern() {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="hw-lantern" viewBox="-44 -48 88 88" aria-hidden focusable="false">
      <defs>
        <PumpkinDefs id={id} />
      </defs>
      <Pumpkin x={0} y={4} r={34} id={id} />
    </svg>
  );
}
