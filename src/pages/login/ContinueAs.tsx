/* "Continue as": where signing out lands. The app's session has ended but the company's sign-in
 * still knows who this is, so going back in is one press, with the account named on the card:
 * on a shared console the person at the screen sees whose account they're about to act as.
 * The wave leaves from the button, as from the form's. "Use another account" goes to the form. */

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { BrandMark } from '../../components/BrandMark';
import { NightScene } from '../../components/Halloween/NightScene';
import { useHalloween } from '../../hooks/useHalloween';
import { navigate } from '../../lib/route';
import { USER, prefetch } from './data/mockSso';
import { Ring } from './SsoLoading';

type Status = 'idle' | 'loading' | 'done';

const SIGNED_IN_BEAT = 240;

export function ContinueAs({ toTitle, onSignedIn }: { toTitle: string; onSignedIn: (from: HTMLElement) => void }) {
  const halloween = useHalloween();
  const [status, setStatus] = useState<Status>('idle');
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => button.current?.focus(), []);

  async function go(e: FormEvent) {
    e.preventDefault();
    if (status !== 'idle') return;
    setStatus('loading');
    await prefetch();
    setStatus('done');
    setTimeout(() => button.current && onSignedIn(button.current), SIGNED_IN_BEAT);
  }

  return (
    <div className="mn lg">
      {halloween && <NightScene variant="sky" />}
      <main className="lg-card">
        <div className="lg-brand" aria-hidden>
          <BrandMark />
          Imperial Ops
        </div>
        <h1 className="lg-title">Welcome back</h1>
        <p className="lg-lead">You’re signed in to Imperial SSO.</p>
        <form onSubmit={go}>
          <div className="lg-who">
            <span className="lg-avatar" aria-hidden>
              {USER.initials}
            </span>
            <div className="lg-who-text">
              <div>{USER.name}</div>
              <div className="lg-who-sub">
                {USER.role} · <span className="lg-mono">{USER.email}</span>
              </div>
            </div>
          </div>
          <button ref={button} className="mn-btn lg-submit" data-variant="primary" type="submit" data-status={status === 'done' ? 'success' : undefined}>
            {status === 'loading' ? (
              <>
                <Ring spinning small /> Loading {toTitle}…
              </>
            ) : status === 'done' ? (
              <>
                <Check size={15} aria-hidden /> Signed in
              </>
            ) : (
              <>
                Continue as {USER.name} <kbd>↵</kbd>
              </>
            )}
          </button>
          <span className="lg-sr" role="status">
            {status === 'loading' ? `Loading ${toTitle}` : status === 'done' ? `Signed in. Opening ${toTitle}.` : ''}
          </span>
        </form>
        <button className="lg-other" type="button" onClick={() => navigate('#/login/form')} disabled={status !== 'idle'}>
          Use another account <ArrowRight size={13} aria-hidden />
        </button>
      </main>
    </div>
  );
}
