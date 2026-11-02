/* The detail pane: one service in full. Where it ranks, a sentence that says what its
 * numbers mean, the three figures with their change on the lookback before, its tickets
 * week by week, its rules, and the way into the Hindcast and the Rules page. */

import type { CSSProperties, ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Filter, History } from 'lucide-react';
import { num, pct } from '../../../../lib/format';
import { dayMonth, TODAY, WEEK } from '../../../hindcast/model/labels';
import { changeOf, hrefs, measureOf, ordinal, words } from '../../model/talkers';
import type { Lookback, Measure, Talker } from '../../model/types';
import './ServiceDetail.css';

export function ServiceDetail({ t, rank, of, measure, weeks }: { t: Talker; rank: number; of: number; measure: Measure; weeks: Lookback }) {
  const lookback = `${weeks} weeks`;
  const against = `on the ${lookback} before`;
  return (
    <article className="sv-page">
      <header className="sv-head">
        <p className="sv-eyebrow">
          {rank === 1 ? 'Loudest' : `${ordinal(rank)} loudest`} by {measureOf(measure).many}, of {of} · last {lookback}
        </p>
        <h2>{t.name}</h2>
        <p className="sv-unit">{t.unit}</p>
      </header>

      <p className="sv-lead">
        <b>{t.name}</b> raised <b>{num(t.tickets)}</b> {words(t.tickets, 'tickets')} in the last {lookback}, <b>{pct(t.share)}</b> of every service's, and{' '}
        <b>{num(t.incidents)}</b> became {words(t.incidents, 'incidents')}. It has <b>{num(t.rules.total)}</b> {words(t.rules.total, 'rules')}
        {t.rules.total > 0 && (
          <>
            : {t.rules.active} active{t.rules.proposed > 0 && `, ${t.rules.proposed} waiting`}
            {t.rules.inactive > 0 && `, ${t.rules.inactive} off`}
          </>
        )}
        .
      </p>

      <div className="sv-stats">
        <Stat label="Tickets" value={num(t.tickets)} active={measure === 'tickets'}>
          <Change by={changeOf(t.tickets, t.before.tickets)} against={against} />
        </Stat>
        <Stat label="Incidents" value={num(t.incidents)} active={measure === 'incidents'}>
          <Change by={changeOf(t.incidents, t.before.incidents)} against={against} />
        </Stat>
        <Stat label="Rules" value={num(t.rules.total)} active={measure === 'rules'}>
          <span className="sv-change">
            {t.rules.active} active · {t.rules.proposed} waiting · {t.rules.inactive} off
          </span>
        </Stat>
      </div>

      <section className="sv-card" aria-labelledby="sv-weeks-title">
        <header className="sv-card-head">
          <h3 id="sv-weeks-title">Tickets, week by week</h3>
          <span>Incidents are part of each week's tickets</span>
        </header>
        <Weeks weekly={t.weekly} weeks={weeks} />
      </section>

      <section className="sv-card" aria-labelledby="sv-rules-title">
        <header className="sv-card-head">
          <h3 id="sv-rules-title">Its rules</h3>
          <span>{t.rules.total ? `${t.rules.total} written for ${t.name}` : 'None yet'}</span>
        </header>
        {t.ruleList.length ? (
          <ul className="sv-rules">
            {t.ruleList.map((r) => (
              <li key={r.id}>
                <a href={hrefs.rule(r.id)}>
                  <span className="mn-dot" data-status={r.status} aria-hidden />
                  <span className="sv-rule-name mn-truncate">{r.name}</span>
                  <span className="mn-mono sv-rule-id">{r.id}</span>
                  <span className="sv-rule-fig">
                    <b>{num(r.incidentCount)}</b> fitted
                  </span>
                  <span className="sv-rule-status">{r.status === 'proposed' ? 'Waiting' : r.status === 'active' ? 'Active' : 'Off'}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mn-empty">No rules for {t.name} yet. Rules proposed overnight appear on the Rules page.</p>
        )}
      </section>

      <div className="sv-actions">
        <a className="mn-btn" href={hrefs.hindcast(t.id, weeks)}>
          <History size={15} /> Open in Hindcast <kbd>H</kbd>
        </a>
        <a className="mn-btn" href={hrefs.rules(t.id)}>
          <Filter size={15} /> Its rules <kbd>R</kbd>
        </a>
      </div>
    </article>
  );
}

function Stat({ label, value, active, children }: { label: string; value: string; active: boolean; children: ReactNode }) {
  return (
    <div className="sv-stat" data-active={active || undefined}>
      <span className="sv-stat-label">{label}</span>
      <b>{value}</b>
      {children}
    </div>
  );
}

/** Up or down on the lookback before, in fg-3: a rise isn't a status, so it takes no colour. */
function Change({ by, against }: { by: number | null; against: string }) {
  if (by === null) return <span className="sv-change">None {against}</span>;
  if (Math.abs(by) < 0.005) return <span className="sv-change">Level {against}</span>;
  const Icon = by > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="sv-change" aria-label={`${by > 0 ? 'Up' : 'Down'} ${pct(Math.abs(by))} ${against}`}>
      <Icon size={12} aria-hidden />
      {pct(Math.abs(by))} {against}
    </span>
  );
}

/** The lookback's weeks as bars, each labelled with its count; the latest week in fg. */
function Weeks({ weekly, weeks }: { weekly: number[]; weeks: Lookback }) {
  const max = Math.max(1, ...weekly);
  const from = TODAY - weeks * WEEK;
  const every = weeks > 12 ? 4 : weeks > 4 ? 2 : 1;
  return (
    <div className="sv-wk" style={{ '--n': weekly.length } as CSSProperties}>
      {weekly.map((n, i) => (
        <div key={i} className="sv-wk-col" data-now={i === weekly.length - 1 || undefined} title={`Week of ${dayMonth(from + i * WEEK)}: ${num(n)} tickets`}>
          <span className="sv-wk-n">{weeks <= 12 ? num(n) : ''}</span>
          <span className="sv-wk-bar" style={{ transform: `scaleY(${Math.max(0.02, n / max)})` }} />
          <span className="sv-wk-date">{i % every === 0 ? dayMonth(from + i * WEEK) : ''}</span>
        </div>
      ))}
    </div>
  );
}
