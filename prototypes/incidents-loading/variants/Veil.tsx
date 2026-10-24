/* Veil: what's on screen stays, softened behind frosted glass, and one capsule floats over
 * it saying what's being fetched. When both columns wait there's one capsule, centred
 * across both. The capsule only appears if the wait passes 150ms, so a quick answer never
 * flashes it. Glass because it floats: it's the only floating thing on the page. */

import type { OverlayProps } from '../shared';
import { placeholderVariant } from './placeholders';

function region({ list, detail, listLeft, detailLeft }: OverlayProps) {
  if (list && detail) return { left: listLeft, right: 0 };
  if (list) return { left: listLeft, width: detailLeft - listLeft };
  return { left: detailLeft, right: 0 };
}

function VeilOverlay(props: OverlayProps) {
  if (!props.list && !props.detail) return null;
  return (
    <div className="ld-veil-region" style={region(props)} aria-hidden>
      <div className="ld-capsule" key={`${props.list}-${props.detail}`}>
        <svg className="ld-spinner" viewBox="0 0 16 16" width="14" height="14">
          <circle cx="8" cy="8" r="6" />
          <path d="M8 2a6 6 0 0 1 6 6" />
        </svg>
        <span className="mn-truncate">{props.says}</span>
      </div>
    </div>
  );
}

export const veil = {
  ...placeholderVariant({ name: 'Veil', idea: 'What’s there softens behind glass; one capsule says what’s coming', className: 'ld-veil' }),
  Overlay: VeilOverlay,
  badge: null,
};

export { region };
