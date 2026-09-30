/* Pip: the dragon who walks you through the story. The timeline moves the wrapper around
 * the stage; Film.tsx tells it its mood and what to say. The bubble remounts per line, so
 * each one enters fresh (CSS @starting-style) and the last one leaves at once. */

import { forwardRef } from 'react';
import { BotAvatar, type BotAvatarState } from '../vendor/bot-avatars';
import { GUIDE } from './data';
import type { Side } from './timeline/guide';
import './Guide.css';

export interface GuideView {
  mood: BotAvatarState;
  side: Side;
  line: { id: number; text: string } | null;
}

export const Guide = forwardRef<HTMLCanvasElement, GuideView>(function Guide({ mood, side, line }, ref) {
  return (
    // Decorative: the captions carry the story for screen readers; Pip's asides would only repeat it.
    <div className="guide" data-side={side} aria-hidden>
      <BotAvatar ref={ref} type={GUIDE.type} size={72} state={mood} jumpEvery={0} seed={0.3} />
      {line && (
        <p className="guide-bubble" key={line.id}>
          {line.text}
        </p>
      )}
    </div>
  );
});
