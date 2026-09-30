/* Chapter 1: one ticket, from landing to solved. Drawn solved (its END state); the story
 * sets it back to "Open" before it plays. */

import './Ticket.css';

export function Ticket() {
  return (
    <div className="scene sc-ticket">
      <article className="tk card">
        <header className="tk-head">
          <span className="mono tk-id">#4821</span>
          <span className="badge-swap tk-status">
            <span className="badge tk-open">
              <span className="dot" data-s="open" />
              Open
            </span>
            <span className="badge tk-solved">
              <span className="dot" data-s="active" />
              Solved
            </span>
          </span>
          <span className="mono subtle tk-at">Mon 09:02</span>
        </header>
        <h3 className="tk-title">Password reset link expired</h3>
        <p className="tk-sub">
          From <strong>jo@customer.co</strong> · assigned to Sam
        </p>
        <div className="tk-reply">
          <span className="tk-reply-label">Sam replied</span>
          <p className="tk-typed">Sorry about that! I’ve sent you a fresh link. It’s good for 24 hours.</p>
        </div>
        <dl className="tk-fields">
          <div>
            <dt>Time spent</dt>
            <dd>
              <span className="num tk-timer">11</span> min
            </dd>
          </div>
          <div>
            <dt>Resolution</dt>
            <dd>Resent reset link</dd>
          </div>
        </dl>
      </article>
    </div>
  );
}
