/* What someone can see: every stream as a card, its sub-streams inside it, and each
 * sub-stream's assignment groups as chips you tick on and off.
 *
 * A stream or sub-stream's box ticks the whole of it; a chip ticks one group. A box half
 * filled means some of what's inside is ticked. Against what's saved, a chip you've just
 * added carries a dot and one you've just taken away is struck through, so the change bar's
 * sentence can be checked against the page before it's saved.
 *
 * The search finds any part by name and opens what holds it; ↵ ticks the top match, so
 * someone who knows the group they want never has to look for it. "Same as" copies another
 * person's access, the quickest start for a new joiner on an existing team.
 *
 * The keys inside (the search's ↵ and Esc) are its own: data-own-keys tells the page. */

import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { Popover } from '@base-ui/react/popover';
import { Command } from 'cmdk';
import { Check, ChevronRight, Copy, Minus, Plus, Search, X } from 'lucide-react';
import { STREAMS } from '../../data/mockData';
import { initials } from '../../model/people';
import { coveredGroups, grant, groupsIn, nameMatches, plural, searchTree, tickOf, toggle, type Tick } from '../../model/scopes';
import type { Person, Scope } from '../../model/types';
import '../../../rule-management/components/RuleList/SortMenu.css';
import './ScopePicker.css';

/** How long a ticked branch's chips take to follow it, one after another. */
const CASCADE_MS = 420;

