/* Signal, the aide's headphone-wearing droid. Three layers, so their motions never fight:
 *
 *   look    where the head is turned: towards the pointer, or the element it points at.
 *           Written straight to `lookRef` by eyes.ts, so following the pointer re-renders nothing.
 *   mood    how it holds itself: idle, listening (you're typing), news (it has something to say).
 *   avatar  the picture, which nods once per answer (Web Animations, so the image is never
 *           remounted and never flashes).
 *
 * If the picture can't load, the earlier grey lens stands in, so the dock is never a broken image. */

import { Check } from 'lucide-react';
import { useEffect, useRef, useState, type Ref } from 'react';

const AVATAR = `${import.meta.env.BASE_URL}aide/avatars/aide-signal-headphones-144.png`;

export type Mood = 'idle' | 'listening' | 'news';

export function AideMark({
  size = 20,
  acknowledge = 0,
  done = false,
  mood = 'idle',
  lookRef,
}: {
  size?: 20 | 28 | 36;
  /** Change it to acknowledge an answer with a small nod. */
  acknowledge?: number;
  done?: boolean;
  mood?: Mood;
  lookRef?: Ref<HTMLSpanElement>;
}) {
  const [broken, setBroken] = useState(false);
  const face = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!acknowledge || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    face.current?.animate(
      [{ transform: 'none' }, { transform: 'translateY(1.5px) rotate(-4deg)', offset: 0.4 }, { transform: 'none' }],
      { duration: 360, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' },
    );
  }, [acknowledge]);
  return (
    <span className="mn-aide-mark" data-size={size} data-done={done || undefined} data-mood={mood} data-broken={broken || undefined} aria-hidden>
      <span className="mn-aide-look" ref={lookRef}>
        <span className="mn-aide-mood">
          {broken ? (
            <span className="mn-aide-lens" ref={face}>
              <span className="mn-aide-pupil" />
            </span>
          ) : (
            <img
              ref={face as Ref<HTMLImageElement>}
              className="mn-aide-avatar"
              src={AVATAR}
              alt=""
              width={size}
              height={size}
              decoding="async"
              draggable={false}
              onError={() => setBroken(true)}
            />
          )}
        </span>
      </span>
      {done && (
        <span className="mn-aide-complete">
          <Check size={size === 36 ? 9 : 7} strokeWidth={3} />
        </span>
      )}
    </span>
  );
}

/** How far the head may turn: px of travel and degrees of tilt, per size. */
export const REACH = { 20: { px: 1, deg: 6 }, 28: { px: 1.5, deg: 7 }, 36: { px: 2, deg: 7 } } as const;
