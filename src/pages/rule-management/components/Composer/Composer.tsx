/* The decision form: a written reason, the backtest while approving, the low-confidence
 * override, and submit. The state and checks live in useDecision; this is the view.
 * It floats over the page in narrow layouts and sits in the rail (`docked`) in wide ones. */

import { AlertTriangle, Check, CornerDownLeft } from 'lucide-react';
import { pct } from '../../../../lib/format';
import { groupById } from '../../data/mockData';
import type { Decision } from '../../hooks/useDecision';
import { useBacktest } from '../../hooks/useBacktest';
import { ACTION_LABEL } from '../../model/labels';
import { LOW_CONFIDENCE, MIN_REASON, needsOverride, turnsOn } from '../../model/policy';
import type { Rule, RuleAction } from '../../model/types';
import { HoldButton } from './HoldButton';
import './Composer.css';

const PLACEHOLDER: Record<RuleAction, string> = {
  approve: 'What did you verify in the evidence?',
  activate: 'What did you verify in the evidence?',
  reject: 'Why is this pattern not safe to suppress?',
  deactivate: 'Why should these incidents page the group again?',
};

export function Composer({
  rule,
  action,
  decision,
  via,
  docked,
}: {
  rule: Rule;
  action: RuleAction;
  decision: Decision;
  /** Opened with the keyboard: appear instantly. With the pointer: animate in. */
  via: 'key' | 'pointer';
  docked?: boolean;
}) {
  const on = turnsOn(action);
  const backtest = useBacktest(rule, on);
  const errors = decision.check?.errors ?? {};
  const length = decision.reason.trim().length;

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
          placeholder={PLACEHOLDER[action]}
          aria-label="Reason"
          aria-invalid={(decision.attempted && !!errors.reason) || undefined}
        />
        <span className="mn-field-foot">
          {decision.attempted && errors.reason ? (
            <span className="mn-bad">{errors.reason}</span>
          ) : (
            <span className="mn-subtle">Required · saved to the audit log with your name</span>
          )}
          <span className="mn-counter" data-ok={length >= MIN_REASON || undefined}>
            {length >= MIN_REASON ? <Check size={12} strokeWidth={2.5} /> : `${length}/${MIN_REASON}`}
          </span>
        </span>
      </label>

      {needsOverride(rule, action) && (
        <div className="mn-override" data-invalid={(decision.attempted && !!errors.override) || undefined}>
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
