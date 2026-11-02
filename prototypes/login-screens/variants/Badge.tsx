/* Badge: a physical metaphor. Your access card is on the desk, and it fills itself in as you
 * type: initials, a name from your email, a card number and a stripe drawn from it, so a
 * typo changes the card under your eyes. It leans toward the pointer. Signing in slides it
 * down to the reader while a light reads it; the reader's lamp says how that went, in the
 * status colours, and a refused card shakes. */

import { useEffect, useRef } from 'react';
import { ArrowRight, UserRound } from 'lucide-react';
import { Fields, hash, Mark, nameFromEmail, Notice, still, SubmitButton, useSignIn } from '../shared';

export function Badge() {
  const cardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const auth = useSignIn({
    onFail: (why) => {
      if (why.reason === 'bad-credentials' && !still())
        cardRef.current?.animate(
          [{ translate: '0 0' }, { translate: '-8px 0' }, { translate: '6px 0' }, { translate: '-4px 0' }, { translate: '2px 0' }, { translate: '0 0' }],
          { duration: 360, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        );
    },
  });
  const { email, status, failure, locked, lockLeft } = auth;

  // The lean: the pointer sets where it wants to be, and it follows on a soft spring.
  // Written straight to the element each frame, so React isn't re-rendering at 60fps.
  useEffect(() => {
    const card = cardRef.current!;
    const stage = stageRef.current!;
    if (still()) return;
    const at = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      at.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      at.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
    };
    const onLeave = () => {
      at.tx = 0;
      at.ty = 0;
    };
    const tick = () => {
      // stiffness 120, damping 14, per 60fps frame
      for (const k of ['x', 'y'] as const) {
        const v = k === 'x' ? 'vx' : 'vy';
        const t = k === 'x' ? 'tx' : 'ty';
        at[v] += ((at[t] - at[k]) * 120 - at[v] * 14) / 3600;
        at[k] += at[v];
      }
      card.style.transform = `rotateY(${at.x * 9}deg) rotateX(${-at.y * 7}deg)`;
      card.style.setProperty('--gx', `${50 + at.x * 40}%`);
      card.style.setProperty('--gy', `${30 + at.y * 30}%`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  const typed = email.trim();
  const name = typed.includes('@') ? nameFromEmail(typed) : typed ? nameFromEmail(typed) : '';
  const initials = name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  const seed = hash(typed.toLowerCase());
  const number = typed ? `IO-${String(seed % 10000).padStart(4, '0')}-${String((seed >>> 13) % 10000).padStart(4, '0')}` : 'IO-····-····';
  const stripe = Array.from({ length: 44 }, (_, i) => (typed ? 1 + ((seed >>> i % 28) & 3) : 2));

  const lamp =
    status === 'submitting'
      ? { state: 'reading', word: 'Reading…' }
      : status === 'success'
        ? { state: 'cleared', word: 'Cleared' }
        : locked
          ? { state: 'locked', word: `Locked · ${lockLeft}s` }
          : failure?.reason === 'bad-credentials'
            ? { state: 'refused', word: 'Refused' }
            : failure
              ? { state: 'offline', word: 'No signal' }
              : { state: 'ready', word: 'Ready' };

  const done = status === 'success';
  return (
    <div className="mn lgp bd" data-state={lamp.state}>
      <div className="bd-stage" ref={stageRef}>
        <div className="bd-card-wrap">
          <div className="bd-card" ref={cardRef} aria-label="Your access card" role="img">
            <div className="bd-card-top">
              <Mark size={20} />
              <span>Imperial Ops</span>
              <span className="bd-card-kind">Access card</span>
            </div>
            <div className="bd-photo" data-empty={!initials || undefined}>
              {initials || <UserRound size={30} strokeWidth={1.5} />}
            </div>
            <div className="bd-name mn-truncate" data-empty={!name || undefined}>
              {name || 'Your name'}
            </div>
            <div className="bd-email mn-truncate">{typed || 'you@company.com'}</div>
            <dl className="bd-rows">
              <div>
                <dt>Card</dt>
                <dd className="mn-mono">{number}</dd>
              </div>
              <div>
                <dt>Clearance</dt>
                <dd>
                  {done ? (
                    <span className="bd-cleared">
                      <span className="mn-dot" data-status="active" /> Cleared
                    </span>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>
            <div className="bd-stripe" aria-hidden>
              {stripe.map((w, i) => (
                <i key={i} style={{ width: w }} />
              ))}
            </div>
            <span className="bd-glare" aria-hidden />
            <span className="bd-scan" aria-hidden />
          </div>
        </div>
        <div className="bd-reader">
          <span className="bd-lamp" />
          <span className="mn-mono" aria-live="polite">
            {lamp.word}
          </span>
        </div>
      </div>

      <main className="bd-panel">
        <h1 className="lgp-title">Sign in</h1>
        <p className="lgp-lead">Your card fills itself in as you type.</p>
        <form className="lg-form" onSubmit={auth.submit} noValidate>
          <Notice note={auth.note} />
          <Fields auth={auth} idPrefix="bd" />
          <SubmitButton auth={auth} label="Scan in" />
        </form>
        {done && (
          <p className="bd-welcome" role="status">
            Welcome aboard, {name}.{' '}
            <a className="mn-link" href="/#/">
              Open Imperial Ops <ArrowRight size={12} />
            </a>
          </p>
        )}
      </main>
    </div>
  );
}
