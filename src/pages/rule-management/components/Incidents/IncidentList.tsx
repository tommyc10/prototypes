/* The incident table. `wide` adds the CI and time-open columns when there's room.
 * Escalated incidents are tinted red: those are the real ones a rule must not hide. */

import { duration, shortDate } from '../../../../lib/format';
import { RESOLUTION_LABEL } from '../../model/labels';
import type { RelatedIncident } from '../../model/types';
import './IncidentList.css';

export function IncidentList({ incidents, wide }: { incidents: RelatedIncident[]; wide: boolean }) {
  return (
    <ul className="mn-incidents" data-wide={wide || undefined}>
      {wide && (
        <li className="mn-incidents-head" aria-hidden>
          <span>ID</span>
          <span>Title</span>
          <span>CI</span>
          <span>Resolution</span>
          <span>Open for</span>
          <span>Opened</span>
        </li>
      )}
      {incidents.map((incident) => (
        <li key={incident.id} data-escalated={incident.resolution === 'escalated' || undefined}>
          <span className="mn-mono mn-subtle">{incident.id}</span>
          <span className="mn-truncate">{incident.title}</span>
          {wide && <span className="mn-mono mn-subtle mn-truncate">{incident.ci}</span>}
          <span className="mn-res" data-res={incident.resolution}>
            {RESOLUTION_LABEL[incident.resolution]}
          </span>
          {wide && <span className="mn-subtle mn-inc-date">{duration(incident.minutesOpen)}</span>}
          <span className="mn-subtle mn-inc-date">{shortDate(incident.openedAt)}</span>
        </li>
      ))}
    </ul>
  );
}
