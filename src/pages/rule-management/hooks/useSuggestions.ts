/* The overnight suggestions still waiting for a decision, each with what it catches and the
 * rule it would become. Tightening a threshold recomputes both. In the real app this is a
 * query for the latest refresh, plus mutations for propose and dismiss. */

import { useMemo, useState } from 'react';
import { NIGHT_START, REFRESHED_AT, SUGGESTIONS } from '../data/overnightData';
import { asRule, matchSuggestion, type Suggestion, type SuggestionMatch } from '../model/suggestions';
import type { Rule } from '../model/types';

/** A suggestion, ready to show. */
export interface Suggested {
  suggestion: Suggestion;
  threshold: number;
  match: SuggestionMatch;
  /** It in the shape of the rule it would become (see asRule). */
  rule: Rule;
}

export function useSuggestions() {
  // Proposed or dismissed: either way it has left the list.
  const [handled, setHandled] = useState<string[]>([]);
  const [thresholds, setThresholds] = useState<Record<string, number>>({});

  const open = useMemo(
    () =>
      SUGGESTIONS.filter((s) => !handled.includes(s.id)).map((suggestion): Suggested => {
        const threshold = thresholds[suggestion.id] ?? suggestion.threshold.suggested;
        const match = matchSuggestion(suggestion, threshold);
        return { suggestion, threshold, match, rule: asRule(suggestion, match, threshold, REFRESHED_AT, NIGHT_START) };
      }),
    [handled, thresholds],
  );

  return {
    open,
    handle: (id: string) => setHandled((ids) => [...ids, id]),
    restore: (id: string) => setHandled((ids) => ids.filter((handledId) => handledId !== id)),
    /** `null` puts the threshold back where the rule engine suggested it. */
    setThreshold: (s: Suggestion, value: number | null) => setThresholds((t) => ({ ...t, [s.id]: value ?? s.threshold.suggested })),
  };
}
