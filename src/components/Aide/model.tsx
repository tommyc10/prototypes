/* What the aide knows. Three bodies of knowledge, each keyed so the panel never branches on a
 * page or a topic:
 *
 *   MISSIONS   the first shift: seven things a new officer does once, in order. Each one is
 *              ticked off by watching what the person actually does (see `meets`), never by
 *              the person ticking a box.
 *   BRIEFS     one per page: what it's for, and the parts of it worth pointing at.
 *   HANDBOOK   answers for the Ask tab, found by the words in a question (see `answer`).
 *
 * It answers from this handbook, not from live data, and says so in its greeting. */

import type { ReactNode } from 'react';
import { goKey, type PageId } from '../../lib/route';

// ---------- what the aide hears ----------

/** Something the person did that a mission might be waiting for. */
export type Signal =
  | { kind: 'route'; page: PageId; parts: string[] }
  | { kind: 'palette'; page?: undefined }
  /** G, then a letter, took them to a page. */
  | { kind: 'chord'; page: PageId }
  /** Something was picked in a page's list, by click or J and K. Not every page puts it in the address. */
  | { kind: 'pick'; page: PageId };

// ---------- the first shift ----------

export type MissionId = 'home' | 'palette' | 'incident' | 'alerts' | 'rule' | 'chord' | 'forecast';

export interface Mission {
  id: MissionId;
  title: string;
  /** Why it matters, in one sentence. */
  why: string;
  /** Where it's done. Pressing the mission row goes there. */
  page: PageId;
  href: string;
  meets: (s: Signal) => boolean;
}

export const MISSIONS: Mission[] = [
  {
    id: 'home',
    title: 'Read the hour',
    why: 'Home leads with how many alerts reached a person this hour. It is the one figure a shift is judged by.',
    page: 'home',
    href: '#/',
    meets: (s) => s.kind === 'route' && s.page === 'home',
  },
  {
    id: 'palette',
    title: 'Jump with ⌘K',
    why: 'Every page, rule, incident and service is a few letters away. Most officers never touch the sidebar again.',
    page: 'home',
    href: '#/',
    meets: (s) => s.kind === 'palette',
  },
  {
    id: 'incident',
    title: 'Follow one incident',
    why: 'Each incident shows how far it got and why, checkpoint by checkpoint. Red means a rule hid something real.',
    page: 'incidents',
    href: '#/incidents',
    meets: (s) => s.page === 'incidents' && ((s.kind === 'route' && s.parts.length > 0) || s.kind === 'pick'),
  },
  {
    id: 'alerts',
    title: 'Watch the stream',
    why: 'Every alert of the last hour, and what became of it. This is where noise turns into rules.',
    page: 'alerts',
    href: '#/alerts',
    meets: (s) => s.kind === 'route' && s.page === 'alerts',
  },
  {
    id: 'rule',
    title: "Read a rule's evidence",
    why: 'A rule hides alerts from people. Before you approve one, read what it would have hidden.',
    page: 'rules',
    href: '#/rules',
    meets: (s) => s.page === 'rules' && ((s.kind === 'route' && s.parts.length > 0) || s.kind === 'pick'),
  },
  {
    id: 'chord',
    title: 'Move without the mouse',
    why: 'Press G, then a page’s letter. G I is Incidents, G R is Rules. The sidebar shows each one when you point at it.',
    page: 'home',
    href: '#/',
    meets: (s) => s.kind === 'chord',
  },
  {
    id: 'forecast',
    title: 'Look ahead',
    why: 'The forecast says what the next weeks should hold, from the patterns the hindcast found.',
    page: 'forecast',
    href: '#/forecast',
    meets: (s) => s.kind === 'route' && s.page === 'forecast',
  },
];

/** The first mission not done yet, in order. */
export const nextMission = (done: readonly MissionId[]) => MISSIONS.find((m) => !done.includes(m.id));

// ---------- the pages ----------

export interface Point {
  text: ReactNode;
  /** A selector for the real element. The panel offers "Show me" only when it's on screen. */
  target: string;
}

