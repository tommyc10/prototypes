import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Menu } from '@base-ui/react/menu';
import { Command } from 'cmdk';
import { toast } from 'sonner';
import { BotAvatar } from 'bot-avatars';
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  Bell,
  BookText,
  Check,
  CornerDownLeft,
  Filter,
  LayoutGrid,
  Search,
  Moon,
  Sun,
  ShieldCheck,
  Siren,
} from 'lucide-react';
import { GROUPS, RESOLUTION_LABEL, SOURCE_LABEL, groupById, type Rule } from '../shared/data';
import {
  ACTION_LABEL,
  ACTION_PAST,
  LOW_CONFIDENCE,
  MIN_REASON,
  SORT_LABEL,
  actionsFor,
  ago,
  groupCounts,
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
import './midnight.css';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'proposed', label: 'Proposed' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];
const ACTION_KEY: Record<RuleAction, string> = { approve: 'A', reject: 'X', activate: 'E', deactivate: 'D' };
const SORTS = Object.keys(SORT_LABEL) as SortKey[];

type Theme = 'dark' | 'light';

/* Theme lives on <html> too, so portalled menus, ⌘K and toasts follow it.
 * Switching dissolves the new theme in over the old one (see midnight.css). */
function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('mn-theme') === 'light' ? 'light' : 'dark'));

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.mnTheme = theme;
    localStorage.setItem('mn-theme', theme);
    return () => {
      delete root.dataset.mnTheme;
    };
  }, [theme]);

  const toggle = () => {
    const apply = () => flushSync(() => setTheme(theme === 'dark' ? 'light' : 'dark'));
    if (!document.startViewTransition) return apply();
    document.startViewTransition(apply);
  };

  return [theme, toggle] as const;
}

