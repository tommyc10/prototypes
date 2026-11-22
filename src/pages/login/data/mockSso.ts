/* A pretend single sign-on, for the loading-screen sign-in (SsoLoading) and "Continue as"
 * (ContinueAs). There is no form: the company's identity provider already knows who this is,
 * and the app only asks it quietly. The backend (MSAL or the like) replaces this file.
 *
 * Three cases, picked in the address (?case=…) so each one can be looked at:
 *   first      a token has to be fetched: about a second, then the first page's data
 *   returning  a token is cached: answers before the loading screen would even show
 *   fails      the identity provider's session has ended, so someone has to sign in again */

export type SsoCase = 'first' | 'returning' | 'fails';
export const SSO_CASES: SsoCase[] = ['first', 'returning', 'fails'];

export const USER = { name: 'Admiral Piett', role: 'Rule governor', email: 'piett@imperial.ops', initials: 'AP' };

export class SsoEnded extends Error {}

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

/** Ask the identity provider who this is, without showing it. */
export async function silentSignIn(ssoCase: SsoCase) {
  await wait(ssoCase === 'returning' ? 120 : ssoCase === 'fails' ? 1100 : 900);
  if (ssoCase === 'fails') throw new SsoEnded();
  return USER;
}

/** The first page's data, fetched behind the loading screen so the page under the wave is whole. */
export const prefetch = () => wait(700);

/** The round trip to the identity provider's own sign-in page, and back. */
export const redirectSignIn = () => wait(1200);
