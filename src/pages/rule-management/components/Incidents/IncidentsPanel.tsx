/* The incident browser as a panel that slides in over the detail pane ("View all").
 * It keeps the action buttons in its header, so the decision is always one click away. */

import type { RefObject } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { RelatedIncident, Rule, RuleAction } from '../../model/types';
import { ActionButtons } from '../common/ActionButtons';
import { IncidentBrowser } from './IncidentBrowser';
import './IncidentsPanel.css';

export function IncidentsPanel({
  rule,
  wide,
  searchRef,
  onAction,
  onOpenIncident,
  onClose,
}: {
  rule: Rule;
  wide: boolean;
  searchRef: RefObject<HTMLInputElement | null>;
  onAction: (action: RuleAction) => void;
  onOpenIncident: (incident: RelatedIncident) => void;
  onClose: () => void;
}) {
  return (
    <section className="mn-inc-panel" aria-label={`Incidents matched by ${rule.id}`}>
      <header className="mn-inc-head">
        <button className="mn-icon-btn" onClick={onClose} aria-label="Back to rule" title="Back (Esc)">
          <ArrowLeft size={15} />
        </button>
        <div className="mn-inc-title">
          <div>
            Incidents matched <span className="mn-subtle">{rule.incidentCount}</span>
          </div>
          <div className="mn-subtle mn-truncate">
            {rule.id} · {rule.name}
          </div>
        </div>
        <div className="mn-inc-actions">
          <ActionButtons rule={rule} onAction={onAction} />
        </div>
      </header>
      <IncidentBrowser rule={rule} wide={wide} pageSize={50} searchRef={searchRef} autoFocus onOpen={onOpenIncident} />
    </section>
  );
}
