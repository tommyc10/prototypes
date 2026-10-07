/* The rules behind the stream, the busiest first. An active rule shows how many alerts it
 * hid; a proposed one shows how many it would, and how many of those paged someone.
 *
 * Point at a rule and its alerts light up on the chart. Press it and the feed narrows to them. */

import { ArrowUpRight } from 'lucide-react';
import { num } from '../../../../lib/format';
import type { RuleAtWork } from '../../model/types';
import './RulesAtWork.css';

export function RulesAtWork({
  rows,
  selectedId,
  onFocus,
  onSelect,
  onOpenRule,
}: {
  rows: RuleAtWork[];
  /** The rule the feed is narrowed to. */
  selectedId: string | null;
  /** Light this rule's alerts on the chart (null to stop). */
  onFocus: (ruleId: string | null) => void;
  onSelect: (ruleId: string) => void;
  onOpenRule: (ruleId: string) => void;
}) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <section className="al-rules" data-tour="al-rules">
      <h2>
        Rules at work <span className="mn-subtle">alerts that fit each rule</span>
      </h2>
      {rows.length ? (
        <ul onPointerLeave={() => onFocus(null)}>
          {rows.map(({ rule, count, paged }) => {
            const active = rule.status === 'active';
            return (
              <li key={rule.id} data-selected={rule.id === selectedId || undefined} data-status={rule.status}>
                <button
                  className="al-rule"
                  aria-pressed={rule.id === selectedId}
                  onClick={() => onSelect(rule.id)}
                  onPointerEnter={() => onFocus(rule.id)}
                  onFocus={() => onFocus(rule.id)}
                  onBlur={() => onFocus(null)}
                >
                  <span className="mn-dot" data-status={rule.status} />
                  <span className="al-rule-name mn-truncate">{rule.name}</span>
                  <span className="al-rule-count">
                    {active ? (
                      <>
                        <b>{num(count)}</b> hidden
                      </>
                    ) : (
                      <>
                        <b>{num(count)}</b> would hide
                        {paged > 0 && (
                          <span className="mn-bad">
                            {' '}
                            · {num(paged)} {paged === 1 ? 'page' : 'pages'}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                  {/* One thin bar per rule, on a shared scale. A proposed rule's is hollow, and the
                      part that paged someone is red. */}
                  <span className="al-rule-bar" aria-hidden>
                    <span style={{ width: `${((count - (active ? 0 : paged)) / max) * 100}%` }} />
                    {!active && paged > 0 && <span data-paged style={{ width: `${(paged / max) * 100}%` }} />}
                  </span>
                </button>
                <button className="mn-icon-btn" onClick={() => onOpenRule(rule.id)} aria-label={`Open ${rule.id}`} title="Open the rule">
                  <ArrowUpRight size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="al-note">No alert in this stretch fits a rule.</p>
      )}
    </section>
  );
}
