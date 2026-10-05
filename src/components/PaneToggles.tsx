/* The two buttons that tuck away the sidebar ( [ ) and the list column ( ] ), so the
 * detail pane gets the room. They sit at the start of the detail pane's header row. */

import { List, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export function PaneToggles({
  hideSide,
  hideList,
  onToggleSide,
  onToggleList,
  listLabel = 'Rule list',
}: {
  hideSide: boolean;
  hideList: boolean;
  onToggleSide: () => void;
  onToggleList: () => void;
  /** What the list column holds on this page, for the button's label. */
  listLabel?: string;
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
        aria-label={listLabel}
        title={`${hideList ? 'Show' : 'Hide'} ${listLabel.toLowerCase()}  ]`}
      >
        <List size={15} />
      </button>
    </div>
  );
}
