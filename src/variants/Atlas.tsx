import { useMemo, useState } from 'react';
import { Accordion } from '@base-ui/react/accordion';
import { Checkbox } from '@base-ui/react/checkbox';
import { Menu } from '@base-ui/react/menu';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '@base-ui/react/toggle';
import NumberFlow from '@number-flow/react';
import { toast } from 'sonner';
import { ThinkingOrb } from 'thinking-orbs';
import {
  AlertTriangle,
  ArrowDownWideNarrow,
  Check,
  ChevronRight,
  Layers,
  Orbit,
  Search,
  ShieldAlert,
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
import './atlas.css';

const UNITS = [...new Set(GROUPS.map((g) => g.unit))];

export function Atlas() {
  const rules = useFreshRules();
  const { view, update, visible, counts } = useRuleView(rules, { sort: 'incidents', dir: 'desc' });
  const [openRow, setOpenRow] = useState<string[]>([]);

  const decision = useDecision((rule, action) => {
    toast.custom(() => (
      <div className="at-toast">
        <span className="at-toast-icon">
          <Check size={14} strokeWidth={2.5} />
        </span>
        <div>
          <div className="at-toast-title">
            {rule.id} {ACTION_PAST[action]}
          </div>
          <div className="at-toast-sub">
            Scope {groupById(rule.groupId).name} · reason saved to history
          </div>
        </div>
      </div>
    ));
  });

  const scoped = useMemo(
    () => (view.groupId === 'all' ? rules : rules.filter((r) => r.groupId === view.groupId)),
    [rules, view.groupId],
  );
  const stats = useMemo(() => {
    const active = scoped.filter((r) => r.status === 'active');
    const weekly = Array.from({ length: 12 }, (_, i) =>
      active.reduce((s, r) => s + Math.round(r.evidence.weekly[i] * r.purity), 0),
    );
    return {
      active: active.length,
      proposed: scoped.filter((r) => r.status === 'proposed').length,
      suppressed: weekly.reduce((a, b) => a + b, 0),
      weekly,
      lowProposals: scoped.filter((r) => r.status === 'proposed' && isLowConfidence(r)).length,
    };
  }, [scoped]);

  const sections = GROUPS.map((g) => ({ group: g, rules: visible.filter((r) => r.groupId === g.id) })).filter(
    (s) => s.rules.length > 0,
  );

  const scopeGroup = view.groupId === 'all' ? null : groupById(view.groupId);

  return (
    <div className="at">
      <aside className="at-side">
        <div className="at-brand">
          <Orbit size={18} />
          <span>Imperial Ops</span>
          <span className="at-env">Governance</span>
        </div>

        <div className="at-side-label">
          <Layers size={13} /> Scopes
        </div>
        <button className="at-scope" data-active={view.groupId === 'all' || undefined} onClick={() => update({ groupId: 'all' })}>
          <span>All assignment groups</span>
          <span className="at-scope-count">{rules.length}</span>
        </button>
        <div className="at-tree">
          {UNITS.map((unit) => (
            <div key={unit} className="at-unit">
              <div className="at-unit-name">{unit}</div>
              {GROUPS.filter((g) => g.unit === unit).map((g) => {
                const rs = rules.filter((r) => r.groupId === g.id);
                const proposed = rs.filter((r) => r.status === 'proposed').length;
                return (
                  <button
                    key={g.id}
                    className="at-scope at-scope-leaf"
                    data-active={view.groupId === g.id || undefined}
                    onClick={() => update({ groupId: g.id })}
                  >
                    <span className="at-truncate">{g.name}</span>
                    {proposed > 0 && <span className="at-badge">{proposed}</span>}
                    <span className="at-scope-count">{rs.length}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="at-me">
          <div className="at-me-avatar">AP</div>
          <div>
            <div>Admiral Piett</div>
            <div className="at-me-role">Governs all scopes</div>
          </div>
        </div>
      </aside>

      <main className="at-main">
        <header className="at-head">
          <div className="at-crumbs">
            <button onClick={() => update({ groupId: 'all' })}>Rule management</button>
            {scopeGroup && (
              <>
                <ChevronRight size={14} />
                <span>{scopeGroup.unit}</span>
                <ChevronRight size={14} />
                <strong>{scopeGroup.name}</strong>
              </>
            )}
          </div>
          <h1>{scopeGroup ? scopeGroup.name : 'Rule management'}</h1>
        </header>

        <div className="at-tiles">
          <Tile label="Active rules" value={stats.active} />
          <Tile label="Awaiting review" value={stats.proposed} accent />
          <Tile label="Incidents suppressed, 12 wk" value={stats.suppressed} spark={stats.weekly} />
          <Tile label="Low-confidence proposals" value={stats.lowProposals} warn={stats.lowProposals > 0} />
        </div>

        <div className="at-filters">
          <ToggleGroup
            className="at-seg"
            value={[view.status]}
            onValueChange={(v) => v[0] && update({ status: v[0] as StatusFilter })}
            aria-label="Filter by status"
          >
            {(['all', 'proposed', 'active', 'inactive'] as StatusFilter[]).map((s) => (
              <Toggle key={s} value={s} className="at-seg-item">
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
                <span className="at-seg-count">{counts[s]}</span>
              </Toggle>
            ))}
          </ToggleGroup>

          <label className="at-search">
            <Search size={15} />
            <input value={view.query} onChange={(e) => update({ query: e.target.value })} placeholder="Filter rules in scope" />
          </label>

          <Menu.Root>
            <Menu.Trigger className="at-btn at-btn-ghost">
              <ArrowDownWideNarrow size={15} />
              {SORT_LABEL[view.sort]}
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner sideOffset={6} align="end">
                <Menu.Popup className="at-menu">
                  <div className="at-menu-label">Sort by</div>
                  <Menu.RadioGroup value={view.sort} onValueChange={(v) => update({ sort: v as SortKey, dir: v === 'name' ? 'asc' : 'desc' })}>
                    {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                      <Menu.RadioItem key={k} value={k} className="at-menu-item" closeOnClick>
                        <Menu.RadioItemIndicator className="at-menu-ind">
                          <Check size={13} />
                        </Menu.RadioItemIndicator>
                        {SORT_LABEL[k]}
                      </Menu.RadioItem>
                    ))}
                  </Menu.RadioGroup>
                  <Menu.Separator className="at-menu-sep" />
                  <Menu.RadioGroup value={view.dir} onValueChange={(v) => update({ dir: v as 'asc' | 'desc' })}>
                    <Menu.RadioItem value="desc" className="at-menu-item" closeOnClick>
                      <Menu.RadioItemIndicator className="at-menu-ind">
                        <Check size={13} />
                      </Menu.RadioItemIndicator>
                      Highest first
                    </Menu.RadioItem>
                    <Menu.RadioItem value="asc" className="at-menu-item" closeOnClick>
                      <Menu.RadioItemIndicator className="at-menu-ind">
                        <Check size={13} />
                      </Menu.RadioItemIndicator>
                      Lowest first
                    </Menu.RadioItem>
                  </Menu.RadioGroup>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </div>

        <Accordion.Root value={openRow} onValueChange={(v) => setOpenRow(v as string[])} className="at-sections">
          {sections.map(({ group, rules: rs }) => (
            <section key={group.id} className="at-section">
              <header className="at-section-head">
                <div>
                  <h2>{group.name}</h2>
                  <span>{group.unit}</span>
                </div>
                <div className="at-section-meta">
                  {rs.length} {rs.length === 1 ? 'rule' : 'rules'}
                  {rs.some((r) => r.status === 'proposed') && (
                    <span className="at-badge">{rs.filter((r) => r.status === 'proposed').length} to review</span>
                  )}
                </div>
              </header>
              <div className="at-colheads" aria-hidden>
                <span />
                <span>Rule</span>
                <span>Status</span>
                <span>Confidence</span>
                <span>Purity</span>
                <span>Incidents</span>
                <span>Source</span>
                <span>Updated</span>
              </div>
              {rs.map((r) => (
                <Accordion.Item key={r.id} value={r.id} className="at-item">
                  <Accordion.Header className="at-item-header">
                    <Accordion.Trigger className="at-row">
                      <ChevronRight size={15} className="at-chev" />
                      <span className="at-row-name">
                        <span className="at-truncate">{r.name}</span>
                        <span className="at-id">{r.id}</span>
                      </span>
                      <span>
                        <StatusPill rule={r} />
                      </span>
                      <span className="at-confcell" data-low={isLowConfidence(r) || undefined}>
                        <span className="at-meter">
                          <span style={{ transform: `scaleX(${r.confidence})` }} />
                        </span>
                        {pct(r.confidence)}
                        {isLowConfidence(r) && <AlertTriangle size={13} aria-label="Low confidence" />}
                      </span>
                      <span className="at-num">{pct(r.purity)}</span>
                      <span className="at-num">{r.incidentCount}</span>
                      <span className="at-muted at-truncate">{SOURCE_LABEL[r.source]}</span>
                      <span className="at-muted">{ago(r.updatedAt)}</span>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="at-panel">
                    <Expanded rule={r} decision={decision} />
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </section>
          ))}
          {sections.length === 0 && (
            <div className="at-empty">
              <ShieldAlert size={20} />
              <div>No rules in this scope match.</div>
              <button className="at-btn" onClick={() => update({ query: '', status: 'all' })}>
                Reset filters
              </button>
            </div>
          )}
        </Accordion.Root>
      </main>
    </div>
  );
}

function Tile({
  label,
  value,
  spark,
  accent,
  warn,
}: {
  label: string;
  value: number;
  spark?: number[];
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="at-tile" data-accent={accent || undefined} data-warn={warn || undefined}>
      <div className="at-tile-label">{label}</div>
      <div className="at-tile-row">
        <NumberFlow value={value} className="at-tile-value" format={{ useGrouping: true }} />
        {spark && <Spark data={spark} />}
      </div>
    </div>
  );
}

/* 12-point sparkline: history in the de-emphasis hue, the latest point in the accent. */
function Spark({ data }: { data: number[] }) {
  const w = 96;
  const h = 28;
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * (w - 6) + 3, h - 3 - (v / max) * (h - 6)]);
  const last = pts[pts.length - 1];
  return (
    <svg className="at-spark" width={w} height={h} role="img" aria-label={`Weekly suppressed incidents, latest ${data[data.length - 1]}`}>
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="4" />
    </svg>
  );
}

function StatusPill({ rule }: { rule: Rule }) {
  return (
    <span className="at-pill" data-status={rule.status}>
      <span className="at-pill-dot" />
      {statusLabel(rule)}
    </span>
  );
}

function Expanded({ rule, decision }: { rule: Rule; decision: ReturnType<typeof useDecision> }) {
  const g = groupById(rule.groupId);
  const mine = decision.target?.rule.id === rule.id ? decision.target : null;
  const escalated = rule.related.filter((i) => i.resolution === 'escalated');

  return (
    <div className="at-exp">
      <div className="at-exp-col">
        <h3>Evidence</h3>
        <p className="at-summary">{rule.evidence.summary}</p>
        <div className="at-conds">
          {rule.evidence.conditions.map((c, i) => (
            <span key={i} className="at-cond">
              <span>{c.field}</span> {c.op} <strong>{c.value}</strong>
            </span>
          ))}
          <span className="at-cond at-cond-scope">
            <span>assignment_group</span> = <strong>{g.name}</strong>
          </span>
        </div>
        <dl className="at-kv">
          <dt>Source</dt>
          <dd>{rule.sourceDetail}</dd>
          <dt>Window</dt>
          <dd>{rule.evidence.window}</dd>
          <dt>Clears in</dt>
          <dd>{rule.evidence.medianClear} median</dd>
          <dt>Pattern</dt>
          <dd>{rule.evidence.recurrence}</dd>
        </dl>
        <h3 className="at-h3-gap">History</h3>
        <ol className="at-history">
          {[...rule.audit].reverse().map((a, i) => (
            <li key={i}>
              <span className="at-hist-action" data-action={a.action}>
                {a.action}
              </span>
              <div>
                <div className="at-hist-head">
                  {a.actor} · {ago(a.at)}
                  {a.override && <span className="at-override-tag">override</span>}
                </div>
                <div className="at-hist-reason">{a.reason}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="at-exp-col">
        <h3>
          Matched per week <span className="at-muted">{rule.incidentCount} total</span>
        </h3>
        <WeeklyBars data={rule.evidence.weekly} height={80} className="at-wb" />
        <h3 className="at-h3-gap">
          Related incidents{' '}
          {escalated.length > 0 && <span className="at-esc-count">{escalated.length} escalated</span>}
        </h3>
        <ul className="at-related">
          {rule.related.slice(0, 7).map((i) => (
            <li key={i.id} data-escalated={i.resolution === 'escalated' || undefined}>
              <span className="at-truncate">{i.title}</span>
              <span className="at-related-meta">
                {i.id} · {shortDate(i.openedAt)} · <span data-res={i.resolution}>{RESOLUTION_LABEL[i.resolution]}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="at-exp-col at-decide">
        <h3>Decision</h3>
        {mine ? (
          <DecisionForm rule={rule} action={mine.action} decision={decision} />
        ) : (
          <div className="at-decide-idle">
            <p>
              {rule.status === 'proposed'
                ? 'This proposal needs a decision before it can suppress anything.'
                : rule.status === 'active'
                  ? `Suppressing matching incidents for ${g.name}.`
                  : `Not suppressing. Matching incidents page ${g.name}.`}
            </p>
            <div className="at-decide-actions">
              {actionsFor(rule).map((a) => (
                <button
                  key={a}
                  className="at-btn"
                  data-variant={turnsOn(a) ? 'primary' : 'danger'}
                  onClick={() => decision.open(rule, a)}
                >
                  {ACTION_LABEL[a]}
                </button>
              ))}
            </div>
            {isLowConfidence(rule) && rule.status !== 'active' && (
              <p className="at-note">
                <AlertTriangle size={13} /> Below {pct(LOW_CONFIDENCE)} confidence: activation needs an override.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionForm({ rule, action, decision }: { rule: Rule; action: RuleAction; decision: ReturnType<typeof useDecision> }) {
  const backtest = useBacktest(rule, turnsOn(action));
  const needs = needsOverride(rule, action);
  const errs = decision.check?.errors ?? {};
  const len = decision.reason.trim().length;
  const escalated = rule.related.filter((i) => i.resolution === 'escalated');

  return (
    <form
      className="at-form"
      onSubmit={(e) => {
        e.preventDefault();
        decision.submit();
      }}
    >
      <div className="at-form-head" data-kind={turnsOn(action) ? 'on' : 'off'}>
        {ACTION_LABEL[action]} · <span>{turnsOn(action) ? 'starts suppressing' : 'stops suppressing'}</span>
      </div>

      {turnsOn(action) && (
        <div className="at-backtest" aria-live="polite">
          {backtest ? (
            <>
              <div>
                <b>{backtest.suppressed}</b>
                <span>hidden, 90d</span>
              </div>
              <div data-bad={backtest.escalated > 0 || undefined}>
                <b>{backtest.escalated}</b>
                <span>escalated</span>
              </div>
              <div>
                <b>{backtest.hoursSaved}h</b>
                <span>triage saved</span>
              </div>
            </>
          ) : (
            <span className="at-backtest-wait">
              <ThinkingOrb state="working" size={20} theme="light" aria-hidden="true" />
              Simulating 90 days in {groupById(rule.groupId).name}…
            </span>
          )}
        </div>
      )}

      <label className="at-field">
        <span>Reason</span>
        <textarea
          autoFocus
          rows={3}
          value={decision.reason}
          onChange={(e) => decision.setReason(e.target.value)}
          placeholder="Required. What in the evidence supports this?"
          aria-invalid={(decision.attempted && !!errs.reason) || undefined}
        />
        <span className="at-field-foot">
          {decision.attempted && errs.reason ? <span className="at-bad">{errs.reason}</span> : <span />}
          <span className="at-progress" aria-hidden>
            <span style={{ transform: `scaleX(${Math.min(1, len / MIN_REASON)})` }} />
          </span>
        </span>
      </label>

      {needs && (
        <div className="at-override" data-invalid={(decision.attempted && !!errs.override) || undefined}>
          <div className="at-override-head">
            <AlertTriangle size={14} /> Override low confidence ({pct(rule.confidence)})
          </div>
          {escalated.length > 0 && (
            <p>
              Would have hidden: <strong>{escalated[0].title}</strong> ({escalated[0].id})
            </p>
          )}
          <label className="at-check">
            <Checkbox.Root className="at-checkbox" checked={decision.override} onCheckedChange={decision.setOverride}>
              <Checkbox.Indicator className="at-checkbox-ind">
                <Check size={12} strokeWidth={3} />
              </Checkbox.Indicator>
            </Checkbox.Root>
            I override the {pct(LOW_CONFIDENCE)} confidence floor for {groupById(rule.groupId).name}
          </label>
        </div>
      )}

      <div className="at-form-actions">
        <button type="button" className="at-btn at-btn-ghost" onClick={decision.close}>
          Cancel
        </button>
        <button
          type="submit"
          className="at-btn"
          data-variant={turnsOn(action) ? 'primary' : 'danger'}
          disabled={!decision.check?.ok}
        >
          Confirm {ACTION_LABEL[action].toLowerCase()}
        </button>
      </div>
    </form>
  );
}
