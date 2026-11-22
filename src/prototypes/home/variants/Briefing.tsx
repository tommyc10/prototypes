/* Briefing: the hour as a handover note. One column of words, everything waiting listed in
 * full, and each group as a line in a quiet table. No picture at all. */

import { num } from '../../../lib/format';
import { clockFace, dayFace, plural, TONE_COLOR } from '../../../pages/home/model/station';
import { CURRENT_USER } from '../../../pages/rule-management/data/mockData';
import { firstOf, greeting, groupTag, queueSentence, useCursor, type VariantProps } from '../shared';

export function Briefing({ data }: VariantProps) {
  const { counts, queue, groups, now } = data;
  const { index, setAt } = useCursor(queue);
  const busiest = groups[0];

  return (
    <div className="pv-scroll">
      <article className="pv-brief pv-arrive">
        <header>
          <p className="pv-meta">
            {dayFace(now)} <span className="mn-mono">{clockFace(now)}</span>
          </p>
          <h1 className="pv-title">{greeting(now, CURRENT_USER)}</h1>
        </header>

        <p className="pv-lead">
          <b>{num(counts.paged)}</b> {counts.paged === 1 ? 'alert' : 'alerts'} reached a person in the last hour, out of <b>{num(counts.total)}</b>. Rules hid{' '}
          <b>{num(counts.hidden)}</b>, and <b>{num(counts.folded)}</b> joined incidents that were already open.
          {busiest && busiest.paged > 0 && (
            <>
              {' '}
              <b>{busiest.group.name}</b> sent the most, with {plural(busiest.paged, 'page')}.
            </>
          )}
        </p>

        <section>
          <h2 className="pv-section">Waiting on you</h2>
          <p className="pv-sub">{queueSentence(queue)}</p>
          <ol className="pv-brief-queue">
            {queue.map((need, i) => (
              <li key={need.key}>
                <a className="pv-row" href={need.href} data-selected={i === index || undefined} onMouseEnter={() => setAt(i)}>
                  <span className="pv-brief-n mn-mono">{String(i + 1).padStart(2, '0')}</span>
                  <i className="pv-dot" style={{ background: TONE_COLOR[need.tone] }} aria-hidden />
                  <span className="pv-row-main">
                    <span className="pv-row-title">
                      {need.title} <span className="pv-kind">{need.kind}</span>
                    </span>
                    <span className="pv-row-why">{need.why}</span>
                  </span>
                  {i === index && <kbd>↵</kbd>}
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="pv-section">Every group this hour</h2>
          <table className="pv-table">
            <thead>
              <tr>
                <th>Group</th>
                <th>Pages</th>
                <th>Alerts</th>
                <th>Hidden</th>
                <th>Waiting</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const tag = groupTag(g);
                const first = firstOf(queue, g.group.id);
                return (
                  <tr key={g.group.id} data-quiet={g.paged === 0 || undefined} onClick={() => first >= 0 && setAt(first)}>
                    <td>
                      <span className="pv-table-name">{g.group.name}</span> <span className="pv-kind">{g.group.unit}</span>
                    </td>
                    <td>{num(g.paged)}</td>
                    <td>{num(g.total)}</td>
                    <td>{num(g.hidden)}</td>
                    <td className="pv-table-tag">
                      {tag.tone && <i className="pv-dot" style={{ background: TONE_COLOR[tag.tone] }} aria-hidden />}
                      {tag.label}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <footer className="pv-keys">
          <span>
            <kbd>J</kbd> <kbd>K</kbd> Next thing
          </span>
          <span>
            <kbd>↵</kbd> Open it
          </span>
        </footer>
      </article>
    </div>
  );
}
