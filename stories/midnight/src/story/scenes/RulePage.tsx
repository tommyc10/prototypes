/* Chapters 4, 5 and 7: the dashboard's rule page, rebuilt at stage size.
 * RuleScene is RUL-0412 (approved); GuardScene is RUL-0419 (rejected). They share the window,
 * the stat cards, the decision card, the composer shell, the toast and the cursor. */

import type { ReactNode } from 'react';
import { Bot, Check, CircleCheck, ShieldCheck, TriangleAlert, X } from 'lucide-react';
import { RULE_0412, RULE_0419, USER, WEEKLY } from '../data';
import { Cursor } from './Cursor';
import { RuleCode } from './RuleCode';
import './RulePage.css';

type Rule = typeof RULE_0412 | typeof RULE_0419;

/* ---------- the two scenes ---------- */

export function RuleScene() {
  const r = RULE_0412;
  return (
    <div className="scene sc-rule">
      <Window rule={r} end="active" toast={<Toast title={`${r.id} approved`} sub="Now suppressing · logged to audit" tone="ok" />}>
        <section className="rp-sec">
          <h3>Evidence</h3>
          <p className="rp-p">{r.summary}</p>
          <RuleCode className="rp-code" />
        </section>
        <section className="rp-sec">
          <h3>
            Matched incidents per week <span className="subtle">214 total</span>
          </h3>
          <Weekly />
        </section>

        <Composer className="rp-cmp" title={`Approve ${r.id}`} sub={`Starts suppressing matching incidents for ${r.group}`}>
          <Backtest impact={r.impact} />
          <Reason placeholder="Why is this safe to suppress?" text={r.reason} />
          <div className="cmp-actions">
            <button className="btn" data-variant="ghost" type="button" tabIndex={-1}>
              Cancel <kbd>Esc</kbd>
            </button>
            <button className="btn cmp-submit" data-variant="primary" type="button" tabIndex={-1}>
              Approve rule <kbd>⌘↵</kbd>
            </button>
          </div>
        </Composer>

      </Window>
      <Cursor />
    </div>
  );
}

export function GuardScene() {
  const r = RULE_0419;
  return (
    <div className="scene sc-guard">
      <Window rule={r} end="rejected" toast={<Toast title={`${r.id} rejected`} sub="Nothing suppressed · reason logged" tone="neutral" />}>
        <section className="rp-sec">
          <h3>Evidence</h3>
          <p className="rp-p">{r.summary}</p>
          <div className="rp-callout">
            <TriangleAlert size={15} strokeWidth={2} />
            <span>
              Matched a real incident: <strong>{r.realIncident.title}</strong>{' '}
              <span className="mono">{r.realIncident.id}</span>
            </span>
          </div>
          <ul className="rp-incidents">
            <li className="rp-incidents-head">
              <span>ID</span>
              <span>Title</span>
              <span>Resolution</span>
              <span>Opened</span>
            </li>
            {r.related.map((inc) => (
              <li key={inc.id} data-escalated={'escalated' in inc || undefined}>
                <span className="mono subtle">{inc.id}</span>
                <span className="truncate">{inc.title}</span>
                <span className="rp-res">{inc.res}</span>
                <span className="subtle num">{inc.date}</span>
              </li>
            ))}
          </ul>
        </section>

        <Composer className="rp-cmp rp-cmp-approve" title={`Approve ${r.id}`} sub={`Starts suppressing matching incidents for ${r.group}`}>
          <Reason placeholder="Why is this safe to suppress?" />
          <div className="cmp-override">
            <TriangleAlert size={16} strokeWidth={2} />
            <div className="cmp-override-text">
              <strong>Low confidence override</strong>
              <span>41% is below the 60% floor. This rule may hide real incidents.</span>
            </div>
            <span className="cmp-hold">
              Hold to override
              <span className="cmp-hold-fill" aria-hidden>
                Hold to override
              </span>
            </span>
          </div>
          <div className="cmp-actions">
            <button className="btn cmp-cancel" data-variant="ghost" type="button" tabIndex={-1}>
              Cancel <kbd>Esc</kbd>
            </button>
            <button className="btn" data-variant="primary" type="button" tabIndex={-1} disabled>
              Approve rule <kbd>⌘↵</kbd>
            </button>
          </div>
        </Composer>

        <Composer className="rp-cmp rp-cmp-reject" title={`Reject ${r.id}`} sub="Closes the proposal. Nothing is suppressed.">
          <Reason placeholder="Why are you rejecting this?" text={r.reason} />
          <div className="cmp-actions">
            <button className="btn" data-variant="ghost" type="button" tabIndex={-1}>
              Cancel <kbd>Esc</kbd>
            </button>
            <button className="btn cmp-submit" data-variant="danger" type="button" tabIndex={-1}>
              Reject rule <kbd>⌘↵</kbd>
            </button>
          </div>
        </Composer>

      </Window>
      <Cursor />
    </div>
  );
}

