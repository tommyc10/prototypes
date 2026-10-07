/* The group filter, next to the page title: a button that opens a searchable list of every
 * group. It lives here, not in the sidebar, because a real estate has hundreds of groups.
 * You find one by typing, and the ones that need you are listed first.
 *
 * Base UI handles opening, placement and focus; cmdk handles the search and the arrow keys. */

import { useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { Command } from 'cmdk';
import { Check, ChevronDown, Pin as PinIcon, Search, X } from 'lucide-react';
import { MAX_PINS, samePin, type Pin } from '../../hooks/usePinnedGroups';
import { GROUP_BYS, GROUP_BY_LABEL, rankedGroups, scopeName, type GroupBy, type ViewState } from '../../model/browse';
import type { Rule } from '../../model/types';
import './GroupPicker.css';

export function GroupPicker({
  rules,
  view,
  update,
  pins,
  onTogglePin,
}: {
  rules: Rule[];
  view: ViewState;
  update: (patch: Partial<ViewState>) => void;
  pins: Pin[];
  onTogglePin: (pin: Pin) => void;
}) {
  const [open, setOpen] = useState(false);
  // The tab you're browsing. Nothing changes in the list until you pick a group from it.
  const [by, setBy] = useState<GroupBy>(view.groupBy);
  const [query, setQuery] = useState('');
  const filtered = view.groupId !== 'all';

  const pick = (groupId: string) => {
    update({ groupBy: by, groupId });
    setOpen(false);
  };

  return (
    <div className="mn-gp" data-tour="groups">
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          // Open on the tab the list is using, with an empty search.
          if (next) {
            setBy(view.groupBy);
            setQuery('');
          }
          setOpen(next);
        }}
      >
        <Popover.Trigger className="mn-gp-trigger" data-filtered={filtered || undefined}>
          <span className="mn-truncate">{scopeName(view)}</span>
          <ChevronDown size={13} />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={6} align="start">
            {/* data-own-keys: the page's shortcuts leave this popup's keys alone. */}
            <Popover.Popup className="mn-menu mn-gp-popup" data-own-keys aria-label="Filter by group">
              <Command
                label="Groups"
                // Every word must appear somewhere in the name, not just at the start.
                filter={(value, search) =>
                  search
                    .toLowerCase()
                    .split(/\s+/)
                    .every((word) => value.toLowerCase().includes(word))
                    ? 1
                    : 0
                }
              >
                <div className="mn-tabs mn-gp-by" role="group" aria-label="Kind of group">
                  {GROUP_BYS.map((kind) => (
                    <button
                      key={kind}
                      className="mn-tab"
                      aria-pressed={by === kind}
                      data-active={by === kind || undefined}
                      // Keep the keyboard in the search box, so you can click a tab and carry on typing.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setBy(kind);
                        setQuery('');
                      }}
                    >
                      {GROUP_BY_LABEL[kind].tab}
                    </button>
                  ))}
                </div>
                <div className="mn-gp-search">
                  <Search size={14} />
                  <Command.Input autoFocus value={query} onValueChange={setQuery} placeholder={`Find ${GROUP_BY_LABEL[by].one}`} />
                </div>
                <Command.List className="mn-gp-list">
                  <Command.Empty className="mn-gp-empty">No groups match</Command.Empty>
                  <Command.Item value="All groups" onSelect={() => pick('all')}>
                    <span className="mn-gp-check">{view.groupBy === by && !filtered && <Check size={13} />}</span>
                    <span className="mn-gp-name">All groups</span>
                    <span className="mn-count">{rules.length}</span>
                  </Command.Item>
                  {rankedGroups(rules, by).map(({ group, total, proposed }) => {
                    const pin = { by, id: group.id };
                    const pinned = pins.some((p) => samePin(p, pin));
                    return (
                      <Command.Item key={group.id} value={group.search} onSelect={() => pick(group.id)}>
                        <span className="mn-gp-check">
                          {view.groupBy === by && view.groupId === group.id && <Check size={13} />}
                        </span>
                        <span className="mn-gp-name">{group.name}</span>
                        {proposed > 0 && (
                          <span className="mn-gp-waiting">
                            <span className="mn-dot" data-status="proposed" />
                            {proposed} waiting
                          </span>
                        )}
                        <span className="mn-count">{total}</span>
                        <button
                          className="mn-icon-btn mn-gp-pin"
                          aria-pressed={pinned}
                          aria-label={pinned ? `Unpin ${group.name}` : `Pin ${group.name} to the sidebar`}
                          title={pinned ? 'Unpin from the sidebar' : 'Pin to the sidebar'}
                          onMouseDown={(e) => e.preventDefault()}
                          // Pinning isn't picking: keep the click from selecting the row.
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(pin);
                          }}
                        >
                          <PinIcon size={13} />
                        </button>
                      </Command.Item>
                    );
                  })}
                </Command.List>
                <div className="mn-gp-foot">
                  Waiting on a decision first, then the busiest. Pin up to {MAX_PINS} to keep them in the sidebar.
                </div>
              </Command>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {filtered && (
        <button className="mn-icon-btn mn-gp-clear" onClick={() => update({ groupId: 'all' })} aria-label="Show all groups" title="Show all groups">
          <X size={13} />
        </button>
      )}
    </div>
  );
}
