/* One step: the interaction is the design. No card and no form to scan, just one question
 * at a time, in large type: your email, then your password. The email you gave stays above
 * as a chip you can step back to. Each step slides in from the side it comes from, so
 * forward and back feel like a direction, not a swap. */

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader } from 'lucide-react';
import { emailError, Mark, nameFromEmail, Notice, useSignIn } from '../shared';

type Step = 'email' | 'password';

export function OneStep() {
  const auth = useSignIn();
  const [step, setStep] = useState<Step>('email');
  const [dir, setDir] = useState<'forward' | 'back'>('forward');
  const [reveal, setReveal] = useState(false);
  const { email, setEmail, password, setPassword, errors, setErrors, status, locked, lockLeft, busy, note, emailRef, passwordRef } = auth;

  const go = (next: Step) => {
    setDir(next === 'password' ? 'forward' : 'back');
    setStep(next);
  };

  const onEmail = () => {
    const err = emailError(email);
    if (err) return setErrors({ email: err });
    go('password');
  };

  const done = status === 'success';
  return (
    <div className="mn lgp os">
      <div className="lgp-brand os-brand">
        <Mark />
        Imperial Ops
      </div>

      <main className="os-col">
        <div className="os-progress" aria-label={`Step ${step === 'email' ? 1 : 2} of 2`}>
          <i data-on />
          <i data-on={step === 'password' || undefined} />
        </div>

        {done ? (
          <div className="os-step" data-dir="forward" key="done" role="status">
            <span className="os-check">
              <Check size={18} strokeWidth={2.5} />
            </span>
            <h1 className="os-prompt">Welcome back, {nameFromEmail(email)}.</h1>
            <p className="os-hint">You’re signed in.</p>
            <a className="mn-btn os-open" data-variant="primary" href="/#/">
              Open Imperial Ops <ArrowRight size={15} />
            </a>
          </div>
        ) : step === 'email' ? (
          <form
            className="os-step"
            data-dir={dir}
            key="email"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              onEmail();
            }}
          >
            <label className="os-prompt" htmlFor="os-email">
              What’s your work email?
            </label>
            <input
              ref={emailRef}
              id="os-email"
              className="os-input"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoFocus
              spellCheck={false}
              placeholder="you@company.com"
              value={email}
              aria-invalid={errors.email ? true : undefined}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email ? <p className="lg-err os-err">{errors.email}</p> : <p className="os-hint"><kbd>↵</kbd> to continue</p>}
          </form>
        ) : (
          <form className="os-step" data-dir={dir} key="password" noValidate onSubmit={auth.submit}>
            <button type="button" className="os-who" onClick={() => go('email')} disabled={busy}>
              <ArrowLeft size={13} />
              <span className="mn-truncate">{email}</span>
              <span className="os-who-change">Change</span>
            </button>
            <label className="os-prompt" htmlFor="os-password">
              {locked ? `Locked. Try again in ${lockLeft}s.` : 'And your password.'}
            </label>
            <Notice note={note?.title.startsWith('Too many') ? null : note} />
            <div className="os-pass">
              <input
                ref={passwordRef}
                id="os-password"
                className="os-input"
                type={reveal ? 'text' : 'password'}
                autoComplete="current-password"
                autoFocus
                placeholder="Your password"
                value={password}
                disabled={busy || locked}
                aria-invalid={errors.password ? true : undefined}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="mn-icon-btn os-reveal"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? 'Hide password' : 'Show password'}
                aria-pressed={reveal}
              >
                {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password ? (
              <p className="lg-err os-err">{errors.password}</p>
            ) : (
              <p className="os-hint" aria-live="polite">
                {status === 'submitting' ? (
                  <>
                    <Loader size={13} className="lg-spin" /> Checking with the sign-in service…
                  </>
                ) : (
                  <>
                    <kbd>↵</kbd> to sign in
                  </>
                )}
              </p>
            )}
          </form>
        )}
      </main>
    </div>
  );
}
