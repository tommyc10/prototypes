/* Sign-in as a loading screen: what opening the app with no session shows (App puts it over
 * the page that was asked for, Home by default). There is no form: the company's sign-in
 * already knows who this is, so the page asks it quietly and loads the first page meanwhile.
 *
 * The brand mark is the spinner: its ring turns as an open arc while the work runs, closes
 * into the mark when it lands, and the wave leaves from it into the page behind. The wave is
 * the work landing (see DESIGN.md, Motion), so it only runs once there is a page to show.
 *
 *   returning   a cached token answers before the screen shows (it fades in after 400ms), so
 *               the page simply appears: no spinner, no wave on every reload
 *   fails       the provider's session has ended: the one case a card earns its place, with
 *               one button that goes round the provider's sign-in and comes back here */

import { useEffect, useRef, useState } from 'react';
import { BrandMark } from '../../components/BrandMark';
import { NightScene } from '../../components/Halloween/NightScene';
import { useHalloween } from '../../hooks/useHalloween';
import { USER, prefetch, redirectSignIn, silentSignIn, type SsoCase } from './data/mockSso';

type Phase = 'checking' | 'loading' | 'done' | 'ended' | 'redirecting';

/** Long enough to see the ring close before the wave leaves it. */
const CLOSED_BEAT = 320;

export function SsoLoading({ ssoCase, toTitle, onSignedIn }: { ssoCase: SsoCase; toTitle: string; onSignedIn: (from: HTMLElement | null) => void }) {
  const halloween = useHalloween();
  const [phase, setPhase] = useState<Phase>('checking');
  const [tries, setTries] = useState(0);
  const mark = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let live = true;
    const started = performance.now();
    // After a trip round the provider's sign-in, the provider answers this time.
    silentSignIn(tries > 0 ? 'first' : ssoCase)
      .then(async () => {
        // Answered before the screen showed: nothing to land, so just go in.
        if (performance.now() - started < 400) return live && onSignedIn(null);
        if (!live) return;
        setPhase('loading');
        await prefetch();
        if (!live) return;
        setPhase('done');
        setTimeout(() => live && onSignedIn(mark.current), CLOSED_BEAT);
      })
      .catch(() => live && setPhase('ended'));
    return () => {
      live = false;
    };
  }, [ssoCase, tries]);

  useEffect(() => {
    if (phase === 'ended') button.current?.focus();
  }, [phase]);

  const again = async () => {
    setPhase('redirecting');
    await redirectSignIn();
    setPhase('checking');
    setTries((n) => n + 1);
  };

  const status =
    phase === 'checking' ? 'Checking your account' : phase === 'loading' ? `Loading ${toTitle}` : phase === 'done' ? `Opening ${toTitle}` : '';

  return (
    <div className="mn lg">
      {halloween && <NightScene variant="sky" />}

      {phase === 'ended' || phase === 'redirecting' ? (
        <main className="lg-card">
          <div className="lg-brand" aria-hidden>
            <BrandMark />
            Imperial Ops
          </div>
          <h1 className="lg-title">Sign in again</h1>
          <p className="lg-lead">Your Imperial SSO session has ended, so we couldn’t sign you in on our own.</p>
          <button ref={button} className="mn-btn lg-submit" data-variant="primary" onClick={again} disabled={phase === 'redirecting'}>
            {phase === 'redirecting' ? (
              <>
                <Ring spinning small /> Waiting for Imperial SSO…
              </>
            ) : (
              <>
                Continue with Imperial SSO <kbd>↵</kbd>
              </>
            )}
          </button>
          <p className="lg-fine">Opens your company’s sign-in, then brings you back to {toTitle}.</p>
        </main>
      ) : (
        <main className="lg-load" data-phase={phase} aria-busy={phase !== 'done'}>
          <div className="lg-load-mark" ref={mark}>
            <Ring spinning={phase !== 'done'} />
          </div>
          <div className="lg-load-name">Imperial Ops</div>
          <div className="lg-load-status" role="status">
            {status}
          </div>
          <div className="lg-load-who" data-shown={phase !== 'checking' || undefined}>
            {USER.name} · {USER.role}
          </div>
        </main>
      )}
    </div>
  );
}

/** The brand mark's ring round a dot. Spinning, the ring is an open arc going round; stopped,
 *  it closes into the mark. */
export function Ring({ spinning, small }: { spinning: boolean; small?: boolean }) {
  const size = small ? 15 : 28;
  return (
    <svg className="lg-ring" data-spinning={spinning || undefined} viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <circle className="lg-ring-arc" cx="12" cy="12" r="9" pathLength="100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