/* ---------- shared pieces ---------- */

function Window({
  rule,
  end,
  toast,
  children,
}: {
  rule: Rule;
  end: 'active' | 'rejected';
  toast: ReactNode;
  children: ReactNode;
}) {
  const low = rule.confidence < 60;
  const decided = end === 'active' ? 'approved' : 'rejected';
  return (
    <div className="win">
      <div className="win-bar">
        <span className="win-tab">
          <span className="dot" data-s={end} />
          <span className="truncate">{rule.name}</span>
          <X size={12} strokeWidth={2} className="subtle" />
        </span>
        <span className="win-brand">
          <span className="win-mark" />
          Imperial Ops
        </span>
      </div>

      <div className="win-body">
        <main className="rp-main">
          <div className="rp-top">
            <span className="mono subtle">{rule.id}</span>
            <span className="badge-swap rp-status">
              <span className="badge rp-status-from">
                <span className="dot" data-s="proposed" />
                Proposed
              </span>
              <span className="badge rp-status-to">
                <span className="dot" data-s={end} />
                {end === 'active' ? 'Active' : 'Rejected'}
              </span>
            </span>
          </div>
          <h2 className="rp-title">{rule.name}</h2>
          <div className="rp-scope">
            <ShieldCheck size={14} strokeWidth={1.75} />
            Scoped to <strong>{rule.group}</strong>
            <span className="subtle">· {rule.unit}</span>
            <span className="rp-sep" />
            {rule.source}
          </div>

          <div className="rp-stats">
            <Stat label="Confidence" value={rule.confidence} unit="%" meter={rule.confidence} tone={low ? 'warn' : undefined}>
              {low && <span className="chip-warn">Below 60%</span>}
            </Stat>
            <Stat label="Purity" value={rule.purity} unit="%" meter={rule.purity} />
            <Stat label="Incidents" value={rule.incidents}>
              <span className="subtle">rolling 90 days</span>
            </Stat>
            <Stat label="Escalated" value={rule.escalated} tone={rule.escalated ? 'bad' : undefined}>
              <span className="subtle">real incidents matched</span>
            </Stat>
          </div>

          {children}
        </main>

        <aside className="rp-rail">
          <div className="rp-decision card">
            <div className="rp-proposer">
              <span className="pt-bot">
                <Bot size={14} strokeWidth={1.75} />
              </span>
              <span>
                <strong>{rule.source}</strong>
                <span className="subtle">Rule engine · proposed 4m ago</span>
              </span>
            </div>
            <div className="rp-dec-h">Decision</div>
            <div className="badge-swap rp-dec">
              <div className="rp-dec-pending">
                <p>Proposed by the rule engine. Nothing is suppressed until a person approves it.</p>
                <div className="rp-dec-btns">
                  <button className="btn rp-approve" data-variant="primary" type="button" tabIndex={-1}>
                    Approve <kbd>A</kbd>
                  </button>
                  <button className="btn rp-reject" data-variant="danger" type="button" tabIndex={-1}>
                    Reject <kbd>X</kbd>
                  </button>
                </div>
                {low && (
                  <p className="rp-dec-warn">
                    <TriangleAlert size={13} strokeWidth={2} /> Below 60% confidence. Needs an override.
                  </p>
                )}
              </div>
              <div className="rp-dec-done" data-end={end}>
                <p>
                  {end === 'active' ? <CircleCheck size={15} strokeWidth={2} /> : <X size={15} strokeWidth={2} />}
                  <span>
                    <strong>{decided === 'approved' ? 'Approved' : 'Rejected'}</strong> by {USER.name} · just now
                  </span>
                </p>
                <blockquote>“{rule.reason}”</blockquote>
              </div>
            </div>
          </div>

          <section className="rp-rail-sec">
            <h3>
              If approved <span className="subtle">90 days</span>
            </h3>
            <div className="well">
              <div>
                <b className="num">{end === 'active' ? RULE_0412.impact.hidden : 33}</b>
                <span>hidden</span>
              </div>
              <div data-bad={end === 'rejected' || undefined}>
                <b className="num">{end === 'active' ? 0 : 1}</b>
                <span>escalated</span>
              </div>
              <div>
                <b className="num">{end === 'active' ? '32h' : '5h'}</b>
                <span>saved</span>
              </div>
            </div>
          </section>

          <section className="rp-rail-sec">
            <h3>History</h3>
            <ol className="rp-history">
              <li className="rp-history-new" data-action={decided}>
                <div>
                  <strong>{USER.name}</strong> <span className="rp-hist-action">{decided}</span>
                  <span className="subtle rp-hist-time">just now</span>
                </div>
              </li>
              <li className="rp-history-old">
                <div>
                  <strong>{rule.source}</strong> <span className="rp-hist-action">proposed</span>
                  <span className="subtle rp-hist-time">4m ago</span>
                </div>
              </li>
            </ol>
          </section>
        </aside>
      </div>
      {toast}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  meter,
  tone,
  children,
}: {
  label: string;
  value: number;
  unit?: string;
  meter?: number;
  tone?: 'warn' | 'bad';
  children?: ReactNode;
}) {
  return (
    <div className="rp-stat" data-tone={tone}>
      <div className="rp-stat-label">{label}</div>
      <div className="rp-stat-value">
        <span className="num rp-stat-n">{value}</span>
        {unit}
      </div>
      {meter !== undefined && (
        <div className="meter" data-tone={tone}>
          <span style={{ transform: `scaleX(${meter / 100})` }} />
        </div>
      )}
      {children && <div className="rp-stat-foot">{children}</div>}
    </div>
  );
}

