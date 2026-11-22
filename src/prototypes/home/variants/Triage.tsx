/* Triage: home is the queue. The list and detail every other page uses, with the things
 * waiting on you as the list, and the hour reduced to one strip above the one you're on. */

import { num } from '../../../lib/format';
import { clockFace, plural, TONE_COLOR, type Need } from '../../../pages/home/model/station';
import { bucketStart, groupTag, idOf, openLabel, useCursor, type VariantProps } from '../shared';

const SECTIONS: { kind: Need['kind']; title: string }[] = [
  { kind: 'Change window', title: 'Past their end' },
  { kind: 'Proposed rule', title: 'Rules to decide' },
];

export function Triage({ data }: VariantProps) {
  const { counts, queue, groups, now } = data;
  const { index, need, setAt } = useCursor(queue);
  const reading = groups.find((g) => g.group.id === need?.groupId);
  const peak = Math.max(1, ...(reading?.buckets.map((b) => b.total) ?? [1]));

  return (
    <div className="pv-triage">
      <div className="pv-list">
        <header className="pv-list-head">
          <h1 className="pv-chapter">Waiting on you</h1>
          <span className="pv-count">{queue.length}</span>
        </header>
        <div className="pv-list-scroll">
          {SECTIONS.map((s) => {
            const rows = queue.map((n, i) => ({ n, i })).filter(({ n }) => n.kind === s.kind);
            if (rows.length === 0) return null;
            return (
              <section key={s.kind}>
                <h2 className="pv-list-label">{s.title}</h2>
                {rows.map(({ n, i }) => (
                  <button key={n.key} className="pv-row pv-list-row" data-selected={i === index || undefined} onClick={() => setAt(i)}>
                    <i className="pv-dot" style={{ background: TONE_COLOR[n.tone] }} aria-hidden />
                    <span className="pv-row-main">
                      <span className="pv-row-title pv-truncate">{n.title}</span>
                      <span className="pv-row-meta pv-truncate">
                        <span className="mn-mono">{idOf(n)}</span> · {groups.find((g) => g.group.id === n.groupId)?.group.name}
                      </span>
                    </span>
                  </button>
                ))}
              </section>
            );
          })}
          {queue.length === 0 && <p className="pv-sub">Nothing is waiting on you.</p>}
        </div>
        <footer className="pv-keys pv-list-keys">
          <span>
            <kbd>J</kbd> <kbd>K</kbd> Move
          </span>
          <span>
            <kbd>↵</kbd> Open
          </span>
        </footer>
      </div>

      <div className="pv-scroll">
        <div className="pv-detail">
          <div className="pv-well pv-arrive" aria-label="The last hour">
            <span>
              <b>{num(counts.paged)}</b> reached a person
            </span>
            <span>
              <b>{num(counts.hidden)}</b> hidden by rules
            </span>
            <span>
              <b>{num(counts.folded)}</b> joined open incidents
            </span>
            <span>
              <b>{num(counts.total)}</b> alerts to <span className="mn-mono">{clockFace(now)}</span>
            </span>
          </div>

          {need ? (
            <article className="pv-arrive" key={need.key}>
              <p className="pv-meta">
                <i className="pv-dot" style={{ background: TONE_COLOR[need.tone] }} aria-hidden /> {need.kind} · <span className="mn-mono">{idOf(need)}</span> · {index + 1} of{' '}
                {queue.length}
              </p>
              <h2 className="pv-title">{need.title}</h2>
              <p className="pv-lead">{need.why}</p>

              {reading && (
                <section className="pv-card pv-group-card">
                  <header>
                    <span className="pv-tile-name">{reading.group.name}</span> <span className="pv-kind">{reading.group.unit}</span>
                    <span className="pv-group-tag">{groupTag(reading).label}</span>
                  </header>
                  <p className="pv-sub">
                    {plural(reading.paged, 'page')} this hour, from {plural(reading.total, 'alert')}. Rules hid {num(reading.hidden)}.
                  </p>
                  <div className="pv-bars pv-bars-lg" aria-hidden>
                    {reading.buckets.map((b, i) => (
                      <span key={i} style={{ transform: `scaleY(${b.total / peak})` }} title={`${bucketStart(now, i)}: ${plural(b.paged, 'page')} of ${plural(b.total, 'alert')}`}>
                        <span style={{ transform: `scaleY(${b.total ? b.paged / b.total : 0})` }} />
                      </span>
                    ))}
                  </div>
                  <div className="pv-axis">
                    <span>{bucketStart(now, 0)}</span>
                    <span>{bucketStart(now, 6)}</span>
                    <span>Now</span>
                  </div>
                </section>
              )}

              <div className="pv-actions">
                <a className="mn-btn" data-variant="primary" href={need.href}>
                  {openLabel(need)} <kbd>↵</kbd>
                </a>
                <a className="mn-btn" href={`#/rules?group=assignment.${need.groupId}`}>
                  All of {reading?.group.name}'s rules
                </a>
              </div>
            </article>
          ) : (
            <p className="pv-lead">Nothing is waiting on you. The hour is above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
