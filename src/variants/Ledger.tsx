import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Checkbox } from '@base-ui/react/checkbox';
import { toast } from 'sonner';
import { ThinkingOrb } from 'thinking-orbs';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bell,
  BookText,
  Check,
  ChevronsUpDown,
  CircleDot,
  Filter,
  LayoutGrid,
  Search,
  Settings,
  ShieldCheck,
  Siren,
  X,
} from 'lucide-react';
import { RESOLUTION_LABEL, SOURCE_LABEL, groupById, type Rule } from '../shared/data';
import {
  ACTION_LABEL,
  LOW_CONFIDENCE,
  MIN_REASON,
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
import { WeeklyBars, useDecision, useLatest } from '../shared/ui';
import './ledger.css';

const TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'proposed', label: 'Proposed' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

export function Ledger() {
  const rules = useFreshRules();
  const { view, update, toggleSort, visible, counts } = useRuleView(rules);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rules.find((r) => r.id === selectedId) ?? null;
  const shownRule = useLatest(selected);
  const searchRef = useRef<HTMLInputElement>(null);

  const decision = useDecision((rule, action) => {
    toast.custom(() => (
      <div className="lg-toast">
        <Check size={16} strokeWidth={2.25} />
        <div>
          <div className="lg-toast-title">
            {rule.id} {action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'activate' ? 'activated' : 'deactivated'}
          </div>
          <div className="lg-toast-sub">Reason recorded in the audit log.</div>
        </div>
      </div>
    ));
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = /^(INPUT|TEXTAREA)$/.test(t.tagName);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape' && !decision.target && !typing) setSelectedId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [decision.target]);

  const gc = groupCounts(rules);

  return (
    <div className="lg">
      <aside className="lg-side">
        <div className="lg-team">
          <div className="lg-team-mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="14" height="14">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
          </div>
          <div className="lg-team-name">Imperial Ops</div>
          <ChevronsUpDown size={14} className="lg-muted" />
        </div>

        <nav className="lg-nav">
          <a className="lg-nav-item"><Siren size={16} /> Incidents</a>
          <a className="lg-nav-item"><Bell size={16} /> Alerts</a>
          <a className="lg-nav-item" data-active><Filter size={16} /> Rules</a>
          <a className="lg-nav-item"><LayoutGrid size={16} /> Services</a>
          <a className="lg-nav-item"><BookText size={16} /> Audit log</a>
          <a className="lg-nav-item"><Settings size={16} /> Settings</a>
        </nav>

        <div className="lg-side-label">Assignment groups</div>
        <div className="lg-groups">
          <button className="lg-group" data-active={view.groupId === 'all' || undefined} onClick={() => update({ groupId: 'all' })}>
            <span>All groups</span>
            <span className="lg-count">{rules.length}</span>
          </button>
          {gc.map(({ group, total, proposed }) => (
            <button
              key={group.id}
              className="lg-group"
              data-active={view.groupId === group.id || undefined}
              onClick={() => update({ groupId: group.id })}
            >
              <span className="lg-truncate">{group.name}</span>
              {proposed > 0 && <span className="lg-dot" data-status="proposed" title={`${proposed} proposed`} />}
              <span className="lg-count">{total}</span>
            </button>
          ))}
        </div>

        <div className="lg-user">
          <div className="lg-avatar">AP</div>
          <div>
            <div className="lg-user-name">Admiral Piett</div>
            <div className="lg-user-role">Rule governor</div>
          </div>
        </div>
      </aside>

      <main className="lg-main">
        <header className="lg-head">
          <div className="lg-crumbs">
            Noise suppression <span>/</span> Rules
            {view.groupId !== 'all' && (
              <>
                <span>/</span> {groupById(view.groupId).name}
              </>
            )}
          </div>
          <h1>Rules</h1>
          <p>
            Machine-generated patterns that suppress incident noise. Each one can also hide a real incident, so every change
            needs a written reason.
          </p>
        </header>

        <div className="lg-toolbar">
          <div className="lg-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={view.status === t.key}
                className="lg-tab"
                data-active={view.status === t.key || undefined}
                onClick={() => update({ status: t.key })}
              >
                {t.label}
                <span className="lg-tab-count">{counts[t.key]}</span>
              </button>
            ))}
          </div>
          <label className="lg-search">
            <Search size={14} />
            <input
              ref={searchRef}
              value={view.query}
              onChange={(e) => update({ query: e.target.value })}
              placeholder="Search rules, CIs, sources…"
            />
            {view.query ? (
              <button aria-label="Clear search" onClick={() => update({ query: '' })}>
                <X size={12} />
              </button>
            ) : (
              <kbd>/</kbd>
            )}
          </label>
        </div>

        <div className="lg-table-wrap">
          <table className="lg-table">
            <thead>
              <tr>
                <SortTh k="name" label="Rule" view={view} onSort={toggleSort} />
                <th>Assignment group</th>
                <th>Status</th>
                <SortTh k="confidence" label="Confidence" view={view} onSort={toggleSort} align="right" />
                <SortTh k="purity" label="Purity" view={view} onSort={toggleSort} align="right" />
                <SortTh k="incidents" label="Incidents" view={view} onSort={toggleSort} align="right" />
                <th>Source</th>
                <SortTh k="updated" label="Updated" view={view} onSort={toggleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.id}
                  tabIndex={0}
                  data-selected={r.id === selectedId || undefined}
                  onClick={() => setSelectedId(r.id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedId(r.id)}
                >
                  <td>
                    <div className="lg-rule-name">{r.name}</div>
                    <div className="lg-rule-id">{r.id}</div>
                  </td>
                  <td className="lg-cell-muted">{groupById(r.groupId).name}</td>
                  <td>
                    <Status rule={r} />
                  </td>
                  <td className="lg-num">
                    <span className="lg-conf">
                      {isLowConfidence(r) && <AlertTriangle size={13} className="lg-warn" aria-label="Low confidence" />}
                      {pct(r.confidence)}
                      <Meter value={r.confidence} low={isLowConfidence(r)} />
                    </span>
                  </td>
                  <td className="lg-num">{pct(r.purity)}</td>
                  <td className="lg-num">{r.incidentCount}</td>
                  <td className="lg-cell-muted">{SOURCE_LABEL[r.source]}</td>
                  <td className="lg-num lg-cell-muted">{ago(r.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <div className="lg-empty">
              <div>No rules match</div>
              <p>Try a different search or clear the group filter.</p>
              <button className="lg-btn" onClick={() => update({ query: '', groupId: 'all', status: 'all' })}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </main>

      <aside className="lg-inspector" data-open={!!selected || undefined} aria-hidden={!selected}>
        {shownRule && <Inspector rule={selected ?? shownRule} onClose={() => setSelectedId(null)} onAction={decision.open} />}
      </aside>

      <ActionDialog decision={decision} />
    </div>
  );
}

function SortTh({
  k,
  label,
  view,
  onSort,
  align,
}: {
  k: SortKey;
  label: string;
  view: { sort: SortKey; dir: 'asc' | 'desc' };
  onSort: (k: SortKey) => void;
  align?: 'right';
}) {
  const active = view.sort === k;
  return (
    <th className={align === 'right' ? 'lg-th-right' : undefined} aria-sort={active ? (view.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button className="lg-th-btn" data-active={active || undefined} onClick={() => onSort(k)}>
        {label}
        {active ? view.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ChevronsUpDown size={12} className="lg-th-idle" />}
      </button>
    </th>
  );
}

function Status({ rule }: { rule: Rule }) {
  return (
    <span className="lg-status">
      <span className="lg-dot" data-status={rule.status} />
      {statusLabel(rule)}
    </span>
  );
}

function Meter({ value, low }: { value: number; low: boolean }) {
  return (
    <span className="lg-meter" data-low={low || undefined} aria-hidden>
      <span style={{ transform: `scaleX(${value})` }} />
    </span>
  );
}

function Inspector({
  rule,
  onClose,
  onAction,
}: {
  rule: Rule;
  onClose: () => void;
  onAction: (rule: Rule, action: RuleAction) => void;
}) {
  const g = groupById(rule.groupId);
  const escalated = rule.related.filter((i) => i.resolution === 'escalated');
  return (
    <div className="lg-insp">
      <div className="lg-insp-head">
        <div className="lg-insp-meta">
          <span className="lg-rule-id">{rule.id}</span>
          <Status rule={rule} />
        </div>
        <button className="lg-icon-btn" onClick={onClose} aria-label="Close inspector">
          <X size={16} />
        </button>
      </div>
      <div className="lg-insp-body">
        <h2>{rule.name}</h2>
        <div className="lg-scope">
          <ShieldCheck size={14} />
          Scoped to <strong>{g.name}</strong> · {g.unit}
        </div>

        <div className="lg-stats">
          <div className="lg-stat">
            <div className="lg-stat-label">Confidence</div>
            <div className="lg-stat-value">
              {pct(rule.confidence)}
              {isLowConfidence(rule) && <span className="lg-pill-warn">Below {pct(LOW_CONFIDENCE)}</span>}
            </div>
          </div>
          <div className="lg-stat">
            <div className="lg-stat-label">Purity</div>
            <div className="lg-stat-value">{pct(rule.purity)}</div>
          </div>
          <div className="lg-stat">
            <div className="lg-stat-label">Incidents</div>
            <div className="lg-stat-value">{rule.incidentCount}</div>
          </div>
          <div className="lg-stat">
            <div className="lg-stat-label">Escalated</div>
            <div className="lg-stat-value" data-bad={rule.evidence.escalations > 0 || undefined}>
              {rule.evidence.escalations}
            </div>
          </div>
        </div>

        <section className="lg-sec">
          <h3>Evidence</h3>
          <p className="lg-summary">{rule.evidence.summary}</p>
          {escalated.length > 0 && (
            <div className="lg-callout">
              <AlertTriangle size={14} />
              <div>
                This pattern matched {escalated.length === 1 ? 'a real incident' : `${escalated.length} real incidents`}:{' '}
                <strong>{escalated[0].title}</strong> ({escalated[0].id}).
              </div>
            </div>
          )}
          <div className="lg-code">
            {rule.evidence.conditions.map((c, i) => (
              <div key={i}>
                <span className="lg-code-kw">{i === 0 ? 'where' : 'and'}</span> {c.field}{' '}
                <span className="lg-code-op">{c.op}</span> <span className="lg-code-val">{c.value}</span>
              </div>
            ))}
          </div>
          <dl className="lg-kv">
            <dt>Source</dt>
            <dd>{rule.sourceDetail}</dd>
            <dt>Window</dt>
            <dd>{rule.evidence.window}</dd>
            <dt>Median clear</dt>
            <dd>{rule.evidence.medianClear}</dd>
            <dt>Recurrence</dt>
            <dd>{rule.evidence.recurrence}</dd>
          </dl>
        </section>

        <section className="lg-sec">
          <h3>
            Matched incidents per week <span className="lg-h-note">{rule.incidentCount} total</span>
          </h3>
          <WeeklyBars data={rule.evidence.weekly} className="lg-wb" />
        </section>

        <section className="lg-sec">
          <h3>Related incidents</h3>
          <ul className="lg-incidents">
            {rule.related.map((i) => (
              <li key={i.id} data-escalated={i.resolution === 'escalated' || undefined}>
                <span className="lg-rule-id">{i.id}</span>
                <span className="lg-truncate">{i.title}</span>
                <span className="lg-res" data-res={i.resolution}>
                  {RESOLUTION_LABEL[i.resolution]}
                </span>
                <span className="lg-cell-muted lg-inc-date">{shortDate(i.openedAt)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="lg-sec">
          <h3>History</h3>
          <ol className="lg-timeline">
            {[...rule.audit].reverse().map((a, i) => (
              <li key={i}>
                <div className="lg-tl-head">
                  <strong>{a.actor}</strong> {a.action}
                  {a.override && <span className="lg-pill-warn">Override</span>}
                  <span className="lg-cell-muted">{ago(a.at)}</span>
                </div>
                <p>{a.reason}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <div className="lg-insp-foot">
        {actionsFor(rule).map((a) => (
          <button key={a} className="lg-btn" data-variant={turnsOn(a) ? 'primary' : undefined} onClick={() => onAction(rule, a)}>
            {ACTION_LABEL[a]}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionDialog({ decision }: { decision: ReturnType<typeof useDecision> }) {
  const shown = useLatest(decision.target);
  const [ack, setAck] = useState(false);
  const [typed, setTyped] = useState('');
  const backtest = useBacktest(decision.target?.rule ?? null, !!decision.target && turnsOn(decision.target.action));

  useEffect(() => {
    setAck(false);
    setTyped('');
  }, [decision.target]);

  const syncOverride = (nextAck: boolean, nextTyped: string) => {
    setAck(nextAck);
    setTyped(nextTyped);
    decision.setOverride(nextAck && nextTyped.trim().toUpperCase() === shown?.rule.id);
  };

  if (!shown) return null;
  const { rule, action } = shown;
  const g = groupById(rule.groupId);
  const override = needsOverride(rule, action);
  const errs = decision.check?.errors ?? {};
  const len = decision.reason.trim().length;

  return (
    <Dialog.Root open={!!decision.target} onOpenChange={(o) => !o && decision.close()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="lg-backdrop" />
        <Dialog.Popup className="lg-dialog">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              decision.submit();
            }}
          >
            <div className="lg-dialog-body">
              <Dialog.Title className="lg-dialog-title">
                {ACTION_LABEL[action]} {rule.id}
              </Dialog.Title>
              <Dialog.Description className="lg-dialog-desc">{rule.name}</Dialog.Description>

              <div className="lg-scope lg-scope-box">
                <ShieldCheck size={14} />
                <span>
                  {turnsOn(action) ? 'Will suppress' : 'Will stop suppressing'} matching incidents routed to{' '}
                  <strong>{g.name}</strong> only.
                </span>
              </div>

              {turnsOn(action) && (
                <div className="lg-backtest" aria-live="polite">
                  {backtest ? (
                    <>
                      <CircleDot size={14} />
                      <span>
                        Over 90 days this would have hidden <strong>{backtest.suppressed}</strong> incidents
                        {backtest.escalated > 0 ? (
                          <>
                            , including <strong className="lg-bad">{backtest.escalated} escalated</strong>.
                          </>
                        ) : (
                          <>, none escalated.</>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <ThinkingOrb state="searching" size={20} theme="light" aria-hidden="true" />
                      <span className="lg-cell-muted">Backtesting against 90 days of incidents…</span>
                    </>
                  )}
                </div>
              )}

              <label className="lg-field">
                <span className="lg-label">
                  Reason <span className="lg-cell-muted">required</span>
                </span>
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
                  aria-invalid={(decision.attempted && !!errs.reason) || undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      decision.submit();
                    }
                  }}
                />
                <span className="lg-hint">
                  {decision.attempted && errs.reason ? (
                    <span className="lg-bad">{errs.reason}</span>
                  ) : (
                    <span>Stored in the audit log with your name.</span>
                  )}
                  <span className="lg-cell-muted">
                    {Math.min(len, MIN_REASON)}/{MIN_REASON}
                  </span>
                </span>
              </label>

              {override && (
                <div className="lg-override" data-invalid={(decision.attempted && !!errs.override) || undefined}>
                  <div className="lg-override-head">
                    <AlertTriangle size={14} />
                    Low confidence override
                  </div>
                  <p>
                    Confidence is {pct(rule.confidence)}, below the {pct(LOW_CONFIDENCE)} floor. Activating it may hide real
                    incidents from {g.name}.
                  </p>
                  <label className="lg-check">
                    <Checkbox.Root className="lg-checkbox" checked={ack} onCheckedChange={(c) => syncOverride(c, typed)}>
                      <Checkbox.Indicator className="lg-checkbox-ind">
                        <Check size={12} strokeWidth={3} />
                      </Checkbox.Indicator>
                    </Checkbox.Root>
                    I understand and take responsibility for this override
                  </label>
                  <label className="lg-field lg-field-tight">
                    <span className="lg-label">
                      Type <code>{rule.id}</code> to confirm
                    </span>
                    <input
                      value={typed}
                      onChange={(e) => syncOverride(ack, e.target.value)}
                      placeholder={rule.id}
                      spellCheck={false}
                      disabled={!ack}
                    />
                  </label>
                  {decision.attempted && errs.override && <span className="lg-bad lg-hint">{errs.override}</span>}
                </div>
              )}
            </div>
            <div className="lg-dialog-foot">
              <span className="lg-cell-muted lg-kbd-hint">
                <kbd>⌘</kbd>
                <kbd>↵</kbd> to confirm
              </span>
              <Dialog.Close className="lg-btn" type="button">
                Cancel
              </Dialog.Close>
              <button
                className="lg-btn"
                data-variant={action === 'reject' || action === 'deactivate' ? 'danger' : 'primary'}
                type="submit"
                disabled={!decision.check?.ok}
              >
                {ACTION_LABEL[action]} rule
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

