/* Member or admin: a segmented control, and a sentence saying what the choice means. */

import { ROLE_LABEL } from '../../model/people';
import type { Role } from '../../model/types';

const MEANS: Record<Role, string> = {
  member: 'Sees what’s ticked below, and nothing else.',
  admin: 'Sees what’s ticked below, and can also invite people and change anyone’s access.',
};

export function RoleControl({ role, onRole, disabled }: { role: Role; onRole: (role: Role) => void; disabled?: boolean }) {
  return (
    <div className="ac-role">
      <div className="mn-tabs ac-segmented" role="radiogroup" aria-label="Role">
        {(['member', 'admin'] as const).map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={role === r}
            className="mn-tab"
            data-active={role === r || undefined}
            onClick={() => onRole(r)}
            disabled={disabled}
          >
            {ROLE_LABEL[r]}
          </button>
        ))}
      </div>
      <span className="ac-role-means">{MEANS[role]}</span>
    </div>
  );
}
