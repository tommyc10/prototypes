/* The maintenance plan form: which window it's open for, what's been filled in, and
 * submitting it. The page owns it, so its one key listener can give Esc and ⌘↵ to the form
 * while it's open (see useKeyboardShortcuts); the form itself is only the view. */

import { createElement, useState } from 'react';
import { toast } from 'sonner';
import { CURRENT_USER } from '../../rule-management/data/mockData';
import { MIN_REASON } from '../../rule-management/model/policy';
import { PlanToast } from '../components/MaintenancePlan/PlanToast';
import { applied, draftFor, draftOf, type PlanDraft } from '../model/plans';
import type { ChangeWindow, MaintenancePlan } from '../model/types';
import { usePlansStore } from './usePlansStore';

export interface PlanForm {
  /** The window the form is open for, or null when it's closed. */
  windowKey: string | null;
  draft: PlanDraft | null;
  /** The plan being changed, when it isn't a new one. */
  editing?: MaintenancePlan;
  /** Opened with the keyboard: appear at once. With the pointer: arrive. */
  via: 'key' | 'pointer';
  /** Submit was pressed, so show what's missing. */
  attempted: boolean;
  open: (w: ChangeWindow, plan: MaintenancePlan | undefined, now: number, via: 'key' | 'pointer') => void;
  close: () => void;
  change: (patch: Partial<PlanDraft>) => void;
  submit: (now: number) => void;
}

export function usePlanForm(): PlanForm {
  const save = usePlansStore((s) => s.save);
  const [state, setState] = useState<{ windowKey: string | null; draft: PlanDraft | null; editing?: MaintenancePlan; via: 'key' | 'pointer'; attempted: boolean }>({
    windowKey: null,
    draft: null,
    via: 'pointer',
    attempted: false,
  });

  return {
    ...state,
    open: (w, plan, now, via) => {
      const draft = plan ? draftOf(plan) : draftFor(w, now);
      if (draft) setState({ windowKey: w.key, draft, editing: plan, via, attempted: false });
    },
    close: () => setState({ windowKey: null, draft: null, via: 'pointer', attempted: false }),
    change: (patch) => setState((s) => (s.draft ? { ...s, draft: { ...s.draft, ...patch } } : s)),
    submit: (now) => {
      const { draft, windowKey, editing } = state;
      if (!draft || !windowKey) return;
      if (draft.reason.trim().length < MIN_REASON) return setState({ ...state, attempted: true });
      const base: MaintenancePlan = editing ?? { id: '', windowKey, cis: [], stretches: [], settle: 0, by: CURRENT_USER, reason: '', sent: {} };
      const saved = save(applied(draft, base, now, CURRENT_USER));
      toast.custom(() => createElement(PlanToast, { plan: saved, changed: !!editing }));
      setState({ windowKey: null, draft: null, via: 'pointer', attempted: false });
    },
  };
}
