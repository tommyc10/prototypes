/* The rule engine "backtesting" a rule while the decision form is open.
 * Faked with a 2.4s timer; the real app calls the backtest API here. */

import { useEffect, useState } from 'react';
import { estimateImpact } from '../model/policy';
import type { Impact, Rule } from '../model/types';

export function useBacktest(rule: Rule | null, enabled: boolean) {
  const [result, setResult] = useState<Impact | null>(null);
  useEffect(() => {
    setResult(null);
    if (!rule || !enabled) return;
    const timer = setTimeout(() => setResult(estimateImpact(rule)), 2400);
    return () => clearTimeout(timer); // cancelled if the form closes first
  }, [rule, enabled]);
  return result;
}
