import { useEffect, useMemo, useRef, useState } from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { Command } from 'cmdk';
import { toast } from 'sonner';
import { ThinkingOrb } from 'thinking-orbs';
import { Bell, Database, Filter, ScrollText, Settings, Siren } from 'lucide-react';
import { GROUPS, RESOLUTION_LABEL, SOURCE_LABEL, groupById, type Rule } from '../shared/data';
import {
  ACTION_LABEL,
  ACTION_PAST,
  LOW_CONFIDENCE,
  MIN_REASON,
  SORT_LABEL,
  actionsFor,
  ago,
  isLowConfidence,
  needsOverride,
  pct,
  shortDate,
  statusLabel,
  turnsOn,
  useBacktest,
  useFreshRules,
  useRuleView,
  type RuleAction,
  type SortKey,
  type StatusFilter,
} from '../shared/store';
import { WeeklyBars, useDecision } from '../shared/ui';
import './console.css';

const STATUS_CYCLE: StatusFilter[] = ['all', 'proposed', 'active', 'inactive'];
const SORT_CYCLE: SortKey[] = ['updated', 'confidence', 'purity', 'incidents', 'name'];
const ACTION_KEY: Record<RuleAction, string> = { approve: 'a', reject: 'x', activate: 'e', deactivate: 'd' };
const GLYPH = { active: '●', proposed: '◐', inactive: '○' } as const;

function Bar({ value, cells = 10 }: { value: number; cells?: number }) {
  const on = Math.round(value * cells);
  return (
    <span className="cs-bar" aria-hidden>
      <span className="cs-bar-on">{'▮'.repeat(on)}</span>
      <span className="cs-bar-off">{'▮'.repeat(cells - on)}</span>
    </span>
  );
}

