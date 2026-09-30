/* Chapter 8: the audit log. Every entry names who acted and says why, in their words. */

import { Bot } from 'lucide-react';
import { AUDIT } from '../data';
import './Audit.css';

export function Audit() {
  return (
    <div className="scene sc-audit">
      <section className="au card">
        <header className="au-head">
          <div>
            <h3>Audit log</h3>
            <span className="subtle">Imperial Ops · this morning</span>
          </div>
          <span className="au-filter">All rules</span>
          <span className="au-filter">All people</span>
        </header>
        <ol className="au-list">
          <span className="au-rail" aria-hidden />
          {AUDIT.map((e, i) => (
            <li className="au-entry" key={i} data-action={e.action} data-bot={e.bot || undefined}>
              <span className="au-avatar">{e.bot ? <Bot size={15} strokeWidth={1.75} /> : e.initials}</span>
              <div className="au-body">
                <div className="au-line">
                  <strong>{e.actor}</strong>
                  <span className="au-action">{e.action}</span>
                  <span className="mono au-rule">{e.rule}</span>
                  <span className="subtle num au-time">{e.time}</span>
                </div>
                <p className="au-reason">{e.bot ? e.reason : `“${e.reason}”`}</p>
              </div>
            </li>
          ))}
        </ol>
        <footer className="au-foot">
          <span className="au-lock" />
          Append-only. Entries can be added, never edited or removed.
        </footer>
      </section>
    </div>
  );
}
