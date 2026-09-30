/* Every word and number in the story. Replace this with the product's story: the scenes
 * read from here, so most copy changes never touch layout or timing.
 *
 * The example: one support ticket that turns out to be one of 120. */

export const PRODUCT = { name: 'Acme Desk', url: 'https://example.com' };

export interface Chapter {
  id: string;
  label: string;
  title: string;
  body: string;
  /** An optional last word under the body, revealed when you choose (a joke, a footnote). */
  aside?: string;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'ticket',
    label: 'The ticket',
    title: 'It starts with one ticket.',
    body: 'Monday, 09:02. A customer can’t reset their password. An agent spends eleven minutes on it and marks it solved.',
  },
  {
    id: 'pattern',
    label: 'The pattern',
    title: 'Then it happens again. And again.',
    body: '120 of the same ticket in twelve weeks. Every one of them solved by hand, the same way, by someone who had better things to do.',
  },
];

/* ---------- the wall of noise (hero + outro) ---------- */

export interface WallRow {
  id: string;
  title: string;
  time: string;
  /** Goes quiet in the outro. */
  noise: boolean;
  target?: boolean;
}

const SOURCES: [string, boolean][] = [
  ['Password reset link expired', true],
  ['Invoice PDF won’t download', true],
  ['Can’t add a teammate', false],
  ['2FA code not arriving', true],
  ['Export to CSV times out', true],
  ['Refund for double charge', false],
  ['Change billing email', true],
  ['SSO login loops', false],
];

export const WALL_COLS = 4;
export const WALL_ROWS = 19;
const TARGET = { col: 1, row: 9 };

export const WALL: WallRow[][] = Array.from({ length: WALL_COLS }, (_, c) =>
  Array.from({ length: WALL_ROWS }, (_, r) => {
    if (c === TARGET.col && r === TARGET.row) {
      return { id: '#4821', title: 'Password reset link expired', time: '09:02', noise: true, target: true };
    }
    const n = c * WALL_ROWS + r;
    const [title, noise] = SOURCES[(n * 5 + c) % SOURCES.length];
    const m = (n * 37) % 600;
    return { id: `#${4700 + ((n * 53) % 300)}`, title, time: `${String(8 + Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`, noise };
  }),
);

/* ---------- the pattern ---------- */

/** Tickets per week, oldest first. Adds up to 120. */
export const WEEKLY = [8, 11, 9, 10, 12, 9, 10, 11, 9, 10, 11, 10];
export const WEEKLY_TOTAL = WEEKLY.reduce((a, b) => a + b, 0);
