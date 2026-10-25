/* Where the maintenance plans live, one per run of a window (keyed by ChangeWindow.key), so
 * they stay put while you move between pages. In the real app this becomes a data-fetching
 * query plus mutations that call the API. */

import { create } from 'zustand';
import { PLANS } from '../data/planData';
import { endedNow, extended } from '../model/plans';
import type { MaintenancePlan } from '../model/types';

interface PlansState {
  plans: Record<string, MaintenancePlan>;
  /** Start a plan, or save a change to one. A new plan is given its number here. */
  save: (plan: MaintenancePlan) => MaintenancePlan;
  /** End a plan now. Held tickets still get their settle time. */
  end: (windowKey: string, now: number) => void;
  /** Drop a plan that hasn't started. */
  cancel: (windowKey: string) => void;
  /** Another hour for a plan the work has outrun. */
  extend: (windowKey: string, now: number, by: number) => void;
  /** Send a held ticket to the queue now. */
  send: (windowKey: string, ticketId: string, now: number) => void;
}

let last = 412;

export const usePlansStore = create<PlansState>((set, get) => {
  const change = (key: string, fn: (p: MaintenancePlan) => MaintenancePlan) => set({ plans: { ...get().plans, [key]: fn(get().plans[key]) } });
  return {
    plans: Object.fromEntries(PLANS.map((p) => [p.windowKey, p])),
    save: (plan) => {
      const saved = plan.id ? plan : { ...plan, id: `MNT-0${++last}` };
      set({ plans: { ...get().plans, [saved.windowKey]: saved } });
      return saved;
    },
    end: (key, now) => change(key, (p) => endedNow(p, now)),
    cancel: (key) => {
      const plans = { ...get().plans };
      delete plans[key];
      set({ plans });
    },
    extend: (key, now, by) => change(key, (p) => extended(p, now, by)),
    send: (key, ticketId, now) => change(key, (p) => ({ ...p, sent: { ...p.sent, [ticketId]: now } })),
  };
});
