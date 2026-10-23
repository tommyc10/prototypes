/* A pretend sign-in. The backend replaces this file; the page only sees `signIn` resolve or
 * throw an AuthError. Three wrong passwords lock the account for LOCK_SECONDS. */

export const DEMO = { email: 'ops@imperial.ops', password: 'hold-the-line', offline: 'offline@imperial.ops' };

export const LOCK_SECONDS = 15;
const MAX_FAILURES = 3;
const LATENCY_MS = 900;

export type AuthFailure = 'bad-credentials' | 'locked' | 'offline';

export class AuthError extends Error {
  constructor(
    readonly reason: AuthFailure,
    /** Seconds until another try is allowed; only a lock sets it. */
    readonly retryIn = 0,
  ) {
    super(reason);
  }
}

let failures = 0;
let lockedUntil = 0;

export async function signIn(email: string, password: string): Promise<void> {
  await new Promise((done) => setTimeout(done, LATENCY_MS));
  const wait = Math.ceil((lockedUntil - Date.now()) / 1000);
  if (wait > 0) throw new AuthError('locked', wait);
  if (email.toLowerCase() === DEMO.offline) throw new AuthError('offline');
  if (email.toLowerCase() === DEMO.email && password === DEMO.password) {
    failures = 0;
    try {
      sessionStorage.setItem('mn-session', email);
    } catch {
      /* private window: the page still moves on */
    }
    return;
  }
  failures += 1;
  if (failures >= MAX_FAILURES) {
    failures = 0;
    lockedUntil = Date.now() + LOCK_SECONDS * 1000;
    throw new AuthError('locked', LOCK_SECONDS);
  }
  throw new AuthError('bad-credentials');
}