function Weekly() {
  const max = Math.max(...WEEKLY);
  return (
    <div className="rp-weekly">
      <div className="rp-weekly-plot">
        {WEEKLY.map((n, i) => (
          <span key={i} className="rp-bar" data-now={i === WEEKLY.length - 1 || undefined} style={{ height: `${(n / max) * 100}%` }} />
        ))}
      </div>
      <div className="rp-weekly-axis">
        <span>13 Jul</span>
        <span>This week</span>
      </div>
    </div>
  );
}

function Composer({ className, title, sub, children }: { className: string; title: string; sub: string; children: ReactNode }) {
  return (
    <div className={`cmp ${className}`}>
      <div className="cmp-head">
        <div>
          <div className="cmp-title">{title}</div>
          <div className="cmp-sub">{sub}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function Backtest({ impact }: { impact: { hidden: number; escalated: number; hours: number } }) {
  return (
    <div className="badge-swap cmp-bt">
      <div className="well cmp-bt-wait">
        <div>
          <span className="cmp-bt-wait-label">
            <span className="pt-spinner" /> Replaying the last 90 days against this rule…
          </span>
        </div>
      </div>
      <div className="well cmp-bt-done">
        <div>
          <b className="num cmp-n">{impact.hidden}</b>
          <span>would have been hidden</span>
        </div>
        <div>
          <b className="num cmp-n">{impact.escalated}</b>
          <span>real incidents missed</span>
        </div>
        <div>
          <b className="num">
            <span className="cmp-n">{impact.hours}</span>h
          </b>
          <span>of paging saved</span>
        </div>
      </div>
    </div>
  );
}

/** The reason box. With `text` it ends filled in (the story types it); without, it stays empty. */
function Reason({ placeholder, text }: { placeholder: string; text?: string }) {
  return (
    <div className="cmp-field">
      <div className="cmp-input" data-filled={text ? '' : undefined}>
        <span className="cmp-placeholder">{placeholder}</span>
        <span className="cmp-typed">{text}</span>
        <span className="cmp-caret" />
      </div>
      <div className="cmp-foot">
        <span className="subtle">Required · saved to the audit log with your name</span>
        <span className="cmp-ok">
          <Check size={13} strokeWidth={2.5} />
        </span>
      </div>
    </div>
  );
}

function Toast({ title, sub, tone }: { title: string; sub: string; tone: 'ok' | 'neutral' }) {
  return (
    <div className="toast" data-tone={tone}>
      <span className="toast-icon">{tone === 'ok' ? <Check size={13} strokeWidth={2.5} /> : <X size={13} strokeWidth={2.5} />}</span>
      <span>
        <strong>{title}</strong>
        <span className="subtle">{sub}</span>
      </span>
    </div>
  );
}