export interface Brief {
  name: string;
  summary: ReactNode;
  points: Point[];
  /** Pages with a guided tour (? starts it). */
  tour?: boolean;
  /** Questions to offer on the Ask tab while this page is showing. */
  asks: string[];
}

const tour = (name: string) => `[data-tour="${name}"]`;

export const BRIEFS: Record<Exclude<PageId, 'login'>, Brief> = {
  home: {
    name: 'Home',
    summary: <>How the station is this hour, and the one thing to look at first.</>,
    points: [
      { text: <>The big number is how many alerts <b>reached a person</b> in the last hour.</>, target: '.hm-figure' },
      { text: <>Under it, the most pressing thing <b>waiting on you</b>. <kbd>J</kbd> <kbd>K</kbd> step through, <kbd>↵</kbd> opens it.</>, target: '.hm-need' },
      { text: <>Every assignment group is a point on the station. <b>Drag to turn it</b>, pick one to see its work.</>, target: '.hm-station' },
    ],
    asks: ['Where should I start?', 'What is an alert reaching a person?', 'What do the colours mean?'],
  },
  incidents: {
    name: 'Incidents',
    summary: <>Every incident's journey: how far it got, and why, at each checkpoint.</>,
    points: [
      { text: <>Find an incident by its ID, service or words. <kbd>/</kbd> jumps here.</>, target: tour('ic-search') },
      { text: <>The verdict first, in one sentence. <b>Red</b> means a real incident was hidden.</>, target: tour('ic-head') },
      { text: <>The journey shows each checkpoint it passed, and where it stopped.</>, target: tour('ic-journey') },
    ],
    tour: true,
    asks: ['What is the difference between an alert and an incident?', 'What does red mean?', 'What is a journey?'],
  },
  alerts: {
    name: 'Alerts',
    summary: <>The stream: every alert of the last hour, and what became of it.</>,
    points: [
      { text: <>One dot is one alert. Height says where it ended up.</>, target: tour('al-water') },
      { text: <>Try the proposed rules on the stream before anyone approves them.</>, target: tour('al-preview') },
      { text: <>The rules doing the work. Point at one to light up its alerts.</>, target: tour('al-rules') },
    ],
    tour: true,
    asks: ['What does a rule do?', 'What happens to a hidden alert?', 'What do the colours mean?'],
  },
  changes: {
    name: 'Change windows',
    summary: <>Planned work that is allowed to be noisy. Alerts inside a window are held back, not lost.</>,
    points: [
      { text: <>Windows sorted into groups. Late ones are <b>orange</b>.</>, target: tour('cw-list') },
      { text: <>One group on a timeline, beside its neighbours.</>, target: tour('cw-timeline') },
      { text: <><kbd>M</kbd> plans maintenance for the picked window.</>, target: tour('cw-detail') },
    ],
    tour: true,
    asks: ['What is a change window?', 'What do the colours mean?', 'What are the keyboard shortcuts?'],
  },
  rules: {
    name: 'Rules',
    summary: <>The rules that hide noise, and the proposed ones waiting for a decision.</>,
    points: [
      { text: <>Your groups first. A pinned group shows on every page.</>, target: tour('groups') },
      { text: <>The queue. <b>Amber</b> dots are proposed rules waiting on someone.</>, target: tour('rows') },
      { text: <>What the rule would have hidden, replayed over real alerts.</>, target: tour('evidence') },
      { text: <>The decision. <kbd>A</kbd> approves, <kbd>X</kbd> rejects, and every change needs a reason.</>, target: tour('decision') },
    ],
    tour: true,
    asks: ['How do I approve a rule?', 'What are overnight suggestions?', 'What is a hold to confirm?'],
  },
  hindcast: {
    name: 'Hindcast',
    summary: <>Today's rules and windows replayed over past tickets: what they would have explained, and the gaps worth tuning.</>,
    points: [
      { text: <>The replay: which past tickets today's logic explains.</>, target: '.ol-rgrid' },
      { text: <>The page's keys. They're the same on every page with a list.</>, target: '.ol-keys' },
    ],
    asks: ['What is the hindcast?', 'How is the hindcast different from the forecast?', 'What is a pattern?'],
  },
  forecast: {
    name: 'Forecast',
    summary: <>What the next weeks should hold, built from the patterns the hindcast found.</>,
    points: [
      { text: <>The lead says what to expect, in a sentence.</>, target: '.ol-lead' },
      { text: <>Each panel morphs when you change the service, lookback or horizon.</>, target: '.ol-grid' },
      { text: <>The page's keys.</>, target: '.ol-keys' },
    ],
    asks: ['What is the forecast built from?', 'What is a pattern?', 'What is the hindcast?'],
  },
  access: {
    name: 'Access',
    summary: <>Who has been let in, and what each of them can see.</>,
    points: [
      { text: <>Everyone with access. Invitations not accepted yet say so.</>, target: '.mn-list' },
      { text: <>One person's scopes. <kbd>⌘</kbd><kbd>↵</kbd> saves, and every save can be undone.</>, target: '.ac-pane' },
    ],
    asks: ['How do I invite someone?', 'Can I undo a change to access?', 'Where should I start?'],
  },
};

export const briefFor = (page: PageId): Brief | null => (page === 'login' ? null : BRIEFS[page]);

// ---------- the handbook ----------

export type Action =
  /** `target`: point at it once the page has opened. */
  | { kind: 'go'; page: PageId; href: string; target?: string }
  | { kind: 'show'; target: string; label: string }
  | { kind: 'tour' };

export interface Entry {
  id: string;
  /** How it's offered as a suggestion. */
  question: string;
  /** Words and phrases that point to it. Phrases score higher than single words. */
  words: string[];
  body: ReactNode | ((page: PageId) => ReactNode);
  actions?: Action[] | ((page: PageId) => Action[]);
}

const go = (page: PageId, href: string, target?: string): Action => ({ kind: 'go', page, href, target });

export const HANDBOOK: Entry[] = [
  {
    id: 'start',
    question: 'Where should I start?',
    words: ['start', 'begin', 'first', 'new', 'onboard', 'learn', 'help', 'lost', 'overview', 'where to start'],
    body: (
      <>
        <p>Start on <b>Home</b>. It says how many alerts reached a person this hour and the one thing waiting on you.</p>
        <p>Then follow the first shift in the Guide tab. Seven steps, about ten minutes, and each one ticks itself off when you do it.</p>
      </>
    ),
    actions: [go('home', '#/')],
  },
  {
    id: 'product',
    question: 'What is Imperial Ops?',
    words: ['imperial ops', 'what is this', 'service', 'product', 'purpose', 'for', 'about'],
    body: (
      <>
        <p>Imperial Ops decides which alerts <b>reach a person</b>. Rules hide the noise, change windows hold back planned work, and incidents gather what is real.</p>
        <p>Your job on shift is to keep that line honest: hide nothing real, and wake nobody for noise.</p>
      </>
    ),
  },
  {
    id: 'paged',
    question: 'What is an alert reaching a person?',
    words: ['reach', 'reached', 'person', 'paged', 'page', 'woke', 'figure', 'number', 'big number', 'hour'],
    body: (
      <>
        <p>An alert <b>reaches a person</b> when no rule hides it, no change window holds it, and it doesn't join an incident already open.</p>
        <p>Fewer is better, as long as nothing real was hidden on the way.</p>
      </>
    ),
    actions: (page) => (page === 'home' ? [{ kind: 'show', target: '.hm-figure', label: 'Show me' }] : [go('home', '#/', '.hm-figure')]),
  },
  {
    id: 'alert-incident',
    question: 'What is the difference between an alert and an incident?',
    words: ['difference', 'alert', 'incident', 'vs', 'versus'],
    body: (
      <>
        <p>An <b>alert</b> is one signal from one service. Hundreds arrive an hour.</p>
        <p>An <b>incident</b> is something real that a team works on. Many alerts can fold into one incident.</p>
      </>
    ),
    actions: [go('alerts', '#/alerts'), go('incidents', '#/incidents')],
  },
  {
    id: 'rule',
    question: 'What does a rule do?',
    words: ['rule', 'rules', 'hide', 'hidden', 'suppress', 'noise', 'filter'],
    body: (
      <>
        <p>A <b>rule</b> hides alerts that match its conditions, so nobody is woken by them. Hidden alerts are kept, never deleted.</p>
        <p>The one thing a rule must never do is hide a <b>real incident</b>. Every rule shows a replay of what it would have hidden.</p>
      </>
    ),
    actions: [go('rules', '#/rules')],
  },
  {
    id: 'approve',
    question: 'How do I approve a rule?',
    words: ['approve', 'reject', 'decision', 'decide', 'activate', 'deactivate', 'reason'],
    body: (
      <>
        <p>Open the rule and read its evidence first. Then press <kbd>A</kbd> to approve or <kbd>X</kbd> to reject.</p>
        <p>Every change needs a written reason of at least <b>12 characters</b>. <kbd>⌘</kbd><kbd>↵</kbd> submits it, and the result arrives as a toast.</p>
      </>
    ),
    actions: (page) => (page === 'rules' ? [{ kind: 'show', target: tour('decision'), label: 'Show me' }] : [go('rules', '#/rules', tour('rows'))]),
  },
  {
    id: 'hold',
    question: 'What is a hold to confirm?',
    words: ['hold', 'override', 'safety', 'two seconds', 'confirm'],
    body: (
      <>
        <p>If a rule fails a safety check, approving it is an <b>override</b>. An orange row appears, and you hold the button for two seconds.</p>
        <p>Let go early and nothing happens. It is there so nobody overrides a check by accident.</p>
      </>
    ),
  },
  {
    id: 'overnight',
    question: 'What are overnight suggestions?',
    words: ['overnight', 'suggestion', 'suggestions', 'nightly', 'refresh', 'found overnight'],
    body: (
      <>
        <p>Each night a refresh reads the day's incidents and suggests rules for patterns it found. They wait at the top of Rules.</p>
        <p><kbd>O</kbd> jumps to them. <kbd>P</kbd> proposes one, <kbd>X</kbd> dismisses it, <kbd>T</kbd> tightens it. Undecided for three refreshes, it moves to the Unreviewed tab and waits there.</p>
      </>
    ),
    actions: (page) => (page === 'rules' ? [{ kind: 'show', target: tour('overnight'), label: 'Show me' }] : [go('rules', '#/rules', tour('overnight'))]),
  },
  {
    id: 'colours',
    question: 'What do the colours mean?',
    words: ['colour', 'colours', 'color', 'colors', 'red', 'green', 'amber', 'orange', 'grey', 'dot', 'status'],
    body: (
      <>
        <p>Everything is grey until something needs a person. Then:</p>
        <ul>
          <li><b>Green</b> is active, validated, or caught by a rule.</li>
          <li><b>Amber</b> is proposed, waiting for a decision.</li>
          <li><b>Orange</b> is a warning: low confidence, late, or an override.</li>
          <li><b>Red</b> is danger: a real incident, or a page that would be hidden.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'red',
    question: 'What does red mean?',
    words: ['red', 'danger', 'suppressed', 'bad', 'wrong'],
    body: (
      <>
        <p><b>Red</b> means danger, and only danger: a real incident, or a page a rule would hide.</p>
        <p>On an incident, a red verdict means a rule hid it. That's the first thing to fix.</p>
      </>
    ),
    actions: [go('incidents', '#/incidents')],
  },
  {
    id: 'keys',
    question: 'What are the keyboard shortcuts?',
    words: ['key', 'keys', 'keyboard', 'shortcut', 'shortcuts', 'hotkey', 'chord', 'without the mouse', 'mouse', 'navigate'],
    body: (
      <>
        <p>Every primary action has one key, shown on its button. Lists move with <kbd>J</kbd> <kbd>K</kbd>, and <kbd>/</kbd> searches.</p>
        <p><kbd>G</kbd> then a letter goes to a page: <kbd>G</kbd> <kbd>{goKey('incidents')}</kbd> Incidents, <kbd>G</kbd> <kbd>{goKey('rules')}</kbd> Rules, <kbd>G</kbd> <kbd>{goKey('alerts')}</kbd> Alerts. <kbd>[</kbd> and <kbd>]</kbd> tuck the panes away. <kbd>Q</kbd> opens me.</p>
      </>
    ),
  },
  {
    id: 'palette',
    question: 'How do I find something quickly?',
    words: ['find', 'search', 'jump', 'palette', 'command', 'cmd k', 'quick', 'quickly', 'look up'],
    body: (
      <>
        <p>Press <kbd>⌘K</kbd> anywhere. Type a few letters of a page, rule, incident or service, then <kbd>↵</kbd>.</p>
      </>
    ),
    actions: [{ kind: 'show', target: tour('jump'), label: 'Show me' }],
  },
  {
    id: 'hindcast',
    question: 'What is the hindcast?',
    words: ['hindcast', 'replay', 'past', 'backtest', 'history', 'look back'],
    body: (
      <>
        <p>The <b>hindcast</b> replays today's rules and windows over tickets that already happened. It shows what they would have explained, and the gaps worth tuning.</p>
        <p>It looks back only. It never predicts.</p>
      </>
    ),
    actions: [go('hindcast', '#/hindcast')],
  },
  {
    id: 'forecast',
    question: 'What is the forecast built from?',
    words: ['forecast', 'predict', 'prediction', 'future', 'ahead', 'next weeks', 'outlook'],
    body: (
      <>
        <p>The <b>forecast</b> takes the patterns the hindcast found and projects them over the next weeks: which services, which causes, and when.</p>
      </>
    ),
    actions: [go('forecast', '#/forecast')],
  },
  {
    id: 'cast-diff',
    question: 'How is the hindcast different from the forecast?',
    words: ['different', 'difference', 'hindcast forecast'],
    body: (
      <>
        <p>The <b>hindcast</b> looks back: what today's logic would have done to past tickets.</p>
        <p>The <b>forecast</b> looks ahead: what those same patterns suggest is coming.</p>
      </>
    ),
    actions: [go('hindcast', '#/hindcast'), go('forecast', '#/forecast')],
  },
  {
    id: 'pattern',
    question: 'What is a pattern?',
    words: ['pattern', 'patterns', 'repeat', 'cause', 'root cause'],
    body: (
      <>
        <p>A <b>pattern</b> is a root cause that keeps coming back: the same service, the same cause, at a rhythm you can see.</p>
        <p>Patterns found in the hindcast become predictions in the forecast.</p>
      </>
    ),
  },
  {
    id: 'window',
    question: 'What is a change window?',
    words: ['change window', 'window', 'windows', 'maintenance', 'planned', 'late', 'change'],
    body: (
      <>
        <p>A <b>change window</b> is planned work that's allowed to be noisy. Alerts inside it are held back, not lost.</p>
        <p>A window past its planned end turns <b>orange</b>. <kbd>M</kbd> plans maintenance for the picked one.</p>
      </>
    ),
    actions: [go('changes', '#/changes', tour('cw-list'))],
  },
  {
    id: 'journey',
    question: 'What is a journey?',
    words: ['journey', 'checkpoint', 'checkpoints', 'stage', 'stages', 'verdict'],
    body: (
      <>
        <p>Every incident's <b>journey</b> shows the checkpoints it passed on the way to a person, and the evidence for each decision. The verdict sits at the top in one sentence.</p>
      </>
    ),
    actions: (page) => (page === 'incidents' ? [{ kind: 'show', target: tour('ic-journey'), label: 'Show me' }] : [go('incidents', '#/incidents', tour('ic-search'))]),
  },
  {
    id: 'hidden-alert',
    question: 'What happens to a hidden alert?',
    words: ['happens', 'hidden alert', 'lost', 'deleted', 'kept', 'where did'],
    body: (
      <>
        <p>It's kept. A hidden alert stays in the stream with the rule that hid it, so you can trace it on the Alerts page.</p>
      </>
    ),
    actions: [go('alerts', '#/alerts', tour('al-feed'))],
  },
  {
    id: 'invite',
    question: 'How do I invite someone?',
    words: ['invite', 'invitation', 'access', 'permission', 'scope', 'scopes', 'people', 'add someone'],
    body: (
      <>
        <p>On Access, press <kbd>N</kbd> for a new invitation, then pick what they can see. Invitations not accepted yet say so in the list.</p>
      </>
    ),
    actions: [go('access', '#/access')],
  },
  {
    id: 'undo',
    question: 'Can I undo a change to access?',
    words: ['undo', 'revert', 'mistake', 'back'],
    body: (
      <>
        <p>Yes. Every save, invitation and removal on Access ends in a toast with <b>Undo</b>.</p>
        <p>A rule decision can't be undone from the toast. Make the opposite decision, with a reason.</p>
      </>
    ),
  },
  {
    id: 'tour',
    question: 'Is there a tour of this page?',
    words: ['tour', 'walkthrough', 'show me around', 'guide', 'tutorial'],
    body: (page) =>
      briefFor(page)?.tour ? (
        <p>Yes. Press <kbd>?</kbd> and the page walks you through its parts, one at a time.</p>
      ) : (
        <p>Not for this page. Incidents, Alerts, Change windows and Rules have one: press <kbd>?</kbd> there. The Guide tab here covers the rest.</p>
      ),
    actions: (page) => (briefFor(page)?.tour ? [{ kind: 'tour' }] : []),
  },
  {
    id: 'here',
    question: 'What is this page for?',
    words: ['this page', 'here', 'where am i', 'what am i looking at', 'this screen'],
    body: (page) => {
      const brief = briefFor(page);
      return brief ? (
        <p>
          You're on <b>{brief.name}</b>. {brief.summary}
        </p>
      ) : (
        <p>This is the sign-in page.</p>
      );
    },
  },
  {
    id: 'theme',
    question: 'Can I use a light theme?',
    words: ['light', 'dark', 'theme', 'bright', 'mode'],
    body: <p>Yes. The sun and moon button at the foot of the sidebar switches it, and it remembers.</p>,
  },
];

// ---------- finding an answer ----------

const STOP = new Set('a an the is are do does i me my to of in on it this that what how why when where who can you for and or be with about'.split(' '));

const clean = (text: string) =>
  text
    .toLowerCase()
    .replace(/⌘/g, ' cmd ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** "rules" → "rule", so a plural still finds its entry. */
const stem = (word: string) => (word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word);

/** How well each entry fits a question: a phrase scores 3, a word 1. */
function score(question: string) {
  const text = ` ${clean(question)} `;
  const words = new Set(clean(question).split(' ').filter((w) => !STOP.has(w)).map(stem));
  return HANDBOOK.map((entry) => {
    let points = 0;
    for (const word of entry.words) {
      if (word.includes(' ')) {
        if (text.includes(` ${word} `)) points += 3;
      } else if (words.has(stem(word))) points += 1;
    }
    // An exact suggestion, pressed or typed, is always its own answer.
    if (clean(entry.question) === clean(question)) points += 10;
    return { entry, points };
  }).filter((s) => s.points > 0);
}

export type Reply = { kind: 'answer'; entry: Entry } | { kind: 'unknown'; nearest: Entry[] };

export function answer(question: string, page: PageId): Reply {
  const ranked = score(question).sort((a, b) => b.points - a.points);
  if (ranked[0]) return { kind: 'answer', entry: ranked[0].entry };
  // Nothing fits: offer this page's questions, so the next try is one press away.
  const asks = briefFor(page)?.asks ?? [];
  const nearest = asks.map((q) => HANDBOOK.find((e) => e.question === q)).filter((e): e is Entry => !!e);
  return { kind: 'unknown', nearest: nearest.length ? nearest : HANDBOOK.slice(0, 3) };
}

export const entryById = (id: string) => HANDBOOK.find((e) => e.id === id);

export const resolve = <T,>(value: T | ((page: PageId) => T), page: PageId): T =>
  typeof value === 'function' ? (value as (page: PageId) => T)(page) : value;