export function Console() {
  const rules = useFreshRules();
  const { view, update, visible, counts } = useRuleView(rules);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [palette, setPalette] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const decision = useDecision((rule, action) => {
    toast.custom(() => (
      <div className="cs-toast">
        <span className="cs-ok">✓</span> {rule.id} {ACTION_PAST[action]} <span className="cs-dim">· written to audit log</span>
      </div>
    ));
  });

  const selected = rules.find((r) => r.id === selectedId) ?? null;

  // Keep a selection inside the visible list.
  useEffect(() => {
    if (!visible.length) return setSelectedId(null);
    if (!selectedId || !visible.some((r) => r.id === selectedId)) setSelectedId(visible[0].id);
  }, [visible, selectedId]);

  useEffect(() => {
    listRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  const move = (d: number) => {
    const i = visible.findIndex((r) => r.id === selectedId);
    const next = visible[Math.min(visible.length - 1, Math.max(0, i + d))];
    if (next) setSelectedId(next.id);
  };

  const act = (action: RuleAction) => {
    if (selected && actionsFor(selected).includes(action)) decision.open(selected, action);
  };

  // Keyboard map. Captured on window so it runs before the harness; handled keys are marked.
  const stateRef = useRef({ palette, composer: !!decision.target, move, act, view });
  stateRef.current = { palette, composer: !!decision.target, move, act, view };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
        return;
      }
      if (s.palette) return;
      const t = e.target as HTMLElement;
      const typing = /^(INPUT|TEXTAREA)$/.test(t.tagName) || t.isContentEditable;
      if (s.composer) {
        if (e.key === 'Escape') {
          e.preventDefault();
          decision.close();
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          decision.submit();
        }
        return;
      }
      if (typing) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'ArrowDown') {
          e.preventDefault();
          t.blur();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const handled = () => e.preventDefault();
      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          handled();
          s.move(1);
          break;
        case 'k':
        case 'ArrowUp':
          handled();
          s.move(-1);
          break;
        case '/':
          handled();
          searchRef.current?.focus();
          break;
        case 'f':
          handled();
          update({ status: STATUS_CYCLE[(STATUS_CYCLE.indexOf(s.view.status) + 1) % STATUS_CYCLE.length] });
          break;
        case 's':
          handled();
          update({ sort: SORT_CYCLE[(SORT_CYCLE.indexOf(s.view.sort) + 1) % SORT_CYCLE.length] });
          break;
        case 'S':
          handled();
          update({ dir: s.view.dir === 'asc' ? 'desc' : 'asc' });
          break;
        case 'a':
          handled();
          s.act('approve');
          break;
        case 'x':
          handled();
          s.act('reject');
          break;
        case 'e':
          handled();
          s.act('activate');
          break;
        case 'd':
          handled();
          s.act('deactivate');
          break;
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [decision, update]);

  return (
    <Tooltip.Provider delay={400}>
      <div className="cs">
        <nav className="cs-rail">
          <div className="cs-logo" aria-label="Imperial Ops">⌬</div>
          {[
            { icon: Siren, label: 'Incidents' },
            { icon: Bell, label: 'Alerts' },
            { icon: Filter, label: 'Rules', active: true },
            { icon: Database, label: 'CMDB' },
            { icon: ScrollText, label: 'Audit log' },
          ].map(({ icon: Icon, label, active }) => (
            <RailButton key={label} label={label} active={active}>
              <Icon size={16} strokeWidth={1.75} />
            </RailButton>
          ))}
          <div className="cs-rail-spacer" />
          <RailButton label="Settings">
            <Settings size={16} strokeWidth={1.75} />
          </RailButton>
          <div className="cs-me" title="Admiral Piett">AP</div>
        </nav>

        <section className="cs-list">
          <header className="cs-list-head">
            <div className="cs-title-row">
              <span className="cs-title">rules</span>
              <span className="cs-dim">
                {view.groupId === 'all' ? 'all groups' : groupById(view.groupId).name.toLowerCase()}
              </span>
              <button className="cs-kbd-btn" onClick={() => setPalette(true)}>
                <kbd>⌘K</kbd>
              </button>
            </div>
            <label className="cs-prompt">
              <span className="cs-accent">/</span>
              <input
                ref={searchRef}
                value={view.query}
                onChange={(e) => update({ query: e.target.value })}
                placeholder="search rules, ci, source"
                spellCheck={false}
              />
            </label>
            <div className="cs-filters">
              {STATUS_CYCLE.map((s) => (
                <button key={s} className="cs-chip" data-active={view.status === s || undefined} onClick={() => update({ status: s })}>
                  {s} <span className="cs-dim">{counts[s]}</span>
                </button>
              ))}
              <button
                className="cs-chip cs-sort"
                onClick={() => update({ sort: SORT_CYCLE[(SORT_CYCLE.indexOf(view.sort) + 1) % SORT_CYCLE.length] })}
                title="Cycle sort (s), flip direction (shift+s)"
              >
                sort:{SORT_LABEL[view.sort].toLowerCase()}
                <span
                  className="cs-accent"
                  onClick={(e) => {
                    e.stopPropagation();
                    update({ dir: view.dir === 'asc' ? 'desc' : 'asc' });
                  }}
                >
                  {view.dir === 'asc' ? '↑' : '↓'}
                </span>
              </button>
            </div>
          </header>

          <div className="cs-rows" ref={listRef} role="listbox" aria-label="Rules">
            {visible.map((r) => (
              <div
                key={r.id}
                role="option"
                aria-selected={r.id === selectedId}
                className="cs-row"
                data-selected={r.id === selectedId || undefined}
                onClick={() => setSelectedId(r.id)}
              >
                <div className="cs-row-top">
                  <span className="cs-glyph" data-status={r.status} aria-label={statusLabel(r)}>
                    {GLYPH[r.status]}
                  </span>
                  <span className="cs-id">{r.id}</span>
                  <span className="cs-row-name">{r.name}</span>
                </div>
                <div className="cs-row-meta">
                  <span className="cs-conf" data-low={isLowConfidence(r) || undefined}>
                    {isLowConfidence(r) ? '!' : ' '}
                    {String(Math.round(r.confidence * 100)).padStart(2, '0')}
                    <Bar value={r.confidence} cells={6} />
                  </span>
                  <span>pur {Math.round(r.purity * 100)}</span>
                  <span>{r.incidentCount} inc</span>
                  <span className="cs-row-group">{groupById(r.groupId).name.toLowerCase()}</span>
                </div>
              </div>
            ))}
            {visible.length === 0 && (
              <div className="cs-empty">
                no rules match <span className="cs-accent">{view.query || view.status}</span>
                <br />
                <button className="cs-link" onClick={() => update({ query: '', status: 'all', groupId: 'all' })}>
                  clear filters
                </button>
              </div>
            )}
          </div>
          <footer className="cs-legend">
            <span><kbd>j</kbd><kbd>k</kbd> move</span>
            <span><kbd>/</kbd> search</span>
            <span><kbd>f</kbd> filter</span>
            <span><kbd>s</kbd> sort</span>
          </footer>
        </section>

        <section className="cs-detail">
          {selected ? (
            <Detail rule={selected} decision={decision} onAction={act} />
          ) : (
            <div className="cs-empty cs-empty-detail">no rule selected</div>
          )}
        </section>

        <Palette
          open={palette}
          onOpenChange={setPalette}
          rules={rules}
          selected={selected}
          onSelect={(id) => {
            update({ status: 'all', query: '' });
            setSelectedId(id);
          }}
          onStatus={(s) => update({ status: s })}
          onGroup={(g) => update({ groupId: g })}
          onSort={(k) => update({ sort: k })}
          onAction={act}
        />
      </div>
    </Tooltip.Provider>
  );
}

