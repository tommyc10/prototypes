import { useEffect, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Select } from '@base-ui/react/select';
import { Switch } from '@base-ui/react/switch';
import { toast } from 'sonner';
import { ThinkingOrb } from 'thinking-orbs';
import { Check, ChevronDown, X } from 'lucide-react';
import { GROUPS, RESOLUTION_LABEL, SOURCE_LABEL, groupById, type Rule, type RuleStatus } from '../shared/data';
import {
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
  wasRejected,
  type RuleAction,
  type SortKey,
  type StatusFilter,
} from '../shared/store';
import { WeeklyBars, useDecision, useLatest } from '../shared/ui';
import './dossier.css';

const COLUMNS: { status: RuleStatus; title: string; note: string }[] = [
  { status: 'proposed', title: 'Proposed', note: 'Awaiting a decision' },
  { status: 'active', title: 'Active', note: 'Suppressing incidents now' },
  { status: 'inactive', title: 'Inactive', note: 'Rejected or switched off' },
];

const VIEWS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Board' },
  { key: 'proposed', label: 'Proposed' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const VERB: Record<RuleAction, { label: string; note: string }> = {
  approve: { label: 'Approve', note: 'The rule becomes active and starts suppressing.' },
  reject: { label: 'Reject', note: 'The proposal is closed. Nothing is suppressed.' },
  activate: { label: 'Activate', note: 'Suppression resumes for this group.' },
  deactivate: { label: 'Deactivate', note: 'Matching incidents page the group again.' },
};

const GROUP_ITEMS = [{ label: 'All assignment groups', value: 'all' }, ...GROUPS.map((g) => ({ label: g.name, value: g.id }))];
const SORT_ITEMS = (Object.keys(SORT_LABEL) as SortKey[]).map((k) => ({ label: SORT_LABEL[k], value: k }));

export function Dossier() {
  const rules = useFreshRules();
  const { view, update, visible, counts } = useRuleView(rules, { sort: 'confidence', dir: 'asc' });
  const [openId, setOpenId] = useState<string | null>(null);
  const open = rules.find((r) => r.id === openId) ?? null;
  const shown = useLatest(open);

  return (
    <div className="ds">
      <aside className="ds-side">
        <div className="ds-mark">
          <div className="ds-mark-title">Imperial Registry</div>
          <div className="ds-mark-sub">Incident noise governance</div>
        </div>
        <nav className="ds-nav">
          <a className="ds-nav-item">
            Review queue <span className="ds-nav-badge">{rules.filter((r) => r.status === 'proposed').length}</span>
          </a>
          <a className="ds-nav-item" data-active>
            Suppression rules
          </a>
          <a className="ds-nav-item">Incidents</a>
          <a className="ds-nav-item">Assignment groups</a>
          <a className="ds-nav-item">Record of changes</a>
        </nav>
        <div className="ds-side-note">
          <div className="ds-eyebrow">Standing order</div>
          <p>
            Rules below {pct(LOW_CONFIDENCE)} confidence may only be activated with a signed override. Every decision
            carries a written reason.
          </p>
        </div>
        <div className="ds-signed">
          <span className="ds-eyebrow">Signed in as</span>
          <span className="ds-serif">Admiral Piett</span>
        </div>
      </aside>

      <main className="ds-main">
        <header className="ds-head">
          <div className="ds-eyebrow">Rule governance · Monday 28 September</div>
          <h1>Suppression rules</h1>
          <p className="ds-lede">
            Patterns that decide which incidents never reach a person. Read the evidence before you sign.
          </p>
          <div className="ds-tally">
            <span>
              <em>{counts.proposed}</em> awaiting review
            </span>
            <span>
              <em>{counts.active}</em> active
            </span>
            <span>
              <em>{counts.inactive}</em> inactive
            </span>
          </div>
        </header>

        <div className="ds-toolbar">
          <div className="ds-views" role="tablist">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                role="tab"
                aria-selected={view.status === v.key}
                data-active={view.status === v.key || undefined}
                className="ds-view"
                onClick={() => update({ status: v.key })}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="ds-tools">
            <input
              className="ds-search"
              value={view.query}
              onChange={(e) => update({ query: e.target.value })}
              placeholder="Search the registry"
            />
            <PaperSelect
              label="Group"
              items={GROUP_ITEMS}
              value={view.groupId}
              onChange={(v) => update({ groupId: v })}
            />
            <PaperSelect
              label="Order"
              items={SORT_ITEMS}
              value={view.sort}
              onChange={(v) => update({ sort: v as SortKey, dir: v === 'name' || v === 'confidence' ? 'asc' : 'desc' })}
            />
          </div>
        </div>

        {view.status === 'all' ? (
          <div className="ds-board">
            {COLUMNS.map((c) => {
              const items = visible.filter((r) => r.status === c.status);
              return (
                <section key={c.status} className="ds-col" data-status={c.status}>
                  <header className="ds-col-head">
                    <h2>
                      {c.title} <span>{items.length}</span>
                    </h2>
                    <p>{c.note}</p>
                  </header>
                  <div className="ds-cards">
                    {items.map((r) => (
                      <Card key={r.id} rule={r} onOpen={() => setOpenId(r.id)} />
                    ))}
                    {items.length === 0 && <div className="ds-none">Nothing here.</div>}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="ds-grid">
            {visible.map((r) => (
              <Card key={r.id} rule={r} onOpen={() => setOpenId(r.id)} wide />
            ))}
            {visible.length === 0 && <div className="ds-none">No rules match this search.</div>}
          </div>
        )}
      </main>

      <Dialog.Root open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="ds-backdrop" />
          <Dialog.Popup className="ds-sheet">{shown && <Sheet rule={open ?? shown} />}</Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function PaperSelect({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select.Root items={items} value={value} onValueChange={(v) => v && onChange(v as string)}>
      <Select.Trigger className="ds-select" aria-label={label}>
        <span className="ds-select-label">{label}</span>
        <Select.Value />
        <Select.Icon className="ds-select-icon">
          <ChevronDown size={14} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={6} alignItemWithTrigger={false} align="end">
          <Select.Popup className="ds-popup">
            <Select.List>
              {items.map((it) => (
                <Select.Item key={it.value} value={it.value} className="ds-option">
                  <Select.ItemIndicator className="ds-option-ind">
                    <Check size={13} />
                  </Select.ItemIndicator>
                  <Select.ItemText>{it.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function Card({ rule, onOpen, wide }: { rule: Rule; onOpen: () => void; wide?: boolean }) {
  const g = groupById(rule.groupId);
  const low = isLowConfidence(rule);
  return (
    <button className="ds-card" data-low={low || undefined} data-wide={wide || undefined} onClick={onOpen}>
      <div className="ds-card-top">
        <span className="ds-id">{rule.id}</span>
        {(wide || wasRejected(rule)) && <span className="ds-state" data-status={rule.status}>{statusLabel(rule)}</span>}
        {low && <span className="ds-low">Low confidence</span>}
      </div>
      <h3>{rule.name}</h3>
      <div className="ds-card-group">
        {g.name}, <span>{g.unit}</span>
      </div>
      <div className="ds-figs">
        <div>
          <b>{Math.round(rule.confidence * 100)}</b>
          <span>confidence</span>
        </div>
        <div>
          <b>{Math.round(rule.purity * 100)}</b>
          <span>purity</span>
        </div>
        <div>
          <b>{rule.incidentCount}</b>
          <span>incidents</span>
        </div>
      </div>
      <div className="ds-card-foot">
        {SOURCE_LABEL[rule.source]} · {ago(rule.updatedAt)}
        {rule.evidence.escalations > 0 && (
          <span className="ds-card-esc">
            {rule.evidence.escalations} escalated match{rule.evidence.escalations > 1 ? 'es' : ''}
          </span>
        )}
      </div>
    </button>
  );
}

function Sheet({ rule }: { rule: Rule }) {
  const g = groupById(rule.groupId);
  const escalatedIds = new Set(rule.related.filter((i) => i.resolution === 'escalated').map((i) => i.id));
  return (
    <div className="ds-sheet-inner">
      <div className="ds-sheet-bar">
        <span className="ds-eyebrow">
          Dossier {rule.id} · {g.name}, {g.unit}
        </span>
        <Dialog.Close className="ds-close" aria-label="Close dossier">
          <X size={18} />
        </Dialog.Close>
      </div>

      <div className="ds-sheet-grid">
        <article className="ds-article">
          <div className="ds-state" data-status={rule.status}>
            {statusLabel(rule)}
          </div>
          <Dialog.Title className="ds-sheet-title">{rule.name}</Dialog.Title>
          <Dialog.Description className="ds-dropcap">{rule.evidence.summary}</Dialog.Description>

          <section className="ds-exhibit">
            <h4>
              <span>Exhibit A</span> The pattern
            </h4>
            <ol className="ds-conds">
              {rule.evidence.conditions.map((c, i) => (
                <li key={i}>
                  <code>{c.field}</code> {c.op} <strong>{c.value}</strong>
                </li>
              ))}
              <li className="ds-scope-cond">
                <code>assignment_group</code> = <strong>{g.name}</strong>
                <span> fixed scope; this rule never touches other groups</span>
              </li>
            </ol>
            <p className="ds-footnote">
              {rule.source === 'operator' ? rule.sourceDetail : `Proposed by ${rule.sourceDetail}`} on {shortDate(rule.createdAt)}. Evidence window: {rule.evidence.window.toLowerCase()}.
              Median time to clear {rule.evidence.medianClear}; recurs {rule.evidence.recurrence.toLowerCase()}.
            </p>
          </section>

          <section className="ds-exhibit">
            <h4>
              <span>Exhibit B</span> Matched incidents per week
            </h4>
            <WeeklyBars data={rule.evidence.weekly} height={96} className="ds-wb" />
          </section>

          <section className="ds-exhibit">
            <h4>
              <span>Exhibit C</span> Related incidents
            </h4>
            <ol className="ds-incidents">
              {rule.related.map((i) => (
                <li key={i.id} data-escalated={escalatedIds.has(i.id) || undefined}>
                  <span className="ds-inc-title">
                    {i.title}
                    {escalatedIds.has(i.id) && <sup>†</sup>}
                  </span>
                  <span className="ds-inc-meta">
                    {i.id} · {shortDate(i.openedAt)} · {RESOLUTION_LABEL[i.resolution]}
                  </span>
                </li>
              ))}
            </ol>
            {escalatedIds.size > 0 && (
              <p className="ds-footnote">† A real incident. Suppression would have hidden it from {g.name}.</p>
            )}
          </section>

          <section className="ds-exhibit">
            <h4>
              <span>The record</span>
            </h4>
            <ol className="ds-record">
              {[...rule.audit].reverse().map((a, i) => (
                <li key={i}>
                  <div className="ds-record-date">{shortDate(a.at)}</div>
                  <div>
                    <div className="ds-record-head">
                      <strong>{a.actor}</strong> {a.action} the rule
                      {a.override && <span className="ds-low">with override</span>}
                    </div>
                    <blockquote>{a.reason}</blockquote>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </article>

        <aside className="ds-aside">
          <div className="ds-figures">
            <Figure label="Confidence" value={pct(rule.confidence)} warn={isLowConfidence(rule)} />
            <Figure label="Purity" value={pct(rule.purity)} />
            <Figure label="Incidents" value={String(rule.incidentCount)} />
            <Figure label="Escalated" value={String(rule.evidence.escalations)} warn={rule.evidence.escalations > 0} />
          </div>
          <Decision rule={rule} />
        </aside>
      </div>
    </div>
  );
}

function Figure({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="ds-figure" data-warn={warn || undefined}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function Decision({ rule }: { rule: Rule }) {
  const decision = useDecision((r, action) => {
    toast.custom(() => (
      <div className="ds-toast">
        <span className="ds-toast-seal" aria-hidden>
          ✓
        </span>
        <div>
          <div className="ds-toast-title">Recorded in the registry</div>
          <div className="ds-toast-sub">
            {r.id} {ACTION_PAST[action]} by Admiral Piett
          </div>
        </div>
      </div>
    ));
  });
  const available = actionsFor(rule);
  const [choice, setChoice] = useState<RuleAction>(available[0]);

  // Rule status changes after a decision, so the options change with it.
  useEffect(() => {
    setChoice(available[0]);
    decision.open(rule, available[0]);
  }, [rule.status, rule.id]);

  const pick = (a: RuleAction) => {
    const keep = decision.reason;
    setChoice(a);
    decision.open(rule, a);
    decision.setReason(keep);
  };

  const backtest = useBacktest(rule, turnsOn(choice));
  const needs = needsOverride(rule, choice);
  const errs = decision.check?.errors ?? {};
  const len = decision.reason.trim().length;

  return (
    <form
      className="ds-decision"
      onSubmit={(e) => {
        e.preventDefault();
        decision.submit();
      }}
    >
      <div className="ds-eyebrow">Your decision</div>
      <div className="ds-choices" role="radiogroup" aria-label="Decision">
        {available.map((a) => (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={choice === a}
            className="ds-choice"
            data-checked={choice === a || undefined}
            data-kind={turnsOn(a) ? 'on' : 'off'}
            onClick={() => pick(a)}
          >
            <span className="ds-choice-dot" />
            <span>
              <strong>{VERB[a].label}</strong>
              <span>{VERB[a].note}</span>
            </span>
          </button>
        ))}
      </div>

      {turnsOn(choice) && (
        <div className="ds-backtest" aria-live="polite">
          {backtest ? (
            <>
              Over ninety days this rule would have hidden <strong>{backtest.suppressed}</strong> incidents from{' '}
              {groupById(rule.groupId).name}
              {backtest.escalated > 0 ? (
                <>
                  , <strong className="ds-red">{backtest.escalated} of them real</strong>.
                </>
              ) : (
                <>, none of them real.</>
              )}
            </>
          ) : (
            <span className="ds-backtest-wait">
              <ThinkingOrb state="weaving" size={20} theme="light" aria-hidden="true" />
              Replaying ninety days of incidents…
            </span>
          )}
        </div>
      )}

      <label className="ds-reason">
        <span className="ds-reason-label">Reason, in your words</span>
        <textarea
          rows={4}
          value={decision.reason}
          onChange={(e) => decision.setReason(e.target.value)}
          placeholder="State what you checked and why this is safe."
          aria-invalid={(decision.attempted && !!errs.reason) || undefined}
        />
        <span className="ds-reason-foot">
          {decision.attempted && errs.reason ? <span className="ds-red">{errs.reason}</span> : 'Kept in the record under your name.'}
          <span>{len >= MIN_REASON ? '✓' : `${MIN_REASON - len} to go`}</span>
        </span>
      </label>

      {needs && (
        <div className="ds-override" data-invalid={(decision.attempted && !!errs.override) || undefined}>
          <div className="ds-override-title">Override required</div>
          <p>
            This rule is {pct(rule.confidence)} confident, under the {pct(LOW_CONFIDENCE)} standing order.
            {rule.evidence.escalations > 0 && ` It has already matched ${rule.evidence.escalations} real incident.`}
          </p>
          <label className="ds-switch-row">
            <Switch.Root className="ds-switch" checked={decision.override} onCheckedChange={decision.setOverride}>
              <Switch.Thumb className="ds-switch-thumb" />
            </Switch.Root>
            <span>I accept responsibility for activating a low-confidence rule.</span>
          </label>
        </div>
      )}

      <button className="ds-sign" data-kind={turnsOn(choice) ? 'on' : 'off'} type="submit" disabled={!decision.check?.ok}>
        Sign and record: {VERB[choice].label.toLowerCase()}
      </button>
      <div className="ds-signature">
        <span className="ds-serif">Admiral Piett</span>
        <span>signs for {groupById(rule.groupId).name}</span>
      </div>
    </form>
  );
}
