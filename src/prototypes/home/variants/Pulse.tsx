/* Pulse: time is the picture. The figure and the one thing waiting on top, then the hour as a
 * grid: a row per group, a column per five minutes, each cell as bright as the pages it sent.
 * It's what the globe was for (where is the noise?), drawn so it can be read. */

import { useState } from 'react';
import { num } from '../../../lib/format';
import { clockFace, dayFace, plural, TONE_COLOR } from '../../../pages/home/model/station';
import { CURRENT_USER } from '../../../pages/rule-management/data/mockData';
import { bucketStart, firstOf, greeting, groupTag, hourSeries, openLabel, useCursor, type VariantProps } from '../shared';

export function Pulse({ data }: VariantProps) {
  const { counts, queue, groups, now } = data;
  const { index, need, setAt } = useCursor(queue);
  const [tip, setTip] = useState<{ g: number; b: number } | null>(null);
  const series = hourSeries(groups);
  const peakPaged = Math.max(1, ...groups.flatMap((g) => g.buckets.map((b) => b.paged)));
  const peakTotal = Math.max(1, ...groups.flatMap((g) => g.buckets.map((b) => b.total)));
  const peakSeries = Math.max(1, ...series.map((s) => s.total));
  const shown = tip && groups[tip.g];
  const cell = tip && shown?.buckets[tip.b];

  return (
    <div className="pv-scroll">
      <div className="pv-pulse">
        <div className="pv-pulse-top pv-arrive">
          <div>
            <p className="pv-meta">
              {dayFace(now)} <span className="mn-mono">{clockFace(now)}</span> · {greeting(now, CURRENT_USER)}
            </p>
            <div className="pv-pulse-fig">
              <a className="pv-hero" href="#/alerts">
                {num(counts.paged)}
              </a>
              <p className="pv-lead">
                reached a person this hour, out of <b>{num(counts.total)}</b>. Rules hid <b>{num(counts.hidden)}</b>, and <b>{num(counts.folded)}</b> joined open incidents.
              </p>
            </div>
          </div>

          {need && (
            <a className="pv-card pv-next" href={need.href}>
              <span className="pv-meta">
                {queue.length === 1 ? 'One thing is waiting on you' : `${index + 1} of ${queue.length} waiting on you`}
              </span>
              <span className="pv-next-title">
                <i className="pv-dot" style={{ background: TONE_COLOR[need.tone] }} aria-hidden />
                {need.title}
              </span>
              <span className="pv-row-why">{need.why}</span>
              <span className="pv-keys">
                <span>
                  <kbd>J</kbd> <kbd>K</kbd> Next
                </span>
                <span>
                  <kbd>↵</kbd> {openLabel(need)}
                </span>
              </span>
            </a>
          )}
        </div>

        <section className="pv-grid-wrap pv-arrive" onMouseLeave={() => setTip(null)}>
          <div className="pv-grid-head">
            <h2 className="pv-section">The hour, group by group</h2>
            <p className="pv-meta">{cell && shown ? `${shown.group.name} · ${bucketStart(now, tip.b)} · ${plural(cell.paged, 'page')} from ${plural(cell.total, 'alert')}` : 'Brighter means more pages. Point at a cell.'}</p>
          </div>

          <div className="pv-grid">
            <span />
            <div className="pv-grid-spark" aria-hidden>
              {series.map((s, i) => (
                <span key={i} style={{ transform: `scaleY(${s.total / peakSeries})` }}>
                  <span style={{ transform: `scaleY(${s.total ? s.paged / s.total : 0})` }} />
                </span>
              ))}
            </div>
            <span />

            {groups.map((g, gi) => {
              const tag = groupTag(g);
              const on = need?.groupId === g.group.id;
              const first = firstOf(queue, g.group.id);
              return (
                <div className="pv-grid-row" key={g.group.id} data-selected={on || undefined} onClick={() => first >= 0 && setAt(first)}>
                  <span className="pv-grid-name">
                    <span className="pv-truncate">{g.group.name}</span>
                    {tag.tone && <i className="pv-dot" style={{ background: TONE_COLOR[tag.tone] }} title={tag.label} />}
                  </span>
                  <span className="pv-grid-cells">
                    {g.buckets.map((b, bi) => (
                      <span
                        key={bi}
                        className="pv-cell"
                        data-on={tip?.g === gi && tip.b === bi ? '' : undefined}
                        style={{ '--paged': b.paged / peakPaged, '--total': b.total / peakTotal } as React.CSSProperties}
                        onMouseEnter={() => setTip({ g: gi, b: bi })}
                      />
                    ))}
                  </span>
                  <span className="pv-grid-sum">
                    <b>{num(g.paged)}</b> / {num(g.total)}
                  </span>
                </div>
              );
            })}

            <span />
            <div className="pv-axis">
              <span>{bucketStart(now, 0)}</span>
              <span>{bucketStart(now, 3)}</span>
              <span>{bucketStart(now, 6)}</span>
              <span>{bucketStart(now, 9)}</span>
              <span>Now</span>
            </div>
            <span className="pv-meta pv-grid-sum">pages / alerts</span>
          </div>
        </section>
      </div>
    </div>
  );
}
