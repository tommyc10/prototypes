/* Dev only. The data Aide meets in the worst realistic case, put in at the store, the same
 * boundary the demo data comes through. Pick one with ?aide=worst (see DataToggle.tsx).
 *
 *   demo    what a first visit looks like: the greeting, and whatever this browser saved
 *   worst   a long rank, pasted IDs and URLs, markup, emoji, a 400-character question
 *   empty   a new officer with one-word name and nothing saved
 *   one     exactly one step done, one question asked
 *   huge    a shift's worth of questions: 400 messages */

import { CURRENT_USER } from '../../../pages/rule-management/data/mockData';
import { answer, HANDBOOK, type MissionId } from '../model';
import { greeting, load, type AideState, type Message, type Said } from '../useAide';

export type FixtureName = 'demo' | 'worst' | 'empty' | 'one' | 'huge';

export const FIXTURE_NAMES: FixtureName[] = ['demo', 'worst', 'empty', 'one', 'huge'];

// Far above the store's own counter, so a question asked afterwards never shares a key.
let id = 1_000_000;
const you = (text: string): Message => ({ id: ++id, from: 'you', text });
const aide = (said: Said): Message => ({ id: ++id, from: 'aide', said });
const qa = (text: string) => [you(text), aide({ kind: 'reply', reply: answer(text, 'rules') })];

const WORST_QUESTIONS = [
  // Pasted from a handover note: one unbroken string.
  'INC-41208,INC-41207,INC-41201,INC-41196,INC-41190,INC-41183,INC-41177,INC-41169,INC-40264',
  'https://imperial-ops.example.test/rules/RUL-0435?group=assignment.reactor&ref=handover-notes-2026-11-15-night-shift',
  "Hi, I've just joined the Reactor Core rota from Fleet Logistics and my lead asked me to check whether the rule that keeps hiding the coolant pressure alerts on deck 14 was approved by someone on the night shift, because we had a page at 03:12 that nobody saw and the incident review is tomorrow morning. How do I find who approved it, and when?",
  '<b>what</b> does &amp; mean in a rule condition',
  '🚀🚀 what do the colours mean??',
  'Benachrichtigungseinstellungen',
];

const ALL: MissionId[] = ['home', 'palette', 'incident', 'alerts', 'rule', 'chord'];

export function fixture(name: FixtureName): Partial<AideState> {
  switch (name) {
    case 'demo':
      return { ...load(), officer: CURRENT_USER, thread: greeting(), peek: null };
    case 'worst':
      return {
        officer: 'Grand Moff Wilhuff Tarkin',
        done: ALL,
        seen: ['home', 'rules'],
        thread: [
          ...greeting(),
          ...WORST_QUESTIONS.flatMap(qa),
          aide({ kind: 'missing' }),
          aide({ kind: 'done', mission: 'chord' }),
          aide({ kind: 'page', page: 'rules' }),
        ],
        peek: { kind: 'done', mission: 'chord' },
      };
    case 'empty':
      return { officer: 'Jo', done: [], seen: [], thread: greeting(), peek: { kind: 'hello' } };
    case 'one':
      return { officer: 'Captain Needa', done: ['home'], seen: ['home'], thread: [...greeting(), ...qa('What does a rule do?')], peek: null };
    case 'huge':
      return {
        officer: CURRENT_USER,
        done: ALL,
        seen: ['home', 'rules'],
        thread: [...greeting(), ...Array.from({ length: 200 }, (_, i) => qa(HANDBOOK[i % HANDBOOK.length]!.question)).flat()],
        peek: null,
      };
  }
}
