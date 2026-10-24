/* Stack: what's waiting on you, as a pile of cards.
 *
 * The thing to look at first is the card on top, and it carries its own evidence: its
 * group's hour, five minutes a bar, with the pages in the brightest grey. The rest of the
 * queue is the pile behind it, one edge per thing, so how much is left is something you can
 * see before you count it. J throws the top card to the back of the pile; K brings the last
 * one back. With a pointer, drag the top card off to either side.
 *
 * The open button on the top card is the screen's one white thing. */

import { useLayoutEffect, useRef, useState } from 'react';
import { num } from '../../../src/lib/format';
import { navigate } from '../../../src/lib/route';
import { plural, type GroupReading, type Need } from '../../../src/pages/home/model/station';
import { Figure, Hello, Lead, still, type HomeProps } from '../shared';

const SHOWN = 4; // cards drawn in the pile, the top one included
const THROW = 110; // px of drag that throws a card

const pose = (depth: number) => `translateY(${-depth * 14}px) scale(${1 - depth * 0.045})`;

export function Stack({ data, at, step }: HomeProps) {
  const { queue, groups } = data;
  const n = queue.length;
  const cards = useRef(new Map<string, HTMLDivElement>());
  const was = useRef(at);
  const thrownFrom = useRef<{ x: number; dir: number } | null>(null);
  const [drag, setDrag] = useState<{ id: number; x0: number; dx: number } | null>(null);

  // A step forward throws the old top card off the pile and back under it; a step back
  // brings the card from the bottom of the pile in from the side.
  useLayoutEffect(() => {
    const before = was.current;
    was.current = at;
    if (before === at || n < 2 || still()) return;
    const forward = (before + 1) % n === at;
    const back = (before - 1 + n) % n === at;
    if (forward) {
      const el = cards.current.get(queue[before].key);
      const from = thrownFrom.current ?? { x: 0, dir: 1 };
      thrownFrom.current = null;
      const depth = n - 1;
      el?.animate(
        [
          { transform: `translateX(${from.x}px) rotate(${from.x / 22}deg)`, opacity: 1 },
          { transform: `translateX(${from.dir * 120}%) rotate(${from.dir * 12}deg)`, opacity: 0, offset: 0.5 },
          { transform: pose(depth), opacity: 0, offset: 0.51 },
          { transform: pose(depth), opacity: depth < SHOWN ? 1 : 0 },
        ],
        { duration: 520, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      );
    } else if (back) {
      cards.current.get(queue[at].key)?.animate(
        [
          { transform: 'translateX(-120%) rotate(-12deg)', opacity: 0 },
          { transform: pose(0), opacity: 1 },
        ],
        { duration: 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      );
    }
  }, [at, n, queue]);

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id: e.pointerId, x0: e.clientX, dx: 0 });
  };
  const onMove = (e: React.PointerEvent) => {
    if (drag?.id === e.pointerId) setDrag({ ...drag, dx: e.clientX - drag.x0 });
  };
  const onUp = () => {
    if (!drag) return;
    if (Math.abs(drag.dx) > THROW && n > 1) {
      thrownFrom.current = { x: drag.dx, dir: Math.sign(drag.dx) };
      step(1);
    }
    setDrag(null);
  };

  return (
    <div className="hs-stack">
      <div className="hs-stack-top">
        <Hello now={data.now} />
        <div className="hs-stack-figure">
          <Figure data={data} />
          <Lead data={data} />
        </div>
      </div>

      <div className="hs-pile" aria-live="polite">
        {n === 0 ? (
          <div className="hs-card" data-empty>
            <p>Nothing is waiting on you.</p>
          </div>
        ) : (
          queue.map((item, i) => {
            const depth = (i - at + n) % n;
            const top = depth === 0;
            const dragging = top && drag !== null;
            return (
              <div
                key={item.key}
                ref={(el) => {
                  if (el) cards.current.set(item.key, el);
                  else cards.current.delete(item.key);
                }}
                className="hs-card"
                data-top={top || undefined}
                data-dragging={dragging || undefined}
                aria-hidden={!top}
                inert={!top}
                style={{
                  zIndex: n - depth,
                  opacity: depth < SHOWN ? 1 : 0,
                  transform: dragging ? `translateX(${drag.dx}px) rotate(${drag.dx / 22}deg)` : pose(depth),
                }}
                onPointerDown={top ? onDown : undefined}
                onPointerMove={top ? onMove : undefined}
                onPointerUp={top ? onUp : undefined}
                onPointerCancel={top ? onUp : undefined}
              >
                <Card need={item} group={groups.find((g) => g.group.id === item.groupId)} />
              </div>
            );
          })
        )}
      </div>

      {n > 0 && (
        <footer className="hm-keys hs-stack-keys">
          <span className="hs-stack-count">{n === 1 ? 'One thing is waiting on you' : `${at + 1} of ${n} waiting on you`}</span>
          {n > 1 && (
            <span>
              <kbd>J</kbd> <kbd>K</kbd> Next thing
            </span>
          )}
          <span>
            <kbd>↵</kbd> Open it
          </span>
        </footer>
      )}
    </div>
  );
}

const PILL = { bad: 'red', warn: 'orange', plain: 'amber' } as const;
const WORD = { bad: 'Would hide pages', warn: 'Needs a look', plain: 'Waiting' } as const;

function Card({ need, group }: { need: Need; group?: GroupReading }) {
  const id = need.href.split('/').pop();
  const peak = Math.max(1, ...(group?.buckets.map((b) => b.total) ?? [1]));
  return (
    <div className="hs-card-inner">
      <div className="hs-card-head">
        <span className="hs-pill" data-tone={PILL[need.tone]}>
          {WORD[need.tone]}
        </span>
        <span className="hs-card-kind">{need.kind}</span>
        <span className="hs-card-id mn-mono">{id}</span>
      </div>
      <h2 className="hs-card-title">{need.title}</h2>
      <p className="hs-card-why">{need.why}</p>

      {group && (
        <figure className="hs-card-hour">
          <figcaption>
            <b>{group.group.name}</b> in the last hour: {plural(group.paged, 'page')} from {plural(group.total, 'alert')}
          </figcaption>
          <div className="hs-bars" aria-hidden>
            {group.buckets.map((b, i) => (
              <span key={i} style={{ height: `${(b.total / peak) * 100}%` }}>
                <i style={{ height: b.total ? `${(b.paged / b.total) * 100}%` : 0 }} />
              </span>
            ))}
          </div>
          <div className="hs-bars-axis" aria-hidden>
            <span>60 min ago</span>
            <span>Now</span>
          </div>
        </figure>
      )}

      <div className="hs-card-foot">
        <span className="hs-card-meta">
          {group ? `${group.group.unit}` : ''}
          {group && group.proposed > 1 ? ` · ${num(group.proposed)} rules waiting for this group` : ''}
        </span>
        <button className="mn-btn" data-variant="primary" onClick={() => navigate(need.href)}>
          Open <kbd>↵</kbd>
        </button>
      </div>
    </div>
  );
}
