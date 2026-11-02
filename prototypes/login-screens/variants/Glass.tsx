/* Behind glass: the context is the design. The app is right there, frosted over, with the
 * sign-in floating on the glass in front of it: you can see the shape of your rules list and
 * the page you'll land on, but not read a word of it. Signing in lifts the glass: the blur
 * clears, the dim goes, the card leaves, and the page underneath is simply the app.
 *
 * What's behind is a picture of the Rules page drawn from its own mock data, not the page
 * itself, so nothing is readable or reachable before sign-in. */

import { ArrowRight, Bell, CalendarClock, Filter, History, House, Search, Siren, Telescope, Users } from 'lucide-react';
import { RULES, groupById } from '../../../src/pages/rule-management/data/mockData';
import { Fields, Mark, Notice, SubmitButton, useSignIn } from '../shared';

const NAV = [
  [House, 'Home'],
  [Siren, 'Incidents'],
  [Bell, 'Alerts'],
  [Filter, 'Rules'],
  [History, 'Hindcast'],
  [Telescope, 'Forecast'],
  [CalendarClock, 'Change windows'],
  [Users, 'Access'],
] as const;

export function Glass() {
  const auth = useSignIn();
  const done = auth.status === 'success';
  const rules = RULES.slice(0, 12);
  const first = rules[0]!;

  return (
    <div className="mn lgp gl" data-done={done || undefined}>
      {/* The app, as a picture. Hidden from screen readers and the keyboard. */}
      <div className="gl-app" aria-hidden inert>
        <aside className="gl-side">
          <div className="lgp-brand">
            <Mark />
            Imperial Ops
          </div>
          <div className="gl-jump">
            <Search size={14} /> Search or jump to…
          </div>
          {NAV.map(([Icon, label]) => (
            <div key={label} className="gl-nav" data-active={label === 'Rules' || undefined}>
              <Icon size={16} /> {label}
            </div>
          ))}
        </aside>
        <section className="gl-list">
          <h2>Rules</h2>
          <div className="gl-search" />
          {rules.map((r) => (
            <div key={r.id} className="gl-row" data-selected={r === first || undefined}>
              <span className="mn-dot" data-status={r.status} />
              <span className="gl-row-text">
                <b className="mn-truncate">{r.name}</b>
                <small className="mn-mono">{r.id}</small>
              </span>
            </div>
          ))}
        </section>
        <section className="gl-detail">
          <span className="gl-badge">
            <span className="mn-dot" data-status={first.status} /> {first.status === 'proposed' ? 'Proposed' : first.status === 'active' ? 'Active' : 'Inactive'}
          </span>
          <h1>{first.name}</h1>
          <p>
            {first.id} · {groupById(first.groupId).name}
          </p>
          <div className="gl-well">
            <div>
              <b>412</b>
              <span>hidden in 90d</span>
            </div>
            <div>
              <b>0</b>
              <span>escalated</span>
            </div>
          </div>
          <div className="gl-bars">
            {Array.from({ length: 26 }, (_, i) => (
              <i key={i} style={{ height: `${18 + ((i * 37) % 70)}%` }} data-now={i === 25 || undefined} />
            ))}
          </div>
          <div className="gl-lines">
            <i />
            <i />
            <i />
          </div>
        </section>
      </div>
      <div className="gl-dim" aria-hidden />

      {!done && <p className="gl-over">Your shift is waiting.</p>}

      <main className="gl-card" inert={done}>
        <div className="lgp-brand">
          <Mark />
          Imperial Ops
        </div>
        <h1 className="lgp-title">Sign in</h1>
        <p className="lgp-lead">Everything’s where you left it. Sign in to read it.</p>
        <form className="lg-form" onSubmit={auth.submit} noValidate>
          <Notice note={auth.note} />
          <Fields auth={auth} idPrefix="gl" />
          <SubmitButton auth={auth} />
        </form>
      </main>

      {done && (
        <div className="gl-arrived" role="status">
          Signed in as <b>{auth.email.trim()}</b>
          <a className="mn-link" href="/#/rules">
            Open Imperial Ops <ArrowRight size={12} />
          </a>
        </div>
      )}
    </div>
  );
}
