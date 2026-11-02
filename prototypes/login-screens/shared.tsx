/* Throwaway: what every sign-in variant shares. The sign-in itself (the real page's mock
 * auth, the same checks, the same failures), the notice that says what went wrong, and the
 * brand mark. Each variant only decides how it looks and moves. */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Eye, EyeOff, Loader, TriangleAlert } from 'lucide-react';
import { AuthError, signIn } from '../../src/pages/login/data/mockAuth';

export type Status = 'idle' | 'submitting' | 'success';

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function emailError(email: string) {
  if (!email.trim()) return 'Enter your work email.';
  if (!EMAIL_SHAPE.test(email.trim())) return 'That doesn’t look like an email address. Check for a typo.';
  return undefined;
}

/** The sign-in, as state: fields, their errors, where it's got to, and what went wrong. */
export function useSignIn({ onFail }: { onFail?: (failure: AuthError) => void } = {}) {
  const [email, setEmailRaw] = useState('');
  const [password, setPasswordRaw] = useState('');
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

  const setEmail = (v: string) => {
    setEmailRaw(v);
    setErrors((s) => ({ ...s, email: undefined }));
  };
  const setPassword = (v: string) => {
    setPasswordRaw(v);
    setErrors((s) => ({ ...s, password: undefined }));
  };

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (busy || locked) return;
    const found = { email: emailError(email), password: password ? undefined : 'Enter your password.' };
    setErrors(found);
    setFailure(null);
    if (found.email) return emailRef.current?.focus();
    if (found.password) return passwordRef.current?.focus();

    setStatus('submitting');
    try {
      await signIn(email.trim(), password);
      setStatus('success');
    } catch (err) {
      const why = err instanceof AuthError ? err : new AuthError('offline');
      setStatus('idle');
      setFailure(why);
      setLockLeft(why.retryIn);
      onFail?.(why);
      if (why.reason === 'bad-credentials') {
        setPasswordRaw('');
        requestAnimationFrame(() => passwordRef.current?.focus());
      }
    }
  }

  const note: Note | null =
    failure?.reason === 'bad-credentials'
      ? { status: 'red', title: 'Email or password is wrong.', body: 'Check both and try again.' }
      : failure?.reason === 'locked'
        ? { status: 'orange', title: 'Too many attempts.', body: `This account is locked. Try again in ${lockLeft}s.` }
        : failure
          ? { status: 'orange', title: 'Couldn’t reach the sign-in service.', body: 'Check your connection and try again.' }
          : null;

  return { email, setEmail, password, setPassword, errors, setErrors, status, failure, lockLeft, locked, busy, note, submit, emailRef, passwordRef };
}

export type SignIn = ReturnType<typeof useSignIn>;

export interface Note {
  status: 'red' | 'orange';
  title: string;
  body: string;
}

/** A failure from the service, as a sentence: red when it was the person's doing, orange when not. */
export function Notice({ note }: { note: Note | null }) {
  if (!note) return null;
  return (
    <div className="lg-note" data-status={note.status} role="alert">
      <TriangleAlert size={15} aria-hidden />
      <p>
        <strong>{note.title}</strong> {note.body}
      </p>
    </div>
  );
}

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <div className="mn-brand-mark" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 24 24" width={size * 0.64} height={size * 0.64}>
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    </div>
  );
}

/** "ops@imperial.ops" → "Ops", "f.piett@…" → "F. Piett" */
export function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  return parts.map((p, i) => (p.length === 1 && i < parts.length - 1 ? `${p.toUpperCase()}.` : p[0]!.toUpperCase() + p.slice(1))).join(' ');
}

/** A number that stays the same for the same text, for anything drawn from an email. */
export function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Reads a token off the page, for canvases, which can't use var(). */
export const token = (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name).trim();

/** The two fields, as the real page has them: labels, the reveal, and an error under each. */
export function Fields({ auth, idPrefix }: { auth: SignIn; idPrefix: string }) {
  const [reveal, setReveal] = useState(false);
  const { email, setEmail, password, setPassword, errors, busy, emailRef, passwordRef } = auth;
  return (
    <>
      <div className="lg-field">
        <label htmlFor={`${idPrefix}-email`}>Work email</label>
        <input
          ref={emailRef}
          id={`${idPrefix}-email`}
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
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="lg-err">{errors.email}</p>}
      </div>
      <div className="lg-field">
        <label htmlFor={`${idPrefix}-password`}>Password</label>
        <div className="lg-pass">
          <input
            ref={passwordRef}
            id={`${idPrefix}-password`}
            className="lg-input"
            type={reveal ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            disabled={busy}
            aria-invalid={errors.password ? true : undefined}
            onChange={(e) => setPassword(e.target.value)}
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
        {errors.password && <p className="lg-err">{errors.password}</p>}
      </div>
    </>
  );
}

/** The one white button, saying where the sign-in has got to. */
export function SubmitButton({ auth, label = 'Sign in' }: { auth: SignIn; label?: string }) {
  const { status, locked, lockLeft } = auth;
  return (
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
          {label} <kbd>↵</kbd>
        </>
      )}
    </button>
  );
}
