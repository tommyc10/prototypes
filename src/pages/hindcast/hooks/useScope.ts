/* The scope the hindcast and forecast share: which service, how many weeks back and, for the
 * forecast, how many ahead. It's remembered for the session, so moving between the two pages
 * keeps their figures on the same footing. A scope named in the address wins. */

import { useEffect, useState } from 'react';
import { SERVICES } from '../data/mockData';
import { DEFAULT_HORIZON, DEFAULT_LOOKBACK, HORIZONS, LOOKBACKS } from '../model/labels';
import type { Horizon, Lookback } from '../model/types';

export interface AnalysisScope {
  serviceId: string;
  weeks: Lookback;
  horizon: Horizon;
}

const KEY = 'mn-analysis-scope';

export const isService = (id?: string) => id === 'all' || SERVICES.some((s) => s.id === id);
const asWeeks = (v?: unknown) => LOOKBACKS.find((w) => String(w) === String(v));
const asHorizon = (v?: unknown) => HORIZONS.find((h) => String(h) === String(v));

/** A pattern id named at the end of an address (…/PAT-04): the card to ring on arrival. */
export const asPattern = (part?: string) => (part && /^PAT-\d+$/.test(part) ? part : null);

function remembered(): AnalysisScope {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) ?? '{}');
    return {
      serviceId: isService(saved.serviceId) ? saved.serviceId : 'all',
      weeks: asWeeks(saved.weeks) ?? DEFAULT_LOOKBACK,
      horizon: asHorizon(saved.horizon) ?? DEFAULT_HORIZON,
    };
  } catch {
    return { serviceId: 'all', weeks: DEFAULT_LOOKBACK, horizon: DEFAULT_HORIZON };
  }
}

export function useScope(address: { serviceId?: string; weeks?: string; horizon?: string }) {
  const [scope, setScope] = useState<AnalysisScope>(() => {
    const saved = remembered();
    return {
      serviceId: isService(address.serviceId) ? address.serviceId! : saved.serviceId,
      weeks: asWeeks(address.weeks) ?? saved.weeks,
      horizon: asHorizon(address.horizon) ?? saved.horizon,
    };
  });
  useEffect(() => sessionStorage.setItem(KEY, JSON.stringify(scope)), [scope]);
  const update = (patch: Partial<AnalysisScope>) => setScope((s) => ({ ...s, ...patch }));
  return [scope, update] as const;
}
