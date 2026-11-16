/* Chapter four: where to spend the next hour. On the left, the places the gaps keep landing
 * (same CI, same cause), ranked, each with its last twelve weeks. On the right, the proposed
 * and inactive rules waiting on a decision, with what approving each would explain that
 * nothing else does, and the incidents it would have touched. */

import { useRef, type CSSProperties } from 'react';
import { ArrowUpRight, TriangleAlert } from 'lucide-react';
import { num, pct } from '../../../../lib/format';
import { serviceName } from '../../data/mockData';
import { useFlip } from '../../hooks/useFlip';
import { CAUSE_LABEL, dayMonth } from '../../model/labels';
import type { Focus } from '../../model/narrow';
import type { Replay } from '../../model/replay';
import { Sparkline } from '../charts/Sparkline';

const isPicked = (f: Focus | null, kind: 'gap' | 'source', id: string) => !!f && f.kind === kind && (f.kind === 'gap' ? f.key : f.kind === 'source' ? f.id : '') === id;

export function TuneNext({ r, focus, onFocus }: { r: Replay; focus: Focus | null; onFocus: (f: Focus | null) => void }) {
  const gapRef = useRef<HTMLOListElement>(null);
  const hypoRef = useRef<HTMLUListElement>(null);
  useFlip(gapRef, r.gaps.map((g) => g.key).join());
  useFlip(hypoRef, r.hypothetical.map((h) => h.id).join());
  const none = r.verdicts.none;
  const held = r.gaps.reduce((n, g) => n + g.count, 0);
  const all = r.scope.serviceId === 'all';

  return (
    <div className="ol-ch">
      <header className="ol-ch-sum ol-fade">
        <p>
          <b>{num(none)}</b> closed by hand with nothing to explain them.{' '}
          {r.gaps.length > 0 && (
            <>
              The top {num(r.gaps.length)} spots hold <b>{num(held)}</b> of them, {pct(none ? held / none : 0)}.
            </>
          )}
        </p>
      </header>

      <div className="ol-tune">
        <section className="ol-tune-col" aria-label="Gaps to cover">
          <h3 className="ol-ch-h">
            Gaps to cover <span>same CI, same cause</span>
          </h3>
          {r.gaps.length === 0 ? (
            <p className="ol-empty">Everything closed by hand here is explained or unknown. No gaps to tune.</p>
          ) : (
            <ol className="ol-gaps" ref={gapRef} style={{ '--rows': Math.ceil(r.gaps.length / 2) } as CSSProperties}>
              {r.gaps.map((g, i) => {
                const on = isPicked(focus, 'gap', g.key);
                return (
                  <li key={g.key} data-flip={g.key} className="ol-fade" style={{ '--i': i } as CSSProperties}>
                    <button className="ol-gap" data-picked={on || undefined} aria-pressed={on} onClick={() => onFocus(on ? null : { kind: 'gap', key: g.key })}>
                      <span className="ol-gap-rank">{String(i + 1).padStart(2, '0')}</span>
                      <span className="ol-gap-main">
                        <span className="ol-gap-title">
                          <code>{g.ci}</code>
                          <span className="mn-truncate">{CAUSE_LABEL[g.cause]}</span>
                        </span>
                        <span className="ol-gap-meta">
                          {all && <span className="mn-truncate">{serviceName(g.serviceId)}</span>}
                          <span>Last {dayMonth(g.lastAt)}</span>
                          {g.incidents > 0 && (
                            <span className="ol-bad">
                              {num(g.incidents)} {g.incidents === 1 ? 'incident' : 'incidents'}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="ol-gap-spark">
                        <Sparkline values={g.weekly} label={`${g.ci}, last 12 weeks`} />
                      </span>
                      <b className="ol-gap-num">{num(g.count)}</b>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="ol-tune-col" aria-label="Rules waiting on a decision">
          <h3 className="ol-ch-h">
            Rules waiting <span>proposed or inactive</span>
          </h3>
          {r.hypothetical.length === 0 ? (
            <p className="ol-empty">No proposed or inactive rules in this scope.</p>
          ) : (
            <ul className="ol-hypos" ref={hypoRef}>
              {r.hypothetical.map((h, i) => {
                const on = isPicked(focus, 'source', h.id);
                return (
                  <li key={h.id} data-flip={h.id} className="ol-hypo ol-fade" data-picked={on || undefined} style={{ '--i': i } as CSSProperties}>
                    <button className="ol-hypo-main" aria-pressed={on} onClick={() => onFocus(on ? null : { kind: 'source', id: h.id })}>
                      <span className="ol-hypo-top">
                        <span className="ol-status" data-status={h.status}>
                          {h.status === 'proposed' ? 'Proposed' : 'Inactive'}
                        </span>
                        <code>{h.id}</code>
                      </span>
                      <span className="ol-hypo-name">{h.name}</span>
                      <span className="ol-hypo-figs">
                        <span>
                          <b>+{num(h.only)}</b> explained
                        </span>
                        <span>
                          <b>{num(h.matches)}</b> would match
                        </span>
                      </span>
                      {h.incidents > 0 && (
                        <span className="ol-hypo-warn">
                          <TriangleAlert size={12} aria-hidden />
                          Would have touched {num(h.incidents)} {h.incidents === 1 ? 'incident' : 'incidents'}
                        </span>
                      )}
                    </button>
                    <a className="mn-icon-btn ol-hypo-link" href={`#/rules/${h.id}`} aria-label={`Decide ${h.id} in Rules`} title="Decide in Rules">
                      <ArrowUpRight size={14} />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
