/* Board: the station as a wall of tiles. Four numbers for the hour, a card per group with its
 * hour drawn as bars, and the queue in a rail beside them. Read at a glance, not in order. */

import { num } from '../../../lib/format';
import { clockFace, dayFace, plural, TONE_COLOR } from '../../../pages/home/model/station';
import { firstOf, groupTag, openLabel, useCursor, type VariantProps } from '../shared';

export function Board({ data }: VariantProps) {
  const { counts, queue, groups, now } = data;
  const { index, need, setAt } = useCursor(queue);
  const peak = Math.max(1, ...groups.flatMap((g) => g.buckets.map((b) => b.total)));

  const stats = [
    { label: 'Reached a person', value: counts.paged, of: counts.total },
    { label: 'Hidden by rules', value: counts.hidden, of: counts.total },
    { label: 'Joined an open incident', value: counts.folded, of: counts.total },
    { label: 'Pages hidden if approved', value: counts.wouldHidePaged, of: counts.paged, bad: counts.wouldHidePaged > 0 },
  ];

  return (
    <div className="pv-board">
      <div className="pv-board-main pv-scroll">
        <header className="pv-board-head pv-arrive">
          <h1 className="pv-chapter">The last hour</h1>
          <p className="pv-meta">
            {dayFace(now)} · {plural(counts.total, 'alert')} to <span className="mn-mono">{clockFace(now)}</span>
          </p>
        </header>

        <div className="pv-stats pv-arrive">
          {stats.map((s) => (
            <div className="pv-card pv-stat" key={s.label}>
              <span className="pv-stat-label">{s.label}</span>
              <span className="pv-stat-num" data-bad={s.bad || undefined}>
                {num(s.value)}
              </span>
              <span className="pv-meter" aria-hidden>
                <span style={{ transform: `scaleX(${s.of ? s.value / s.of : 0})` }} />
              </span>
            </div>
          ))}
        </div>

        <div className="pv-tiles pv-arrive">
          {groups.map((g) => {
            const tag = groupTag(g);
            const first = firstOf(queue, g.group.id);
            const on = need?.groupId === g.group.id;
            return (
              <button className="pv-card pv-tile" key={g.group.id} data-selected={on || undefined} data-quiet={g.paged === 0 || undefined} onClick={() => (first >= 0 ? setAt(first) : (location.hash = `#/rules?group=assignment.${g.group.id}`))}>
                <span className="pv-tile-head">
                  <span className="pv-tile-name">{g.group.name}</span>
                  <span className="pv-kind">{g.group.unit}</span>
                </span>
                <span className="pv-tile-fig">
                  <span className="pv-tile-num">{num(g.paged)}</span>
                  <span className="pv-meta">{g.paged === 1 ? 'page' : 'pages'}, of {plural(g.total, 'alert')}</span>
                </span>
                <span className="pv-bars" aria-hidden>
                  {g.buckets.map((b, i) => (
                    <span key={i} style={{ transform: `scaleY(${b.total / peak})` }}>
                      <span style={{ transform: `scaleY(${b.total ? b.paged / b.total : 0})` }} />
                    </span>
                  ))}
                </span>
                <span className="pv-tile-tag">
                  {tag.tone ? <i className="pv-dot" style={{ background: TONE_COLOR[tag.tone] }} aria-hidden /> : <i className="pv-dot pv-dot-hollow" aria-hidden />}
                  {tag.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="pv-rail pv-arrive">
        <h2 className="pv-section">
          Waiting on you <span className="pv-count">{queue.length}</span>
        </h2>
        <ol className="pv-rail-list">
          {queue.map((n, i) => (
            <li key={n.key}>
              <button className="pv-row" data-selected={i === index || undefined} onClick={() => setAt(i)}>
                <i className="pv-dot" style={{ background: TONE_COLOR[n.tone] }} aria-hidden />
                <span className="pv-row-main">
                  <span className="pv-row-title pv-truncate">{n.title}</span>
                  <span className="pv-kind">{n.kind}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        {need && (
          <div className="pv-rail-foot">
            <p className="pv-row-why">{need.why}</p>
            <a className="mn-btn" data-variant="primary" href={need.href}>
              {openLabel(need)} <kbd>↵</kbd>
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}
