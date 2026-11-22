/* The aide's one store, read by the sidebar dock, the peek bubble and the chat panel alike.
 *
 * What it keeps across visits (in this browser only): which missions are done, which pages it
 * has introduced, and which corner the panel was left in. The conversation lasts as long as
 * the tab. */

import { create } from 'zustand';
import type { PageId } from '../../lib/route';
import { CURRENT_USER } from '../../pages/rule-management/data/mockData';
import { answer, MISSIONS, nextMission, type MissionId, type Reply, type Signal } from './model';

const SAVED = 'mn-aide';

/** Where the panel sits. It's dragged between these and snaps to the nearest. */
export type Corner = 'bl' | 'br' | 'tl' | 'tr';

/** The panel's size as last chosen. Clamped to the window wherever it's used. */
export type Size = { w: number; h: number };

/** How it was opened. Only a pointer-opened panel animates (DESIGN.md, Motion). */
export type OpenedBy = 'pointer' | 'key';

export type Said =
  | { kind: 'hello' }
  | { kind: 'reply'; reply: Reply }
  | { kind: 'page'; page: PageId }
  | { kind: 'shift' }
  | { kind: 'done'; mission: MissionId }
  /** It was asked to point at something that isn't on screen. */
  | { kind: 'missing' };

export type Message = { id: number; from: 'you'; text: string } | { id: number; from: 'aide'; said: Said };

/** A short line beside the dock while the panel is shut. One at a time; the newest wins. */
export type Peek = { kind: 'hello' } | { kind: 'page'; page: PageId } | { kind: 'done'; mission: MissionId };

interface Saved {
  done: MissionId[];
  seen: PageId[];
  corner: Corner;
  /** null: the default size. */
  size: Size | null;
}

const CORNERS: Corner[] = ['bl', 'br', 'tl', 'tr'];

export function load(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED) ?? '{}') as Partial<Saved>;
    const known = new Set(MISSIONS.map((m) => m.id));
    const size = raw.size && Number.isFinite(raw.size.w) && Number.isFinite(raw.size.h) ? { w: raw.size.w, h: raw.size.h } : null;
    return {
      size,
      done: (raw.done ?? []).filter((id) => known.has(id)),
      seen: raw.seen ?? [],
      corner: CORNERS.find((c) => c === raw.corner) ?? 'bl',
    };
  } catch {
    return { done: [], seen: [], corner: 'bl', size: null };
  }
}

function save({ done, seen, corner, size }: Saved) {
  try {
    localStorage.setItem(SAVED, JSON.stringify({ done, seen, corner, size }));
  } catch {
    // Private windows can refuse storage. The first shift then lasts as long as the tab.
  }
}

export interface AideState extends Saved {
  /** Who's signed in, as "Rank Surname". */
  officer: string;
  open: OpenedBy | null;
  /** How it was last shut, so a key-shut panel vanishes at once. */
  closedBy: OpenedBy;
  thread: Message[];
  peek: Peek | null;
  /** The element the aide is pointing at. `n` restarts the ring when the same one is asked twice. */
  point: { target: string; n: number } | null;
  /** Point at this once its page has opened ("Take me there"). */
  pending: { page: PageId; target: string } | null;
  show: (by: OpenedBy) => void;
  hide: (by: OpenedBy) => void;
  hear: (signal: Signal) => void;
  /** A page has opened. The first time, the aide offers to introduce it. */
  arrive: (page: PageId) => void;
  ask: (text: string, page: PageId) => void;
  say: (said: Said) => void;
  pointAt: (target: string) => void;
  pointOnArrival: (page: PageId, target: string) => void;
  dropPeek: () => void;
  moveTo: (corner: Corner) => void;
  resize: (size: Size | null) => void;
  reset: () => void;
}

let ids = 0;
const aide = (said: Said): Message => ({ id: ++ids, from: 'aide', said });

/** A fresh conversation: just the greeting. */
export const greeting = () => [aide({ kind: 'hello' })];

export const useAide = create<AideState>((set, get) => {
  const persist = () => save(get());
  return {
    ...load(),
    officer: CURRENT_USER,
    open: null,
    closedBy: 'pointer',
    thread: greeting(),
    peek: null,
    point: null,
    pending: null,

    show: (by) => set({ open: by, peek: null }),
    hide: (by) => set({ open: null, closedBy: by }),

    hear: (signal) => {
      const { done, open } = get();
      const met = MISSIONS.filter((m) => !done.includes(m.id) && m.meets(signal)).map((m) => m.id);
      if (!met.length) return;
      const mission = met[met.length - 1]!;
      set((s) => ({
        done: [...s.done, ...met],
        // The very first one happens just by arriving, so it isn't news.
        ...(s.done.length === 0 && mission === 'home'
          ? {}
          : open
            ? { thread: [...s.thread, aide({ kind: 'done', mission })] }
            : { peek: { kind: 'done', mission } }),
      }));
      persist();
    },

    arrive: (page) => {
      const { seen, open, pending } = get();
      if (pending?.page === page) set({ pending: null, point: { target: pending.target, n: (get().point?.n ?? 0) + 1 } });
      if (page === 'login' || seen.includes(page)) return;
      const first = seen.length === 0;
      set((s) => ({
        seen: [...s.seen, page],
        ...(open
          ? { thread: [...s.thread, aide({ kind: 'page', page })] }
          : { peek: first ? { kind: 'hello' } : { kind: 'page', page } }),
      }));
      persist();
    },

    ask: (text, page) => {
      const question = text.trim();
      if (!question) return;
      set((s) => ({
        thread: [...s.thread, { id: ++ids, from: 'you', text: question }, aide({ kind: 'reply', reply: answer(question, page) })],
      }));
    },

    say: (said) => set((s) => ({ thread: [...s.thread, aide(said)] })),
    pointAt: (target) => set((s) => ({ point: { target, n: (s.point?.n ?? 0) + 1 } })),
    pointOnArrival: (page, target) => set({ pending: { page, target } }),
    dropPeek: () => set({ peek: null }),

    moveTo: (corner) => {
      set({ corner });
      persist();
    },

    resize: (size) => {
      set({ size });
      persist();
    },

    reset: () => {
      set({ done: [], seen: [] });
      persist();
    },
  };
});

export const progress = (done: readonly MissionId[]) => ({ n: done.length, of: MISSIONS.length, next: nextMission(done) });