function RailButton({ label, active, children }: { label: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger className="cs-rail-btn" data-active={active || undefined} aria-label={label}>
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="right" sideOffset={10}>
          <Tooltip.Popup className="cs-tooltip">{label}</Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function Detail({
  rule,
  decision,
  onAction,
}: {
  rule: Rule;
  decision: ReturnType<typeof useDecision>;
  onAction: (a: RuleAction) => void;
}) {
  const g = groupById(rule.groupId);
  const composing = decision.target?.rule.id === rule.id ? decision.target : null;
  return (
    <div className="cs-detail-inner">
      <div className="cs-detail-scroll">
        <div className="cs-crumb">
          <span className="cs-dim">rules /</span> {rule.id}
          <span className="cs-tag" data-status={rule.status}>
            {GLYPH[rule.status]} {statusLabel(rule).toUpperCase()}
          </span>
        </div>
        <h1 className="cs-h1">{rule.name}</h1>

        <div className="cs-grid">
          <Field label="confidence" low={isLowConfidence(rule)}>
            {pct(rule.confidence)} <Bar value={rule.confidence} />
            {isLowConfidence(rule) && <div className="cs-bad cs-small">below {pct(LOW_CONFIDENCE)} floor</div>}
          </Field>
          <Field label="purity">
            {pct(rule.purity)} <Bar value={rule.purity} />
          </Field>
          <Field label="incidents">{rule.incidentCount}</Field>
          <Field label="escalated" low={rule.evidence.escalations > 0}>
            {rule.evidence.escalations}
          </Field>
          <Field label="assignment group">
            {g.name} <span className="cs-dim">· {g.unit}</span>
          </Field>
          <Field label="source">
            {rule.source === 'operator' ? rule.sourceDetail : SOURCE_LABEL[rule.source]}
            <div className="cs-dim cs-small">{rule.source === 'operator' ? 'operator' : rule.sourceDetail.split(' ').pop()}</div>
          </Field>
          <Field label="median clear">{rule.evidence.medianClear}</Field>
          <Field label="recurrence">{rule.evidence.recurrence}</Field>
        </div>

        <Section title="evidence">
          <p className="cs-p">{rule.evidence.summary}</p>
        </Section>

        <Section title="match query" note={rule.evidence.window.toLowerCase()}>
          <pre className="cs-query">
            <span className="cs-kw">select</span> incidents{'\n'}
            {rule.evidence.conditions.map((c, i) => (
              <span key={i}>
                {' '}
                <span className="cs-kw">{i === 0 ? 'where' : '  and'}</span> {c.field} <span className="cs-op">{c.op}</span>{' '}
                <span className="cs-str">'{c.value}'</span>
                {'\n'}
              </span>
            ))}
            {'   '}
            <span className="cs-kw">and</span> assignment_group <span className="cs-op">=</span>{' '}
            <span className="cs-str">'{g.name}'</span> <span className="cs-dim">-- scope, locked</span>
          </pre>
        </Section>

        <Section title="volume / week" note={`${rule.incidentCount} matched`}>
          <WeeklyBars data={rule.evidence.weekly} height={64} className="cs-wb" />
        </Section>

        <Section title="matched incidents" note={`showing ${rule.related.length} of ${rule.incidentCount}`}>
          <table className="cs-table">
            <tbody>
              {rule.related.map((i) => (
                <tr key={i.id} data-escalated={i.resolution === 'escalated' || undefined}>
                  <td className="cs-dim">{shortDate(i.openedAt)}</td>
                  <td>{i.id}</td>
                  <td className="cs-td-title">{i.title}</td>
                  <td className="cs-res" data-res={i.resolution}>
                    {RESOLUTION_LABEL[i.resolution].toLowerCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="audit log">
          <div className="cs-log">
            {[...rule.audit].reverse().map((a, i) => (
              <div key={i} className="cs-log-line">
                <span className="cs-dim">{a.at.slice(0, 10)}</span>
                <span className="cs-log-actor">{a.actor.toLowerCase()}</span>
                <span className="cs-log-action" data-action={a.action}>
                  {a.action}
                  {a.override ? '+override' : ''}
                </span>
                <span className="cs-log-reason">“{a.reason}”</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {composing ? (
        <Composer rule={rule} action={composing.action} decision={decision} />
      ) : (
        <div className="cs-cmdbar">
          {actionsFor(rule).map((a) => (
            <button key={a} className="cs-cmd" data-kind={turnsOn(a) ? 'on' : 'off'} onClick={() => onAction(a)}>
              <kbd>{ACTION_KEY[a]}</kbd> {a}
            </button>
          ))}
          <span className="cs-dim cs-cmdbar-note">reason required · scope {g.name.toLowerCase()}</span>
        </div>
      )}
    </div>
  );
}

function Field({ label, low, children }: { label: string; low?: boolean; children: React.ReactNode }) {
  return (
    <div className="cs-field" data-low={low || undefined}>
      <div className="cs-label">{label}</div>
      <div className="cs-value">{children}</div>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="cs-sec">
      <div className="cs-sec-head">
        <span>{title}</span>
        <span className="cs-rule-line" />
        {note && <span className="cs-dim">{note}</span>}
      </div>
      {children}
    </section>
  );
}

function Composer({ rule, action, decision }: { rule: Rule; action: RuleAction; decision: ReturnType<typeof useDecision> }) {
  const backtest = useBacktest(rule, turnsOn(action));
  const needs = needsOverride(rule, action);
  const errs = decision.check?.errors ?? {};
  const len = decision.reason.trim().length;
  return (
    <form
      className="cs-composer"
      data-kind={turnsOn(action) ? 'on' : 'off'}
      onSubmit={(e) => {
        e.preventDefault();
        decision.submit();
      }}
    >
      <div className="cs-composer-head">
        <span className="cs-accent">{action}</span> {rule.id}
        <span className="cs-dim">
          → {turnsOn(action) ? 'active' : 'inactive'} · scope {groupById(rule.groupId).name.toLowerCase()}
        </span>
      </div>

      {turnsOn(action) && (
        <div className="cs-backtest" aria-live="polite">
          {backtest ? (
            <>
              <span className="cs-dim">backtest 90d:</span> hides {backtest.suppressed} incidents ·{' '}
              <span className={backtest.escalated ? 'cs-bad' : 'cs-ok'}>{backtest.escalated} escalated</span> · saves ~
              {backtest.hoursSaved}h triage
            </>
          ) : (
            <>
              <ThinkingOrb state="solving" size={20} theme="dark" aria-hidden="true" />
              <span className="cs-dim">backtesting against 90d of incidents…</span>
            </>
          )}
        </div>
      )}

      <label className="cs-reason">
        <span className="cs-accent">reason&gt;</span>
        <textarea
          autoFocus
          rows={2}
          value={decision.reason}
          onChange={(e) => decision.setReason(e.target.value)}
          placeholder="required. what did you verify?"
          spellCheck={false}
        />
        <span className="cs-counter" data-ok={len >= MIN_REASON || undefined}>
          {Math.min(len, MIN_REASON)}/{MIN_REASON}
        </span>
      </label>
      {decision.attempted && errs.reason && <div className="cs-bad cs-small">! {errs.reason.toLowerCase()}</div>}

      {needs && (
        <div className="cs-override">
          <div className="cs-override-text">
            <span className="cs-bad">! low confidence</span> {pct(rule.confidence)} &lt; {pct(LOW_CONFIDENCE)}. activation
            may hide real incidents. hold to take responsibility.
          </div>
          <HoldButton done={decision.override} onDone={() => decision.setOverride(true)} />
        </div>
      )}
      {decision.attempted && errs.override && <div className="cs-bad cs-small">! override not confirmed</div>}

      <div className="cs-composer-foot">
        <button type="button" className="cs-cmd" onClick={decision.close}>
          <kbd>esc</kbd> cancel
        </button>
        <button type="submit" className="cs-cmd cs-commit" data-kind={turnsOn(action) ? 'on' : 'off'} disabled={!decision.check?.ok}>
          <kbd>⌘↵</kbd> {ACTION_LABEL[action].toLowerCase()}
        </button>
      </div>
    </form>
  );
}

/* Hold-to-confirm: slow, deliberate press (2s linear fill); snappy release (200ms). */
function HoldButton({ done, onDone }: { done: boolean; onDone: () => void }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number>(undefined);
  const start = () => {
    if (done) return;
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      onDone();
    }, 2000);
  };
  const stop = () => {
    clearTimeout(timer.current);
    setHolding(false);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className="cs-hold"
      data-holding={holding || undefined}
      data-done={done || undefined}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && stop()}
      aria-label={done ? 'Override confirmed' : 'Hold for two seconds to confirm override'}
    >
      <span className="cs-hold-label">{done ? '✓ override confirmed' : 'hold to override'}</span>
      <span className="cs-hold-fill" aria-hidden>
        <span className="cs-hold-label">{done ? '✓ override confirmed' : 'hold to override'}</span>
      </span>
    </button>
  );
}

function Palette({
  open,
  onOpenChange,
  rules,
  selected,
  onSelect,
  onStatus,
  onGroup,
  onSort,
  onAction,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  rules: Rule[];
  selected: Rule | null;
  onSelect: (id: string) => void;
  onStatus: (s: StatusFilter) => void;
  onGroup: (g: string) => void;
  onSort: (k: SortKey) => void;
  onAction: (a: RuleAction) => void;
}) {
  const run = (fn: () => void) => () => {
    fn();
    onOpenChange(false);
  };
  const actions = useMemo(() => (selected ? actionsFor(selected) : []), [selected]);
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      className="cs-palette"
      overlayClassName="cs-palette-overlay"
      contentClassName="cs-palette-content"
    >
      <Command.Input className="cs-palette-input" placeholder="type a command or rule…" />
      <Command.List className="cs-palette-list">
        <Command.Empty className="cs-palette-empty">no results</Command.Empty>
        {selected && (
          <Command.Group heading={`actions · ${selected.id}`}>
            {actions.map((a) => (
              <Command.Item key={a} value={`${a} ${selected.id}`} onSelect={run(() => onAction(a))}>
                {a} {selected.id}
                <kbd>{ACTION_KEY[a]}</kbd>
              </Command.Item>
            ))}
          </Command.Group>
        )}
        <Command.Group heading="filter">
          {STATUS_CYCLE.map((s) => (
            <Command.Item key={s} value={`show ${s}`} onSelect={run(() => onStatus(s))}>
              show {s}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="scope">
          <Command.Item value="scope all groups" onSelect={run(() => onGroup('all'))}>
            all assignment groups
          </Command.Item>
          {GROUPS.map((g) => (
            <Command.Item key={g.id} value={`scope ${g.name} ${g.unit}`} onSelect={run(() => onGroup(g.id))}>
              {g.name.toLowerCase()} <span className="cs-dim">{g.unit.toLowerCase()}</span>
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="sort">
          {SORT_CYCLE.map((k) => (
            <Command.Item key={k} value={`sort by ${SORT_LABEL[k]}`} onSelect={run(() => onSort(k))}>
              sort by {SORT_LABEL[k].toLowerCase()}
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="rules">
          {rules.map((r) => (
            <Command.Item key={r.id} value={`${r.id} ${r.name}`} onSelect={run(() => onSelect(r.id))}>
              <span className="cs-glyph" data-status={r.status}>
                {GLYPH[r.status]}
              </span>
              <span className="cs-dim">{r.id}</span> {r.name.toLowerCase()}
              <span className="cs-palette-meta">{ago(r.updatedAt)}</span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
