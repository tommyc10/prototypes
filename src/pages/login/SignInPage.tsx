/* The sign-in pages, by address. Opening the app with no session doesn't come here: App shows
 * the loading screen (SsoLoading) over the page that was asked for. These are for after that:
 *
 *   #/login             "Continue as": signed out of the app, still known to the company's
 *                       sign-in, one press to go back in (ContinueAs). Sign out lands here.
 *   #/login/form        another account, with an email and password (LoginPage)
 *   #/login/sso         the loading screen on its own, to see it again. `?case=fails` shows
 *                       what happens when the company's sign-in has ended its session
 *
 * `?to=#/rules` says where signing in goes; Home if it's left out. */

import { SSO_CASES } from './data/mockSso';
import { ContinueAs } from './ContinueAs';
import { LoginPage } from './LoginPage';
import { SsoLoading } from './SsoLoading';

export function SignInPage({
  variant,
  query,
  toTitle,
  onSignedIn,
}: {
  variant: string | undefined;
  query: URLSearchParams;
  toTitle: string;
  /** `null`: signed in with nothing to land (a cached token), so go in without the wave. */
  onSignedIn: (from: HTMLElement | null) => void;
}) {
  if (variant === 'form') return <LoginPage onSignedIn={onSignedIn} />;
  if (variant === 'sso') {
    const ssoCase = SSO_CASES.find((c) => c === query.get('case')) ?? 'first';
    return <SsoLoading ssoCase={ssoCase} toTitle={toTitle} onSignedIn={onSignedIn} />;
  }
  return <ContinueAs toTitle={toTitle} onSignedIn={onSignedIn} />;
}
