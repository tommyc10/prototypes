/* The sort menu: what to sort by, and which direction. Base UI handles opening,
 * focus and keyboard use; SortMenu.css handles the look. */

import { Menu } from '@base-ui/react/menu';
import { ArrowDownWideNarrow, Check } from 'lucide-react';
import { SORT_KEYS, SORT_LABEL, type SortDir, type SortKey } from '../../model/browse';
import './SortMenu.css';

export function SortMenu({
  sort,
  dir,
  onChange,
}: {
  sort: SortKey;
  dir: SortDir;
  onChange: (patch: { sort?: SortKey; dir?: SortDir }) => void;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger className="mn-icon-btn" aria-label={`Sort: ${SORT_LABEL[sort]}`}>
        <ArrowDownWideNarrow size={15} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end">
          <Menu.Popup className="mn-menu">
            <div className="mn-menu-label">Sort by</div>
            <Menu.RadioGroup
              value={sort}
              // Names read best A→Z; numbers and dates read best biggest/newest first.
              onValueChange={(v) => onChange({ sort: v as SortKey, dir: v === 'name' ? 'asc' : 'desc' })}
            >
              {SORT_KEYS.map((key) => (
                <Menu.RadioItem key={key} value={key} className="mn-menu-item" closeOnClick>
                  <Menu.RadioItemIndicator className="mn-menu-ind">
                    <Check size={13} />
                  </Menu.RadioItemIndicator>
                  <span>{SORT_LABEL[key]}</span>
                </Menu.RadioItem>
              ))}
            </Menu.RadioGroup>
            <Menu.Separator className="mn-menu-sep" />
            <Menu.RadioGroup value={dir} onValueChange={(v) => onChange({ dir: v as SortDir })}>
              <Menu.RadioItem value="desc" className="mn-menu-item" closeOnClick>
                <Menu.RadioItemIndicator className="mn-menu-ind">
                  <Check size={13} />
                </Menu.RadioItemIndicator>
                <span>Descending</span>
              </Menu.RadioItem>
              <Menu.RadioItem value="asc" className="mn-menu-item" closeOnClick>
                <Menu.RadioItemIndicator className="mn-menu-ind">
                  <Check size={13} />
                </Menu.RadioItemIndicator>
                <span>Ascending</span>
              </Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