export function Midnight() {
  const rules = useFreshRules();
  const { view, update, visible, counts } = useRuleView(rules);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [palette, setPalette] = useState(false);
  const [theme, toggleTheme] = useTheme();
  // Keyboard-opened composers appear instantly; pointer-opened ones animate in.
  const [composerVia, setComposerVia] = useState<'key' | 'pointer'>('pointer');
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [detailRef, mode] = usePaneMode();

  const decision = useDecision((rule, action) => {
    toast.custom(() => (
      <div className="mn-toast">
        <span className="mn-toast-icon">
          <Check size={13} strokeWidth={2.5} />
        </span>
        <div>
          <div className="mn-toast-title">
            {rule.id} {ACTION_PAST[action]}
          </div>
          <div className="mn-toast-sub">Reason recorded in the audit log</div>
        </div>
      </div>
    ));
  });

  const selected = rules.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    if (!visible.length) return setSelectedId(null);
    if (!selectedId || !visible.some((r) => r.id === selectedId)) setSelectedId(visible[0].id);
  }, [visible, selectedId]);

  useEffect(() => {
    listRef.current?.querySelector('[data-selected]')?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  const act = (action: RuleAction, via: 'key' | 'pointer') => {
    if (!selected || !actionsFor(selected).includes(action)) return;
    setComposerVia(via);
    decision.open(selected, action);
  };

  const live = useRef({ palette, decision, visible, selectedId, view, act });
  live.current = { palette, decision, visible, selectedId, view, act };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = live.current;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
        return;
      }
      if (s.palette) return;
      if (s.decision.target) {
        if (e.key === 'Escape') {
          e.preventDefault();
          s.decision.close();
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          s.decision.submit();
        }
        return;
      }
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA)$/.test(t.tagName) || t.isContentEditable) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'ArrowDown') {
          e.preventDefault();
          t.blur();
        }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const move = (d: number) => {
        const i = s.visible.findIndex((r) => r.id === s.selectedId);
        const next = s.visible[Math.min(s.visible.length - 1, Math.max(0, i + d))];
        if (next) setSelectedId(next.id);
      };
      const map: Record<string, () => void> = {
        j: () => move(1),
        ArrowDown: () => move(1),
        k: () => move(-1),
        ArrowUp: () => move(-1),
        '/': () => searchRef.current?.focus(),
        a: () => s.act('approve', 'key'),
        x: () => s.act('reject', 'key'),
        e: () => s.act('activate', 'key'),
        d: () => s.act('deactivate', 'key'),
      };
      const fn = map[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const gc = groupCounts(rules);

  return (
    <div className="mn" data-theme={theme}>
      <aside className="mn-side">
        <div className="mn-brand">
          <div className="mn-brand-mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="14" height="14">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </div>
          Imperial Ops
        </div>

        <button className="mn-jump" onClick={() => setPalette(true)}>
          <Search size={14} />
          <span>Search or jump to…</span>
          <kbd>⌘K</kbd>
        </button>

        <nav className="mn-nav">
          <a className="mn-nav-item"><Siren size={16} /> Incidents</a>
          <a className="mn-nav-item"><Bell size={16} /> Alerts</a>
          <a className="mn-nav-item" data-active><Filter size={16} /> Rules</a>
          <a className="mn-nav-item"><LayoutGrid size={16} /> Services</a>
          <a className="mn-nav-item"><BookText size={16} /> Audit log</a>
        </nav>

        <div className="mn-side-label">Assignment groups</div>
        <div className="mn-groups">
          <button className="mn-group" data-active={view.groupId === 'all' || undefined} onClick={() => update({ groupId: 'all' })}>
            <span>All groups</span>
            <span className="mn-count">{rules.length}</span>
          </button>
          {gc.map(({ group, total, proposed }) => (
            <button
              key={group.id}
              className="mn-group"
              data-active={view.groupId === group.id || undefined}
              onClick={() => update({ groupId: group.id })}
            >
              <span className="mn-truncate">{group.name}</span>
              {proposed > 0 && <span className="mn-dot" data-status="proposed" aria-label={`${proposed} proposed`} />}
              <span className="mn-count">{total}</span>
            </button>
          ))}
        </div>

        <div className="mn-user">
          <div className="mn-avatar">AP</div>
          <div className="mn-user-text">
            <div>Admiral Piett</div>
            <div className="mn-subtle">Rule governor</div>
          </div>
          <button
            className="mn-icon-btn mn-theme-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </aside>

      <section className="mn-list">
        <header className="mn-list-head">
          <div className="mn-list-title">
            <h1>Rules</h1>
            <span className="mn-subtle">
              {view.groupId === 'all' ? 'All groups' : groupById(view.groupId).name}
            </span>
          </div>
          <label className="mn-search">
            <Search size={14} />
            <input
              ref={searchRef}
              value={view.query}
              onChange={(e) => update({ query: e.target.value })}
              placeholder="Search rules, CIs, sources"
            />
            <kbd>/</kbd>
          </label>
          <div className="mn-list-tools">
            <div className="mn-tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={view.status === t.key}
                  className="mn-tab"
                  data-active={view.status === t.key || undefined}
                  onClick={() => update({ status: t.key })}
                >
                  {t.label}
                  <span>{counts[t.key]}</span>
                </button>
              ))}
            </div>
            <Menu.Root>
              <Menu.Trigger className="mn-icon-btn" aria-label={`Sort: ${SORT_LABEL[view.sort]}`}>
                <ArrowDownWideNarrow size={15} />
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner sideOffset={6} align="end">
                  <Menu.Popup className="mn-menu">
                    <div className="mn-menu-label">Sort by</div>
                    <Menu.RadioGroup
                      value={view.sort}
                      onValueChange={(v) => update({ sort: v as SortKey, dir: v === 'name' ? 'asc' : 'desc' })}
                    >
                      {SORTS.map((k) => (
                        <Menu.RadioItem key={k} value={k} className="mn-menu-item" closeOnClick>
                          <Menu.RadioItemIndicator className="mn-menu-ind">
                            <Check size={13} />
                          </Menu.RadioItemIndicator>
                          <span>{SORT_LABEL[k]}</span>
                        </Menu.RadioItem>
                      ))}
                    </Menu.RadioGroup>
                    <Menu.Separator className="mn-menu-sep" />
                    <Menu.RadioGroup value={view.dir} onValueChange={(v) => update({ dir: v as 'asc' | 'desc' })}>
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
          </div>
        </header>

        <div className="mn-rows" ref={listRef} role="listbox" aria-label="Rules">
          {visible.map((r) => (
            <div
              key={r.id}
              role="option"
              aria-selected={r.id === selectedId}
              className="mn-row"
              data-selected={r.id === selectedId || undefined}
              onClick={() => setSelectedId(r.id)}
            >
              <span className="mn-dot" data-status={r.status} aria-label={statusLabel(r)} />
              <div className="mn-row-main">
                <div className="mn-row-name">{r.name}</div>
                <div className="mn-row-meta">
                  <span className="mn-mono">{r.id}</span>
                  <span>{groupById(r.groupId).name}</span>
                </div>
              </div>
              <div className="mn-row-side">
                <span className="mn-row-conf" data-low={isLowConfidence(r) || undefined}>
                  {isLowConfidence(r) && <AlertTriangle size={12} aria-label="Low confidence" />}
                  {pct(r.confidence)}
                </span>
                <span className="mn-subtle">{r.incidentCount} inc</span>
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <div className="mn-empty">
              <BotAvatar type="ghost" size={96} aria-hidden="true" />
              <div>No rules match</div>
              <button className="mn-btn" onClick={() => update({ query: '', status: 'all', groupId: 'all' })}>
                Clear filters
              </button>
            </div>
          )}
        </div>

        <footer className="mn-hints">
          <span><kbd>J</kbd><kbd>K</kbd> Navigate</span>
          <span><kbd>/</kbd> Search</span>
          <span><kbd>⌘K</kbd> Commands</span>
        </footer>
      </section>

      <section className="mn-detail" ref={detailRef}>
        {selected ? (
          <Detail
            rule={selected}
            rules={rules}
            mode={mode}
            decision={decision}
            composerVia={composerVia}
            onAction={(a) => act(a, 'pointer')}
            onSelect={setSelectedId}
          />
        ) : (
          <div className="mn-empty">Select a rule</div>
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
        onAction={(a) => act(a, 'key')}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}

type Mode = 'narrow' | 'wide' | 'ultra';

/* The detail pane adapts to its own width, not the viewport's. */
function usePaneMode() {
  const ref = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<Mode>('narrow');
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pick = (w: number) => setMode(w >= 1700 ? 'ultra' : w >= 1100 ? 'wide' : 'narrow');
    const ro = new ResizeObserver(([entry]) => pick(entry.contentRect.width));
    ro.observe(el);
    pick(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return [ref, mode] as const;
}

const openFor = (m: number) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`);

function Detail({
  rule,
  rules,
  mode,
  decision,
  composerVia,
  onAction,
  onSelect,
}: {
  rule: Rule;
  rules: Rule[];
  mode: Mode;
  decision: ReturnType<typeof useDecision>;
  composerVia: 'key' | 'pointer';
  onAction: (a: RuleAction) => void;
  onSelect: (id: string) => void;
}) {
  const g = groupById(rule.groupId);
  const composing = decision.target?.rule.id === rule.id ? decision.target : null;
  const escalated = rule.related.filter((i) => i.resolution === 'escalated');
  const low = isLowConfidence(rule);
  const wide = mode !== 'narrow';
  const siblings = rules.filter((r) => r.groupId === rule.groupId && r.id !== rule.id);

  const header = (
    <>
      <div className="mn-detail-top">
        <span className="mn-mono mn-subtle">{rule.id}</span>
        <span className="mn-badge" data-status={rule.status}>
          <span className="mn-dot" data-status={rule.status} />
          {statusLabel(rule)}
        </span>
      </div>
      <h2 className="mn-title">{rule.name}</h2>
      <div className="mn-scope">
        <ShieldCheck size={14} />
        Scoped to <strong>{g.name}</strong>
        <span className="mn-subtle">· {g.unit}</span>
        <span className="mn-sep" />
        {rule.source === 'operator' ? rule.sourceDetail : `${SOURCE_LABEL[rule.source]} · ${rule.sourceDetail.split(' ').pop()}`}
      </div>
    </>
  );

  const stats = (
    <div className="mn-stats">
      <Stat label="Confidence" value={pct(rule.confidence)} meter={rule.confidence} tone={low ? 'warn' : undefined}>
        {low && <span className="mn-chip-warn">Below {pct(LOW_CONFIDENCE)}</span>}
      </Stat>
      <Stat label="Purity" value={pct(rule.purity)} meter={rule.purity} />
      <Stat label="Incidents" value={String(rule.incidentCount)}>
        <span className="mn-subtle">{rule.evidence.window.toLowerCase()}</span>
      </Stat>
      <Stat label="Escalated" value={String(rule.evidence.escalations)} tone={rule.evidence.escalations ? 'bad' : undefined}>
        <span className="mn-subtle">real incidents matched</span>
      </Stat>
    </div>
  );

  const evidence = (
    <section className="mn-sec">
      <h3>Evidence</h3>
      <p className="mn-p">{rule.evidence.summary}</p>
      {escalated.length > 0 && (
        <div className="mn-callout">
          <AlertTriangle size={14} />
          <span>
            Matched a real incident: <strong>{escalated[0].title}</strong> <span className="mn-mono">{escalated[0].id}</span>
          </span>
        </div>
      )}
      <div className="mn-code">
        {rule.evidence.conditions.map((c, i) => (
          <div key={i}>
            <span className="mn-code-kw">{i === 0 ? 'where' : '  and'}</span> {c.field}{' '}
            <span className="mn-code-op">{c.op}</span> <span className="mn-code-val">{c.value}</span>
          </div>
        ))}
        <div>
          <span className="mn-code-kw">  and</span> assignment_group <span className="mn-code-op">=</span>{' '}
          <span className="mn-code-val">{g.name}</span> <span className="mn-code-cm">// scope, locked</span>
        </div>
      </div>
      <dl className="mn-kv">
        <div>
          <dt>Median clear</dt>
          <dd>{rule.evidence.medianClear}</dd>
        </div>
        <div>
          <dt>Recurrence</dt>
          <dd>{rule.evidence.recurrence}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{shortDate(rule.createdAt)}</dd>
        </div>
      </dl>
    </section>
  );

  const volume = (
    <section className="mn-sec">
      <h3>
        Matched incidents per week <span className="mn-subtle">{rule.incidentCount} total</span>
      </h3>
      <WeeklyBars data={rule.evidence.weekly} height={mode === 'ultra' ? 120 : 72} className="mn-wb" />
    </section>
  );

  const related = (
    <section className="mn-sec">
      <h3>
        Related incidents <span className="mn-subtle">{rule.related.length} of {rule.incidentCount}</span>
      </h3>
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
        {rule.related.map((i) => (
          <li key={i.id} data-escalated={i.resolution === 'escalated' || undefined}>
            <span className="mn-mono mn-subtle">{i.id}</span>
            <span className="mn-truncate">{i.title}</span>
            {wide && <span className="mn-mono mn-subtle mn-truncate">{i.ci}</span>}
            <span className="mn-res" data-res={i.resolution}>
              {RESOLUTION_LABEL[i.resolution]}
            </span>
            {wide && <span className="mn-subtle mn-inc-date">{openFor(i.minutesOpen)}</span>}
            <span className="mn-subtle mn-inc-date">{shortDate(i.openedAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );

  const history = (
    <section className="mn-sec">
      <h3>History</h3>
      <ol className="mn-timeline">
        {[...rule.audit].reverse().map((a, i) => (
          <li key={i} data-action={a.action}>
            <div className="mn-tl-head">
              <strong>{a.actor}</strong>
              <span className="mn-tl-action" data-action={a.action}>
                {a.action}
              </span>
              {a.override && <span className="mn-chip-warn">Override</span>}
              <span className="mn-subtle mn-tl-time">{ago(a.at)}</span>
            </div>
            <p>{a.reason}</p>
          </li>
        ))}
      </ol>
    </section>
  );

  const composer = composing && (
    <Composer
      key={`${rule.id}-${composing.action}`}
      rule={rule}
      action={composing.action}
      decision={decision}
      via={composerVia}
      docked={wide}
    />
  );

  if (!wide) {
    return (
      <div className="mn-detail-inner">
        <div className="mn-detail-scroll" data-floating>
          {header}
          {stats}
          {evidence}
          {volume}
          {related}
          {history}
        </div>
        {composer || (
          <div className="mn-actionbar">
            <span className="mn-subtle mn-actionbar-note">Every change needs a written reason</span>
            {actionsFor(rule).map((a) => (
              <button key={a} className="mn-btn" data-variant={turnsOn(a) ? 'primary' : 'danger'} onClick={() => onAction(a)}>
                {ACTION_LABEL[a]}
                <kbd>{ACTION_KEY[a]}</kbd>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mn-detail-inner">
      <div className="mn-detail-scroll">
        <div className="mn-wide" data-mode={mode}>
          <header className="mn-wide-head">{header}</header>
          {mode === 'ultra' ? (
            <>
              <div className="mn-col">
                {stats}
                {evidence}
              </div>
              <div className="mn-col">
                {volume}
                {related}
              </div>
            </>
          ) : (
            <div className="mn-col">
              {stats}
              {evidence}
              {volume}
              {related}
            </div>
          )}
          <aside className="mn-rail" aria-label="Decision">
            <div className="mn-rail-card">
              {composer || (
                <div className="mn-decide">
                  <Proposer rule={rule} />
                  <div className="mn-decide-title">Decision</div>
                  <p>
                    {rule.status === 'proposed'
                      ? `${rule.source === 'operator' ? 'Suggested by an operator' : 'Proposed by the rule engine'}. Nothing is suppressed until a person approves it.`
                      : rule.status === 'active'
                        ? `Suppressing matching incidents for ${g.name}.`
                        : `Not suppressing. Matching incidents page ${g.name}.`}
                  </p>
                  <div className="mn-decide-actions">
                    {actionsFor(rule).map((a) => (
                      <button
                        key={a}
                        className="mn-btn"
                        data-variant={turnsOn(a) ? 'primary' : 'danger'}
                        onClick={() => onAction(a)}
                      >
                        {ACTION_LABEL[a]}
                        <kbd>{ACTION_KEY[a]}</kbd>
                      </button>
                    ))}
                  </div>
                  {low && rule.status !== 'active' && (
                    <p className="mn-decide-note">
                      <AlertTriangle size={13} /> Below {pct(LOW_CONFIDENCE)} confidence. Activating needs an override.
                    </p>
                  )}
                  <p className="mn-decide-foot">Every change needs a written reason.</p>
                </div>
              )}
            </div>
            {history}
            <section className="mn-sec">
              <h3>
                Also in {g.name} <span className="mn-subtle">{siblings.length}</span>
              </h3>
              {siblings.length ? (
                <div className="mn-siblings">
                  {siblings.map((r) => (
                    <button key={r.id} className="mn-sibling" onClick={() => onSelect(r.id)}>
                      <span className="mn-dot" data-status={r.status} aria-label={statusLabel(r)} />
                      <span className="mn-truncate">{r.name}</span>
                      <span className="mn-row-conf" data-low={isLowConfidence(r) || undefined}>
                        {pct(r.confidence)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mn-p mn-subtle">No other rules suppress incidents for this group.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* Who proposed the rule. Machines get the ghost (the rule engine); people get initials. */
function Proposer({ rule }: { rule: Rule }) {
  const human = rule.source === 'operator';
  const name = human ? rule.sourceDetail.replace(/^Suggested by /, '') : rule.sourceDetail;
  return (
    <div className="mn-proposer">
      {human ? (
        <span className="mn-proposer-human" aria-hidden="true">
          {name
            .split(/[\s.-]+/)
            .filter(Boolean)
            .slice(-2)
            .map((w) => w[0])
            .join('')
            .toUpperCase()}
        </span>
      ) : (
        <BotAvatar type="ghost" size={32} aria-hidden="true" />
      )}
      <div className="mn-proposer-text">
        <div className="mn-proposer-name">{name}</div>
        <div className="mn-subtle">
          {human ? 'Operator' : 'Rule engine'} · proposed {ago(rule.createdAt)}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  meter,
  tone,
  children,
}: {
  label: string;
  value: string;
  meter?: number;
  tone?: 'warn' | 'bad';
  children?: React.ReactNode;
}) {
  return (
    <div className="mn-stat" data-tone={tone}>
      <div className="mn-stat-label">{label}</div>
      <div className="mn-stat-value">{value}</div>
      {meter !== undefined && (
        <div className="mn-meter" aria-hidden>
          <span style={{ transform: `scaleX(${meter})` }} />
        </div>
      )}
      {children && <div className="mn-stat-foot">{children}</div>}
    </div>
  );
}

function Composer({
  rule,
  action,
  decision,
  via,
  docked,
}: {
  rule: Rule;
  action: RuleAction;
  decision: ReturnType<typeof useDecision>;
  via: 'key' | 'pointer';
  docked?: boolean;
}) {
  const backtest = useBacktest(rule, turnsOn(action));
  const needs = needsOverride(rule, action);
  const errs = decision.check?.errors ?? {};
  const len = decision.reason.trim().length;
  const on = turnsOn(action);

  return (
    <form
      className="mn-composer"
      data-docked={docked || undefined}
      data-kind={on ? 'on' : 'off'}
      data-animate={via === 'pointer' || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        decision.submit();
      }}
    >
      <div className="mn-composer-head">
        <div className="mn-composer-id">
          {/* The rule engine is the agent: it works while the backtest runs, idles once results land. */}
          <BotAvatar type="ghost" size={32} state={on && !backtest ? 'working' : 'default'} aria-hidden="true" />
          <div>
            <div className="mn-composer-title">
              {ACTION_LABEL[action]} {rule.id}
            </div>
            <div className="mn-subtle">
              {on ? 'Starts suppressing' : 'Stops suppressing'} matching incidents for {groupById(rule.groupId).name}
            </div>
          </div>
        </div>
        {on && (
          <div className="mn-backtest" aria-live="polite">
            {backtest ? (
              <>
                <div>
                  <b>{backtest.suppressed}</b>
                  <span>hidden in 90d</span>
                </div>
                <div data-bad={backtest.escalated > 0 || undefined}>
                  <b>{backtest.escalated}</b>
                  <span>escalated</span>
                </div>
              </>
            ) : (
              <span className="mn-backtest-wait">Rule engine is backtesting 90 days…</span>
            )}
          </div>
        )}
      </div>

      <label className="mn-field">
        <textarea
          autoFocus
          rows={3}
          value={decision.reason}
          onChange={(e) => decision.setReason(e.target.value)}
          placeholder={
            action === 'reject'
              ? 'Why is this pattern not safe to suppress?'
              : action === 'deactivate'
                ? 'Why should these incidents page the group again?'
                : 'What did you verify in the evidence?'
          }
          aria-label="Reason"
          aria-invalid={(decision.attempted && !!errs.reason) || undefined}
        />
        <span className="mn-field-foot">
          {decision.attempted && errs.reason ? (
            <span className="mn-bad">{errs.reason}</span>
          ) : (
            <span className="mn-subtle">Required · saved to the audit log with your name</span>
          )}
          <span className="mn-counter" data-ok={len >= MIN_REASON || undefined}>
            {len >= MIN_REASON ? <Check size={12} strokeWidth={2.5} /> : `${len}/${MIN_REASON}`}
          </span>
        </span>
      </label>

      {needs && (
        <div className="mn-override" data-invalid={(decision.attempted && !!errs.override) || undefined}>
          <AlertTriangle size={15} className="mn-override-icon" />
          <div className="mn-override-text">
            <strong>Low confidence override</strong>
            <span>
              {pct(rule.confidence)} is below the {pct(LOW_CONFIDENCE)} floor. This rule may hide real incidents.
            </span>
          </div>
          <HoldButton done={decision.override} onDone={() => decision.setOverride(true)} />
        </div>
      )}

      <div className="mn-composer-foot">
        <button type="button" className="mn-btn mn-btn-ghost" onClick={decision.close}>
          Cancel <kbd>Esc</kbd>
        </button>
        <button type="submit" className="mn-btn" data-variant={on ? 'primary' : 'danger'} disabled={!decision.check?.ok}>
          {ACTION_LABEL[action]} rule
          <kbd>
            ⌘<CornerDownLeft size={11} />
          </kbd>
        </button>
      </div>
    </form>
  );
}

/* Hold to confirm: slow, deliberate 2s linear fill while pressed; 200ms ease-out release. */
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
  const label = done ? 'Override confirmed' : 'Hold to override';
  return (
    <button
      type="button"
      className="mn-hold"
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
      aria-label={done ? 'Override confirmed' : 'Hold for two seconds to confirm the override'}
    >
      <span className="mn-hold-label">
        {done && <Check size={13} strokeWidth={2.5} />}
        {label}
      </span>
      <span className="mn-hold-fill" aria-hidden>
        <span className="mn-hold-label">{label}</span>
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
  theme,
  onToggleTheme,
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
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const run = (fn: () => void) => () => {
    fn();
    onOpenChange(false);
  };
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command menu"
      className="mn-palette"
      overlayClassName="mn-palette-overlay"
      contentClassName="mn-palette-content"
    >
      <div className="mn-palette-search">
        <Search size={16} />
        <Command.Input placeholder="Search rules or run a command…" />
      </div>
      <Command.List className="mn-palette-list">
        <Command.Empty className="mn-palette-empty">No results</Command.Empty>
        {selected && (
          <Command.Group heading={selected.id}>
            {actionsFor(selected).map((a) => (
              <Command.Item key={a} value={`${a} ${selected.id}`} onSelect={run(() => onAction(a))}>
                {ACTION_LABEL[a]} rule
                <kbd>{ACTION_KEY[a]}</kbd>
              </Command.Item>
            ))}
          </Command.Group>
        )}
        <Command.Group heading="Rules">
          {rules.map((r) => (
            <Command.Item key={r.id} value={`${r.id} ${r.name}`} onSelect={run(() => onSelect(r.id))}>
              <span className="mn-dot" data-status={r.status} />
              <span className="mn-truncate">{r.name}</span>
              <span className="mn-palette-meta mn-mono">{r.id}</span>
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Filter">
          {TABS.map((t) => (
            <Command.Item key={t.key} value={`show ${t.label}`} onSelect={run(() => onStatus(t.key))}>
              Show {t.label.toLowerCase()} rules
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Assignment group">
          <Command.Item value="group all" onSelect={run(() => onGroup('all'))}>
            All groups
          </Command.Item>
          {GROUPS.map((g) => (
            <Command.Item key={g.id} value={`group ${g.name} ${g.unit}`} onSelect={run(() => onGroup(g.id))}>
              {g.name}
              <span className="mn-palette-meta">{g.unit}</span>
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Preferences">
          <Command.Item value="theme appearance light dark mode" onSelect={run(onToggleTheme)}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            Switch to {theme === 'dark' ? 'light' : 'dark'} theme
          </Command.Item>
        </Command.Group>
        <Command.Group heading="Sort">
          {SORTS.map((k) => (
            <Command.Item key={k} value={`sort ${SORT_LABEL[k]}`} onSelect={run(() => onSort(k))}>
              Sort by {SORT_LABEL[k].toLowerCase()}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
