/* The two buttons that tuck away the sidebar ( [ ) and the rule list ( ] ), so the
 * detail pane gets the room. They sit at the start of the rule's header row. */

import { List, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function PaneToggles({
  hideSide,
  hideList,
  onToggleSide,
  onToggleList,
}: {
  hideSide: boolean;
  hideList: boolean;
  onToggleSide: () => void;
  onToggleList: () => void;
}) {
  return (
    <div className="mn-pane-toggles">
      <button
        className="mn-icon-btn"
        onClick={onToggleSide}
        aria-pressed={!hideSide}
        aria-label="Sidebar"
        title={`${hideSide ? 'Show' : 'Hide'} sidebar  [`}
      >
        {hideSide ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
      </button>
      <button
        className="mn-icon-btn"
        onClick={onToggleList}
        aria-pressed={!hideList}
        aria-label="Rule list"
        title={`${hideList ? 'Show' : 'Hide'} rule list  ]`}
      >
        <List size={15} />
      </button>
    </div>
  );
}
