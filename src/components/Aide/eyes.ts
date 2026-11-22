/* Where the aide's faces are, so the pointer and the panel can gently turn their heads.
 * Up to three exist: the panel's header, the dock in the sidebar, and the floating orb that
 * stands in for the dock while the sidebar is tucked away. The one you can see speaks. */

import { REACH } from './AideMark';

type Where = 'panel' | 'dock' | 'orb';
type Face = { look: HTMLSpanElement; size: keyof typeof REACH };

const faces = new Map<Where, Face>();

/** While the aide points at something, its gaze is taken; the pointer can't steal it. */
export const gaze = { busy: false };

export const faceRef = (where: Where, size: keyof typeof REACH) => (look: HTMLSpanElement | null) => {
  if (look) faces.set(where, { look, size });
  else faces.delete(where);
};

/** The face to speak from: the panel's when it's open, else whichever of orb and dock shows. */
export function leadFace(panelOpen: boolean) {
  const order: Where[] = panelOpen ? ['panel', 'orb', 'dock'] : ['orb', 'dock'];
  for (const where of order) {
    const face = faces.get(where);
    if (!face?.look.isConnected || !face.look.checkVisibility({ visibilityProperty: true })) continue;
    const r = face.look.getBoundingClientRect();
    if (!r.width) continue;
    return { ...face, x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return null;
}

/** Turn the speaking head towards a point, fully once it's `falloff` px away; null looks ahead. */
export function lookAt(panelOpen: boolean, to: { x: number; y: number } | null, falloff = 240) {
  const face = leadFace(panelOpen);
  if (!face) return;
  if (!to || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    face.look.style.transform = '';
    return;
  }
  const dx = to.x - face.x;
  const dy = to.y - face.y;
  const dist = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, dist / falloff);
  const { px, deg } = REACH[face.size];
  // A head turns more than it slides: shift a little, and tilt towards the side it's looking.
  const x = (dx / dist) * k * px;
  const y = (dy / dist) * k * px;
  face.look.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${((dx / dist) * k * deg).toFixed(2)}deg)`;
}
