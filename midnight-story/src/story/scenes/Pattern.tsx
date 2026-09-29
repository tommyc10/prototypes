/* Chapter 3: the specifics of one ticket lift off, fly into a query, and generalise. */

import { Bot } from 'lucide-react';
import { CONDITIONS } from '../data';
import { RuleCode } from './RuleCode';
import './Pattern.css';

export function Pattern() {
  return (
    <div className="scene sc-pat">
      <div className="pt-stack">
        <div className="pt-ghost card" data-depth="2" />
        <div className="pt-ghost card" data-depth="1" />
        <article className="pt-card card">
          <header className="pt-card-head">
            <span className="mono subtle">INC-40231</span>
            <span className="pt-times">×214</span>
          </header>
          <div className="pt-card-title">Tractor beam coupling 7 temperature warning</div>
          <dl className="pt-fields">
            <div>
              <dt>CI</dt>
              <dd className="mono">
                <span className="pt-v" data-f="ci">
                  tb-coupling-07
                </span>
              </dd>
            </div>
            <div>
              <dt>Peak temp</dt>
              <dd className="mono">
                <span className="pt-v" data-f="metric">
                  71.4
                </span>{' '}
                °C
              </dd>
            </div>
            <div>
              <dt>Open for</dt>
              <dd className="mono">
                <span className="pt-v" data-f="duration">
                  74s
                </span>
              </dd>
            </div>
            <div>
              <dt>Group</dt>
              <dd>Tractor Beam Ops</dd>
            </div>
          </dl>
        </article>
      </div>

      <section className="pt-draft card">
        <header className="pt-draft-head">
          <span className="pt-bot">
            <Bot size={15} strokeWidth={1.75} />
          </span>
          <span className="pt-draft-who">
            <strong>Pattern miner v4.2</strong>
            <span className="subtle">Rule engine</span>
          </span>
          <span className="badge-swap pt-state">
            <span className="badge pt-state-busy">
              <span className="pt-spinner" />
              Comparing 214 incidents
            </span>
            <span className="badge pt-state-done">
              <span className="dot" data-s="proposed" />
              Proposed RUL-0412
            </span>
          </span>
        </header>
        <RuleCode className="pt-code" />
        <footer className="pt-draft-foot">
          <span>
            Matches <b className="num">214</b> of 214
          </span>
          <span>
            Purity <b>98%</b>
          </span>
          <span>
            Confidence <b>93%</b>
          </span>
        </footer>
      </section>

      {CONDITIONS.map((c) => (
        <span className="pt-chip mono" data-f={c.from} key={c.from} aria-hidden>
          {c.specific}
        </span>
      ))}
    </div>
  );
}
