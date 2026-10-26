/* The sign-in page. One card, one primary action. Enter submits; every failure is a sentence
 * beside what caused it. The auth is a mock (data/mockAuth.ts). */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Eye, EyeOff, Loader, Moon, Sun, TriangleAlert } from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';
import { NightScene } from '../../components/Halloween/NightScene';
import { useHalloween } from '../../hooks/useHalloween';
import { useTheme } from '../../hooks/useTheme';
import { navigate } from '../../lib/route';
import { AuthError, DEMO, signIn } from './data/mockAuth';
import './login.css';

type Status = 'idle' | 'submitting' | 'success';

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkFields(email: string, password: string) {
  const errors: { email?: string; password?: string } = {};
  if (!email.trim()) errors.email = 'Enter your work email.';
  else if (!EMAIL_SHAPE.test(email.trim())) errors.email = 'That doesn’t look like an email address. Check for a typo.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function LoginPage() {
  const [theme, toggleTheme] = useTheme();
  const halloween = useHalloween();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [status, setStatus] = useState<Status>('idle');
  const [failure, setFailure] = useState<AuthError | null>(null);
  const [lockLeft, setLockLeft] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // A lock counts down, then lifts itself.
  useEffect(() => {
    if (lockLeft <= 0) return;
    const tick = setTimeout(() => setLockLeft((n) => n - 1), 1000);
    return () => clearTimeout(tick);
  }, [lockLeft]);
  useEffect(() => {
    if (failure?.reason === 'locked' && lockLeft === 0) setFailure(null);
  }, [failure, lockLeft]);

  const locked = lockLeft > 0;
  const busy = status !== 'idle';

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || locked) return;
    const found = checkFields(email, password);
    setErrors(found);
    setFailure(null);
    if (found.email) return emailRef.current?.focus();
    if (found.password) return passwordRef.current?.focus();

    setStatus('submitting');
    try {
      await signIn(email.trim(), password);
      setStatus('success');
      setTimeout(() => navigate('#/'), 700);
    } catch (err) {
      const why = err instanceof AuthError ? err : new AuthError('offline');
      setStatus('idle');
      setFailure(why);
      setLockLeft(why.retryIn);
      if (why.reason === 'bad-credentials') {
        setPassword('');
        // The field is still disabled until the next paint.
        requestAnimationFrame(() => passwordRef.current?.focus());
      }
    }
  }

  const note =
    failure?.reason === 'bad-credentials'
      ? { status: 'red', title: 'Email or password is wrong.', body: 'Check both and try again.' }
      : failure?.reason === 'locked'
        ? { status: 'orange', title: 'Too many attempts.', body: `This account is locked. Try again in ${lockLeft}s.` }
        : failure
          ? { status: 'orange', title: 'Couldn’t reach the sign-in service.', body: 'Check your connection and try again.' }
          : null;

  return (
    <div className="mn lg">
      {halloween && <NightScene variant="sky" />}
      <button className="mn-icon-btn lg-theme" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <main className="lg-card">
        <div className="lg-brand" aria-hidden>
          <BrandMark />
          Imperial Ops
        </div>
        <h1 className="lg-title">Sign in</h1>
        <p className="lg-lead">Use your work account to see what needs a person.</p>

        <form className="lg-form" onSubmit={submit} noValidate>
          {note && (
            <div className="lg-note" data-status={note.status} role="alert">
              <TriangleAlert size={15} aria-hidden />
              <p>
                <strong>{note.title}</strong> {note.body}
              </p>
            </div>
          )}

          <div className="lg-field">
            <label htmlFor="lg-email">Work email</label>
            <input
              ref={emailRef}
              id="lg-email"
              className="lg-input"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoFocus
              spellCheck={false}
              placeholder="you@company.com"
              value={email}
              disabled={busy}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'lg-email-err' : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((s) => ({ ...s, email: undefined }));
              }}
            />
            {errors.email && (
              <p className="lg-err" id="lg-email-err">
                {errors.email}
              </p>
            )}
          </div>

          <div className="lg-field">
            <label htmlFor="lg-password">Password</label>
            <div className="lg-pass">
              <input
                ref={passwordRef}
                id="lg-password"
                className="lg-input"
                type={reveal ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                disabled={busy}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? 'lg-password-err' : undefined}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((s) => ({ ...s, password: undefined }));
                }}
              />
              <button
                type="button"
                className="mn-icon-btn lg-reveal"
                onClick={() => setReveal((v) => !v)}
                disabled={busy}
                aria-label={reveal ? 'Hide password' : 'Show password'}
                aria-pressed={reveal}
              >
                {reveal ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="lg-err" id="lg-password-err">
                {errors.password}
              </p>
            )}
          </div>

          <button className="mn-btn lg-submit" data-variant="primary" type="submit" disabled={locked} data-status={status}>
            {status === 'submitting' ? (
              <>
                <Loader size={15} className="lg-spin" aria-hidden /> Signing in…
              </>
            ) : status === 'success' ? (
              <>
                <Check size={15} aria-hidden /> Signed in
              </>
            ) : locked ? (
              `Try again in ${lockLeft}s`
            ) : (
              <>
                Sign in <kbd>↵</kbd>
              </>
            )}
          </button>
          <span className="lg-sr" role="status">
            {status === 'submitting' ? 'Signing in' : status === 'success' ? 'Signed in. Opening Imperial Ops.' : ''}
          </span>
        </form>
      </main>

      <p className="lg-demo">
        Demo account <code>{DEMO.email}</code> · <code>{DEMO.password}</code>
        <br />
        <code>{DEMO.offline}</code> shows the service-down state. Three wrong passwords lock it.
      </p>
    </div>
  );
}