export function ScopePicker({
  grants,
  saved,
  onChange,
  people,
  disabled,
}: {
  grants: string[];
  /** What's saved, to mark what the draft changes. A new invitation has nothing saved. */
  saved?: string[];
  onChange: (grants: string[]) => void;
  /** Whose access can be copied ("Same as"). */
  people: Person[];
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  // Open: the streams with some of their parts ticked, so what's chosen is in view.
  const [open, setOpen] = useState(() => new Set(STREAMS.filter((s) => tickOf(s, grants) === 'mixed').map((s) => s.id)));
  // A branch ticked with the pointer: its chips follow it in a short wave, so it's clear what the
  // box just covered. From the keyboard they change at once.
  const [cascade, setCascade] = useState<string | null>(null);
  const cascadeTimer = useRef<number>(undefined);
  useEffect(() => () => clearTimeout(cascadeTimer.current), []);

  const now = useMemo(() => coveredGroups(grants), [grants]);
  const was = useMemo(() => (saved ? coveredGroups(saved) : null), [saved]);
  const search = useMemo(() => (query.trim() ? searchTree(query) : null), [query]);
  const top = search?.hits[0];

  const change = (next: string[], e?: MouseEvent, branch?: string) => {
    clearTimeout(cascadeTimer.current);
    // e.detail is 0 when a key pressed the button.
    setCascade(e && e.detail > 0 && branch ? branch : null);
    if (branch) cascadeTimer.current = window.setTimeout(() => setCascade(null), CASCADE_MS);
    onChange(next);
  };

  const flip = (node: Scope, e: MouseEvent) => change(toggle(grants, node.id), e, node.children.length ? node.id : undefined);

  // Opened with the pointer, a stream's parts settle in; opened from the keyboard, they're simply there.
  const [openedBy, setOpenedBy] = useState<'key' | 'pointer'>('key');
  const setStreamOpen = (id: string, to: boolean, e: MouseEvent) => {
    setOpenedBy(e.detail > 0 ? 'pointer' : 'key');
    setOpen((all) => {
      const next = new Set(all);
      if (to) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const allOpen = STREAMS.every((s) => open.has(s.id));

  return (
    <section className="ac-pick" data-own-keys aria-label="What they can see">
      <div className="ac-pick-bar">
        <label className="mn-search ac-pick-search">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a stream, sub-stream or group"
            aria-label="Find a stream, sub-stream or assignment group"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && top) {
                e.preventDefault();
                change(tickOf(top, grants) === 'on' ? toggle(grants, top.id) : grant(grants, top.id));
              } else if (e.key === 'Escape') {
                e.preventDefault();
                if (query) setQuery('');
                else e.currentTarget.blur();
              }
            }}
          />
          {top && (
            <span className="ac-pick-hint mn-truncate">
              <kbd>↵</kbd> {tickOf(top, grants) === 'on' ? 'removes' : 'adds'} <b>{top.name}</b>
            </span>
          )}
          {query && (
            <button type="button" className="mn-icon-btn ac-pick-clear" onClick={() => setQuery('')} aria-label="Clear the search">
              <X size={13} />
            </button>
          )}
        </label>
        <SameAs people={people} disabled={disabled} onPick={(p) => change(p.grants)} />
        {!search && (
          <button
            type="button"
            className="mn-link ac-pick-all"
            onClick={(e) => {
              setOpenedBy(e.detail > 0 ? 'pointer' : 'key');
              setOpen(allOpen ? new Set() : new Set(STREAMS.map((s) => s.id)));
            }}
          >
            {allOpen ? 'Close all' : 'Open all'}
          </button>
        )}
      </div>

      <div className="ac-streams">
        {STREAMS.filter((s) => !search || search.shown.has(s.id)).map((stream) => {
          const tick = tickOf(stream, grants);
          const all = groupsIn(stream);
          const seen = all.filter((g) => now.has(g.id)).length;
          const changed = !!was && all.some((g) => was.has(g.id) !== now.has(g.id));
          const isOpen = !!search || open.has(stream.id);
          const bodyId = `ac-stream-${stream.id}`;
          let chipIndex = 0;
          return (
            <div key={stream.id} className="ac-stream" data-open={isOpen || undefined} data-tick={tick}>
              <div className="ac-stream-head">
                <button
                  type="button"
                  className="mn-icon-btn ac-chev"
                  aria-expanded={isOpen}
                  aria-controls={bodyId}
                  aria-label={`${isOpen ? 'Close' : 'Open'} ${stream.name}`}
                  onClick={(e) => setStreamOpen(stream.id, !open.has(stream.id), e)}
                  disabled={!!search}
                >
                  <ChevronRight size={14} />
                </button>
                <Tickbox tick={tick} onClick={(e) => flip(stream, e)} disabled={disabled} className="ac-stream-tick">
                  <Highlight text={stream.name} query={query} />
                </Tickbox>
                {changed && <span className="ac-changed" title="Changed, not saved yet" />}
                {/* The rest of the row opens it too; the chevron is the way in for the keyboard. */}
                <div className="ac-stream-meta" onClick={(e) => !search && setStreamOpen(stream.id, !open.has(stream.id), e)}>
                  <span>{tick === 'on' ? `Whole stream · ${plural(all.length, 'group')}` : tick === 'mixed' ? `${seen} of ${plural(all.length, 'group')}` : plural(all.length, 'group')}</span>
                  <span className="ac-meter">
                    <i style={{ transform: `scaleX(${seen / all.length})` }} />
                  </span>
                </div>
              </div>

              {isOpen && (
                <div className="ac-stream-body" id={bodyId} data-animate={openedBy === 'pointer' || undefined}>
                  {stream.children
                    .filter((sub) => !search || search.shown.has(sub.id))
                    .map((sub) => {
                      const subTick = tickOf(sub, grants);
                      const groups = sub.children.filter((g) => !search || search.shown.has(g.id));
                      const subSeen = sub.children.filter((g) => now.has(g.id)).length;
                      const wave = cascade === sub.id || cascade === stream.id;
                      return (
                        <div key={sub.id} className="ac-sub" data-cascade={wave || undefined}>
                          <div className="ac-sub-head">
                            <Tickbox tick={subTick} onClick={(e) => flip(sub, e)} disabled={disabled}>
                              <Highlight text={sub.name} query={query} />
                            </Tickbox>
                            <span className="ac-sub-meta">
                              {subTick === 'on' ? `All ${sub.children.length}` : subTick === 'mixed' ? `${subSeen} of ${sub.children.length}` : plural(sub.children.length, 'group')}
                            </span>
                          </div>
                          <div className="ac-chips" role="group" aria-label={`Assignment groups in ${sub.name}`}>
                            {groups.map((g) => {
                              const on = now.has(g.id);
                              const mark = was ? (on && !was.has(g.id) ? 'added' : !on && was.has(g.id) ? 'removed' : undefined) : undefined;
                              return (
                                <button
                                  key={g.id}
                                  type="button"
                                  role="checkbox"
                                  aria-checked={on}
                                  className="ac-chip"
                                  data-on={on || undefined}
                                  data-change={mark}
                                  style={{ '--i': wave ? chipIndex++ : 0 } as CSSProperties}
                                  onClick={(e) => flip(g, e)}
                                  disabled={disabled}
                                  title={mark === 'added' ? 'Added, not saved yet' : mark === 'removed' ? 'Removed, not saved yet' : undefined}
                                >
                                  <span className="ac-chip-icon" aria-hidden>
                                    <Plus size={12} strokeWidth={2.25} />
                                    <Check size={12} strokeWidth={2.5} />
                                  </span>
                                  <Highlight text={g.name} query={query} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
        {search && !search.hits.length && (
          <div className="mn-empty ac-pick-empty">
            Nothing is called “{query.trim()}”. Try the name of a stream, sub-stream or assignment group.
          </div>
        )}
      </div>

      <p className="ac-pick-foot">A ticked stream or sub-stream also covers anything added to it later.</p>
    </section>
  );
}

/** A checkbox with its label inside it, so the whole name is the target. Half filled when mixed. */
function Tickbox({
  tick,
  onClick,
  disabled,
  className,
  children,
}: {
  tick: Tick;
  onClick: (e: MouseEvent) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={tick === 'on' ? true : tick === 'mixed' ? 'mixed' : false}
      className={`ac-tick ${className ?? ''}`}
      data-tick={tick}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="ac-box" aria-hidden>
        <Check size={11} strokeWidth={3} />
        <Minus size={11} strokeWidth={3} />
      </span>
      <span className="ac-tick-label mn-truncate">{children}</span>
    </button>
  );
}

/** The words of the search, marked where they appear in a name. */
function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length || !nameMatches(text, query)) return <>{text}</>;
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return (
    <>
      {text.split(pattern).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}
    </>
  );
}

/** Copy someone else's access: the quickest start for someone joining an existing team. */
function SameAs({ people, onPick, disabled }: { people: Person[]; onPick: (person: Person) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="mn-btn mn-btn-ghost ac-same" disabled={disabled}>
        <Copy size={14} />
        Same as…
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="end">
          <Popover.Popup className="mn-menu ac-same-popup" data-own-keys aria-label="Copy someone's access">
            <Command label="People" filter={(value, search) => (nameMatches(value, search) ? 1 : 0)}>
              <div className="ac-same-search">
                <Search size={14} />
                <Command.Input autoFocus placeholder="Copy whose access?" />
              </div>
              <Command.List className="ac-same-list">
                <Command.Empty className="ac-same-empty">Nobody by that name</Command.Empty>
                {people.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`${p.name} ${p.email}`}
                    onSelect={() => {
                      onPick(p);
                      setOpen(false);
                    }}
                  >
                    <span className="mn-avatar ac-same-avatar" aria-hidden>
                      {initials(p.name)}
                    </span>
                    <span className="mn-truncate ac-same-name">{p.name}</span>
                    <span className="ac-same-count">{plural(coveredGroups(p.grants).size, 'group')}</span>
                  </Command.Item>
                ))}
              </Command.List>
              <div className="ac-same-foot">Replaces what’s ticked here. Nothing is saved until you save.</div>
            </Command>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
