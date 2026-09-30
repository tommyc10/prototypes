/* What a direction plugs into the shared film. */

import type { ComponentType, RefObject } from 'react';
import type { Story } from '../lib/kit';
import type { Chapter } from './story';

export interface ChromeProps {
  chapters: Chapter[];
  active: number;
  /** One element per chapter; the film sets --p (0–1) on each as the playhead crosses it. */
  fills: RefObject<(HTMLElement | null)[]>;
  onJump: (i: number) => void;
}

export interface Built {
  story: Story;
  /** Every frame the playhead moves, with its time. For readouts (zoom, depth). */
  onUpdate?: (time: number) => void;
  /** The first-load entrance, played once if the page opens at the top. */
  intro?: () => void;
}

export interface Direction {
  id: 'zoom' | 'snap' | 'fly';
  /** Snap the scroll to each chapter's settled moment, so one flick plays one beat. */
  snap?: boolean;
  name: string;
  blurb: string;
  /** Class on the film root: the direction's theme. */
  className: string;
  /** Scenes + captions, laid out on the 1440 × 900 stage. */
  Stage: ComponentType<{ onReplay: () => void }>;
  /** Brand, chapter rail and any HUD, laid out on the viewport over the stage. */
  Chrome: ComponentType<ChromeProps>;
  build: (stage: HTMLElement) => Built;
}
