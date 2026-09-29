/* Where the rules live. Components read them with `useRulesStore((s) => s.rules)`,
 * and `apply()` is the only thing that ever changes one. In the real app this becomes
 * a data-fetching query plus a mutation that calls the API. */

import { create } from 'zustand';
import { NOW } from '../../../lib/clock';
import { CURRENT_USER, RULES } from '../data/mockData';
import { ACTION_PAST, NEXT_STATUS, needsOverride } from '../model/policy';
import type { Rule, RuleAction } from '../model/types';

interface RulesState {
  rules: Rule[];
  apply: (id: string, action: RuleAction, reason: string, override: boolean) => Rule;
}

export const useRulesStore = create<RulesState>((set, get) => ({
  rules: RULES,
  apply: (id, action, reason, override) => {
    const at = NOW.toISOString();
    let updated!: Rule;
    set({
      rules: get().rules.map((r) => {
        if (r.id !== id) return r; // untouched rules stay exactly the same object
        // A new object, never an edit of the old one: that's how React notices the change.
        updated = {
          ...r,
          status: NEXT_STATUS[action],
          updatedAt: at,
          audit: [
            ...r.audit,
            {
              at,
              actor: CURRENT_USER,
              action: ACTION_PAST[action],
              reason: reason.trim(),
              override: needsOverride(r, action) ? override : undefined,
            },
          ],
        };
        return updated;
      }),
    });
    return updated;
  },
}));
