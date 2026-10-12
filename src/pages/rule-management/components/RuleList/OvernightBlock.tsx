/* What last night's refresh found, pinned above the rules: one row per pattern no rule covers
 * yet. The bar under the heading is last night's incidents; each lit segment is one pattern's
 * share of them. A light travels round its edge while it is there, and the block goes away
 * once every suggestion is proposed or dismissed. */

import { ChevronDown } from 'lucide-react';
import { pct } from '../../../../lib/format';
import { groupById } from '../../data/mockData';
import type { Suggested } from '../../hooks/useSuggestions';
import { isLowConfidence } from '../../model/policy';
import './OvernightBlock.css';

export function OvernightBlock({
  items,
  total,
  collapsed,
  leaving,
  onToggle,
  selectedId,
  onSelect,
}: {
  items: Suggested[];
  /** Every incident that came in overnight, for the bar. */
  total: number;
  collapsed: boolean;
  /** Its last suggestion has just been dealt with: it is fading out, and no longer takes clicks. */
  leaving?: boolean;
  onToggle: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const inPatterns = items.reduce((n, item) => n + item.match.matched.length, 0);

  return (
    <div className="mn-overnight" data-collapsed={collapsed || undefined} data-leaving={leaving || undefined} inert={leaving} data-tour="overnight">
      {/* A light keeps travelling round the block for as long as something in it is waiting. */}
      <span className="mn-beam" data-active aria-hidden />
      <button className="mn-overnight-head" aria-expanded={!collapsed} onClick={onToggle}>
        <ChevronDown size={13} />
        <span className="mn-overnight-title">
          Found overnight <b>{items.length}</b>
        </span>
        <span className="mn-overnight-sum">
          {inPatterns} of {total} incidents
        </span>
        <kbd>O</kbd>
      </button>

      <div className="mn-overnight-share" aria-hidden>
        {items.map(({ suggestion, match }) => (
          <span key={suggestion.id} data-on={suggestion.id === selectedId || undefined} style={{ flexGrow: match.matched.length }} />
        ))}
        <span data-rest style={{ flexGrow: Math.max(0, total - inPatterns) }} />
      </div>

      {!collapsed &&
        items.map(({ suggestion, match, rule }) => {
          const real = match.real.length;
          return (
            <div
              key={suggestion.id}
              role="option"
              aria-selected={suggestion.id === selectedId}
              className="mn-row"
              data-selected={suggestion.id === selectedId || undefined}
              onClick={() => onSelect(suggestion.id)}
            >
              <span className="mn-dot" data-status="suggested" aria-label="Suggested" />
              <div className="mn-row-main">
                <div className="mn-row-name">{suggestion.name}</div>
                <div className="mn-row-meta">
                  {real > 0 ? (
                    <span className="mn-bad">
                      Hides {real} that needed a person
                    </span>
                  ) : (
                    <span>{groupById(suggestion.groupId).name}</span>
                  )}
                </div>
              </div>
              <div className="mn-row-side">
                <span className="mn-row-conf" data-low={isLowConfidence(rule) || undefined}>
                  {pct(suggestion.confidence)}
                </span>
                <span className="mn-subtle">{match.matched.length} inc</span>
              </div>
            </div>
          );
        })}
    </div>
  );
}
