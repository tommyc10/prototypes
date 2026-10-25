/* The confirmation after a plan is started or changed. sonner handles when it appears and
 * disappears; the look is the Rules page's decision toast. */

import { Check } from 'lucide-react';
import type { MaintenancePlan } from '../../model/types';
import '../../../rule-management/components/common/DecisionToast.css';

export function PlanToast({ plan, changed }: { plan: MaintenancePlan; changed: boolean }) {
  return (
    <div className="mn-toast">
      <span className="mn-toast-icon">
        <Check size={13} strokeWidth={2.5} />
      </span>
      <div>
        <div className="mn-toast-title">
          {plan.id} {changed ? 'changed' : 'started'}
        </div>
        <div className="mn-toast-sub">Reason recorded in the audit log</div>
      </div>
    </div>
  );
}
