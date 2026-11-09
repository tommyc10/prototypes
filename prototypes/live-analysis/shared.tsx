/* Throwaway: what every Live analysis variant is given, and the pieces they share: reading a
 * file (useIngest), the page's keys, the filters, the status marks, the action buttons and
 * the decision form. The upload's own pieces are in upload.tsx, a pattern's lenses in lenses.tsx. */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, Eye, Lock, Search, ShieldOff, Telescope, X } from 'lucide-react';
import { useKeyboardShortcuts } from '../../src/hooks/useKeyboardShortcuts';
import {
  ACT_KEY,
  ACT_LABEL,
  ADVICE_LABEL,
  MIN_REASON,
  PEOPLE,
  SAMPLE_NAME,
  STATUS_LABEL,
  actsFor,
  can,
  extent,
  guessMapping,
  identify,
  missingFields,
  parseCsv,
  sampleCsv,
  toRows,
  type Act,
  type Advice,
  type Analysis,
  type Dropped,
  type FieldKey,
  type Mapping,
  type Pattern,
  type Review,
  type Role,
  type Row,
  type Status,
  type Table,
} from './model';

export const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- reading a file ---------- */

export interface Source {
  name: string;
  size: number;
  /** SHA-256 of the file's bytes, in hex. */
  hash: string;
  readAt: number;
  by: string;
}

export interface Dataset {
  rows: Row[];
  dropped: Dropped[];
  ids: Map<string, string>;
  /** How many weeks the file reaches back. */
  span: number;
}

/** empty → reading → mapping (the person confirms the columns) → analysing (three stages) → ready */
export type Phase = 'empty' | 'reading' | 'mapping' | 'analysing' | 'ready';

export interface Ingest {
  phase: Phase;
  /** While analysing: 0 reading the rows, 1 grouping what repeats, 2 comparing with the rules. */
  stage: number;
  source?: Source;
  table?: Table;
  mapping: Mapping;
  data?: Dataset;
  /** What went wrong with the last file, in a sentence that says what to do. */
  error?: string;
  /** A file is being dragged over the window. */
  dragging: boolean;
  take: (file: File) => void;
  browse: () => void;
  useSample: () => void;
  setField: (header: string, field: FieldKey | null) => void;
  confirm: () => void;
  reset: () => void;
}

/** How long the file's rows count up for, and how long each stage of the analysis shows. The
 *  work itself takes a few milliseconds; the wait is there so each step can be read. */
const READ_MS = 1250;
const STAGE_MS = [900, 950, 1000];

async function sha256(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function useIngest(by: string): Ingest {
  const [state, setState] = useState<Pick<Ingest, 'phase' | 'stage' | 'source' | 'table' | 'mapping' | 'data' | 'error'>>({ phase: 'empty', stage: 0, mapping: {} });
  const [dragging, setDragging] = useState(false);
  const timers = useRef<number[]>([]);
  const run = useRef(0);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    run.current++;
  };

  const take = async (file: File) => {
    clear();
    const mine = run.current;
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
    if (!['csv', 'tsv', 'txt'].includes(ext)) {
      setState({ phase: 'empty', stage: 0, mapping: {}, error: `${file.name} isn't a CSV. Export it as CSV, then drop it here again.` });
      return;
    }
    const started = performance.now();
    setState({ phase: 'reading', stage: 0, mapping: {}, source: { name: file.name, size: file.size, hash: '', readAt: Date.now(), by } });
    const text = await file.text();
    const table = parseCsv(text);
    const hash = await sha256(text);
    if (mine !== run.current) return;
    if (!table.rows.length) {
      setState({ phase: 'empty', stage: 0, mapping: {}, error: `${file.name} has ${table.headers.length ? 'a header row but no alerts under it' : 'nothing in it'}. Check the export and drop it again.` });
      return;
    }
    setState((s) => ({ ...s, table, source: { ...s.source!, hash } }));
    later(() => setState((s) => ({ ...s, phase: 'mapping', mapping: guessMapping(table.headers) })), Math.max(0, READ_MS - (performance.now() - started)));
  };

  const confirm = () => {
    if (state.phase !== 'mapping' || !state.table || missingFields(state.mapping).length) return;
    const { rows, dropped } = toRows(state.table, state.mapping);
    if (!rows.length) {
      setState((s) => ({ ...s, error: `None of the ${s.table!.rows.length} rows has a time we can read in "${s.mapping.time}". Pick another column for the time.` }));
      return;
    }
    clear();
    setState((s) => ({ ...s, phase: 'analysing', stage: 0, error: undefined, data: { rows, dropped, ids: identify(rows), span: extent(rows).span } }));
    later(() => setState((s) => ({ ...s, stage: 1 })), STAGE_MS[0]);
    later(() => setState((s) => ({ ...s, stage: 2 })), STAGE_MS[0] + STAGE_MS[1]);
    later(() => setState((s) => ({ ...s, phase: 'ready', stage: 3 })), STAGE_MS[0] + STAGE_MS[1] + STAGE_MS[2]);
  };

  const live = useRef({ take });
  live.current = { take };

  // The whole window takes a dropped file, so there is no wrong place to let go.
  useEffect(() => {
    let depth = 0;
    const files = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes('Files');
    const enter = (e: DragEvent) => {
      if (!files(e)) return;
      depth++;
      setDragging(true);
    };
    const over = (e: DragEvent) => {
      if (files(e)) e.preventDefault();
    };
    const leave = (e: DragEvent) => {
      if (!files(e)) return;
      depth = Math.max(0, depth - 1);
      if (!depth) setDragging(false);
    };
    const drop = (e: DragEvent) => {
      if (!files(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const file = e.dataTransfer!.files[0];
      if (file) live.current.take(file);
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, []);

  useEffect(() => clear, []);

  return {
    ...state,
    dragging,
    take,
    confirm,
    browse: () => {
      const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.csv,.tsv,.txt,text/csv' });
      input.onchange = () => input.files?.[0] && take(input.files[0]);
      input.click();
    },
    useSample: () => take(new File([sampleCsv()], SAMPLE_NAME, { type: 'text/csv' })),
    setField: (header, field) =>
      setState((s) => {
        const mapping: Mapping = {};
        for (const [k, h] of Object.entries(s.mapping) as [FieldKey, string][]) if (h !== header && k !== field) mapping[k] = h;
        if (field) mapping[field] = header;
        return { ...s, mapping, error: undefined };
      }),
    reset: () => {
      clear();
      setState({ phase: 'empty', stage: 0, mapping: {} });
    },
  };
}

/** A number that counts up to its target once, then follows it. Linear: it's a meter. */
export function useCountUp(target: number, ms: number) {
  const [shown, setShown] = useState(still() ? target : 0);
  useEffect(() => {
    if (still()) return setShown(target);
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, (now - start) / ms);
      setShown(Math.round(target * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);
  return shown;
}

/* ---------- what every variant is given ---------- */

export interface Filters {
  weeks: number;
  service: string;
  sevs: number[];
  query: string;
}

export type LensKey = 'evidence' | 'rules' | 'maths' | 'source' | 'review';

export interface Deciding {
  key: string;
  act: Act;
  /** Opened with the pointer: it rises in. From a key, it's just there. */
  animate: boolean;
}

export interface VariantProps {
  ingest: Ingest;
  /** The file's patterns in the current scope. Null until a file has been mapped. */
  analysis: Analysis | null;
  /** The patterns left after the search. */
  shown: Pattern[];
  picked: Pattern | null;
  /** The pick came from the pointer, so what it opens may rise in. */
  arrive: boolean;
  onPick: (key: string | null, by?: 'pointer' | 'key') => void;
  reviews: Record<string, Review>;
  statusOf: (key: string) => Status;
  role: Role;
  /** Do this to a pattern. Opens the decision form when it needs a reason. */
  onAct: (p: Pattern, act: Act, by?: 'pointer' | 'key') => void;
  deciding: Deciding | null;
  onDecide: (note: string) => void;
  onCancelDecision: () => void;
  filters: Filters;
  onFilters: (patch: Partial<Filters>) => void;
  lens: LensKey;
  onLens: (lens: LensKey) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  /** The page's own keys. A variant adds its own and runs the page's one listener (usePageKeys). */
  shortcuts: { paletteOpen: boolean; onTogglePalette: () => void; keys: Record<string, () => void> };
}

/** The page's one key listener, with the keys every variant shares: J K through `order`,
 *  I P X A on the picked pattern, U to choose a file, ↵ to confirm the columns. */
export function usePageKeys(props: VariantProps, order: Pattern[], extra: Record<string, () => void> = {}) {
  const { ingest, picked, onPick, onAct, statusOf, deciding } = props;
  const step = (by: number) => {
    if (!order.length) return;
    const at = picked ? order.findIndex((p) => p.key === picked.key) : -1;
    const next = order[at < 0 ? (by > 0 ? 0 : order.length - 1) : Math.max(0, Math.min(order.length - 1, at + by))];
    if (next) onPick(next.key, 'key');
  };
  const on = (act: Act) => () => picked && onAct(picked, act, 'key');
  useKeyboardShortcuts({
    tourOpen: false,
    paletteOpen: props.shortcuts.paletteOpen,
    onTogglePalette: props.shortcuts.onTogglePalette,
    decisionOpen: !!deciding,
    onCancelDecision: props.onCancelDecision,
    keys: {
      ...props.shortcuts.keys,
      j: () => step(1),
      ArrowDown: () => step(1),
      k: () => step(-1),
      ArrowUp: () => step(-1),
      i: on('investigate'),
      p: on('propose'),
      a: on('approve'),
      x: () => picked && onAct(picked, statusOf(picked.key) === 'proposed' ? 'reject' : 'dismiss', 'key'),
      u: ingest.browse,
      '/': () => props.searchRef.current?.focus(),
      Escape: () => (ingest.phase === 'mapping' || ingest.phase === 'reading' ? ingest.reset() : onPick(null)),
      ...extra,
    },
  });
}

/* ---------- small marks ---------- */

export const StatusDot = ({ status }: { status: Status }) => <i className="la-dot" data-status={status} aria-hidden />;

export const StatusBadge = ({ status }: { status: Status }) => (
  <span className="la-badge" data-status={status}>
    <StatusDot status={status} />
    {STATUS_LABEL[status]}
  </span>
);

const ADVICE_ICON: Record<Advice, typeof Eye> = { investigate: Telescope, suppress: ShieldOff, watch: Eye };

/** What the analysis suggests. Grey: it's advice, not a status. */
export function AdviceChip({ advice }: { advice: Advice }) {
  const Icon = ADVICE_ICON[advice];
  return (
    <span className="la-advice" data-advice={advice}>
      <Icon size={12} />
      {ADVICE_LABEL[advice]}
    </span>
  );
}

/** A pattern's weeks as a row of small bars; the latest week is the bright one. */
export function Spark({ weeks }: { weeks: number[] }) {
  const max = Math.max(1, ...weeks);
  return (
    <span className="la-spark" aria-hidden>
      {weeks.map((n, i) => (
        <i key={i} style={{ height: `${Math.max(n ? 12 : 4, (n / max) * 100)}%` }} data-now={i === weeks.length - 1 || undefined} />
      ))}
    </span>
  );
}

/* ---------- filters ---------- */

export function WeeksControl({ span, weeks, onWeeks }: { span: number; weeks: number; onWeeks: (w: number) => void }) {
  const options = [...new Set([4, 8, 12, 26].filter((w) => w < span).concat(span))];
  if (options.length < 2) return null;
  return (
    <div className="la-seg" role="group" aria-label="Lookback">
      {options.map((w) => (
        <button key={w} className="mn-tab" data-active={w === weeks || undefined} aria-pressed={w === weeks} onClick={() => onWeeks(w)}>
          {w} wk
        </button>
      ))}
    </div>
  );
}

export function ScopeMenus({ services, filters, onFilters }: { services: string[]; filters: Filters; onFilters: (patch: Partial<Filters>) => void }) {
  const every = filters.sevs.length === 4;
  return (
    <>
      <Menu.Root>
        <Menu.Trigger className="la-pick" data-set={filters.service !== 'all' || undefined}>
          <span className="mn-truncate">{filters.service === 'all' ? 'Every service' : filters.service}</span>
          <ChevronDown size={13} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={6} align="start">
            <Menu.Popup className="mn-menu la-menu" data-own-keys="">
              <Menu.RadioGroup value={filters.service} onValueChange={(v) => onFilters({ service: v as string })}>
                {['all', ...services].map((s) => (
                  <Menu.RadioItem key={s} value={s} className="mn-menu-item" closeOnClick>
                    <Menu.RadioItemIndicator className="mn-menu-ind">
                      <Check size={13} />
                    </Menu.RadioItemIndicator>
                    <span>{s === 'all' ? 'Every service' : s}</span>
                  </Menu.RadioItem>
                ))}
              </Menu.RadioGroup>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <Menu.Root>
        <Menu.Trigger className="la-pick" data-set={!every || undefined}>
          <span>{every ? 'Every severity' : filters.sevs.length ? filters.sevs.map((s) => `P${s}`).join(', ') : 'No severity'}</span>
          <ChevronDown size={13} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={6} align="start">
            <Menu.Popup className="mn-menu la-menu" data-own-keys="">
              <div className="mn-menu-label">Count alerts at</div>
              {[1, 2, 3, 4].map((s) => (
                <Menu.CheckboxItem
                  key={s}
                  className="mn-menu-item"
                  checked={filters.sevs.includes(s)}
                  onCheckedChange={(on) => onFilters({ sevs: on ? [...filters.sevs, s].sort() : filters.sevs.filter((v) => v !== s) })}
                >
                  <Menu.CheckboxItemIndicator className="mn-menu-ind">
                    <Check size={13} />
                  </Menu.CheckboxItemIndicator>
                  <span>P{s}{s === 1 ? ', always pages' : ''}</span>
                </Menu.CheckboxItem>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </>
  );
}

export function SearchBox({ value, onChange, inputRef, placeholder = 'Search patterns' }: { value: string; onChange: (v: string) => void; inputRef: RefObject<HTMLInputElement | null>; placeholder?: string }) {
  return (
    <label className="mn-search la-search">
      <Search size={14} />
      <input ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value ? (
        <button className="la-search-clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={13} />
        </button>
      ) : (
        <kbd>/</kbd>
      )}
    </label>
  );
}

/** Every filter in one row: the lookback, the service, the severities. */
export function FilterRow({ analysis, span, services, filters, onFilters, children }: { analysis: Analysis; span: number; services: string[]; filters: Filters; onFilters: (patch: Partial<Filters>) => void; children?: ReactNode }) {
  const narrowed = filters.service !== 'all' || filters.sevs.length !== 4 || filters.weeks !== span;
  return (
    <div className="la-filters">
      <WeeksControl span={span} weeks={analysis.scope.weeks} onWeeks={(weeks) => onFilters({ weeks })} />
      <ScopeMenus services={services} filters={filters} onFilters={onFilters} />
      {narrowed && (
        <button className="mn-link" onClick={() => onFilters({ service: 'all', sevs: [1, 2, 3, 4], weeks: span })}>
          Clear
        </button>
      )}
      {children}
    </div>
  );
}

/* ---------- a pattern's heading and figures ---------- */

export function PatternHead({ p, status, children }: { p: Pattern; status: Status; children?: ReactNode }) {
  return (
    <header className="la-head">
      <div className="la-head-top">
        <span className="mn-mono mn-subtle">{p.id}</span>
        <StatusBadge status={status} />
        <AdviceChip advice={p.advice} />
        {children}
      </div>
      <h2 title={p.signature}>{p.signature}</h2>
      <p className="la-head-why">
        <b>{p.service}</b> · {p.why}
      </p>
    </header>
  );
}

/* ---------- acting on a pattern ---------- */

export function Actions({ p, status, role, onAct, wide }: { p: Pattern; status: Status; role: Role; onAct: VariantProps['onAct']; wide?: boolean }) {
  const acts = actsFor(status);
  const primary: Act | undefined = acts.includes('approve') ? 'approve' : acts.includes('propose') ? 'propose' : undefined;
  const blocked = acts.map((a) => can(role, a, status)).find((c) => !c.ok);
  return (
    <div className="la-actions" data-wide={wide || undefined}>
      {blocked && (
        <span className="la-locked">
          <Lock size={12} />
          {blocked.why}
        </span>
      )}
      {acts.map((act) => {
        const allowed = can(role, act, status);
        return (
          <button
            key={act}
            className={act === 'investigate' || act === 'reopen' || act === primary || act === 'reject' ? 'mn-btn' : 'mn-btn mn-btn-ghost'}
            data-variant={act === primary ? 'primary' : act === 'reject' ? 'danger' : undefined}
            disabled={!allowed.ok}
            title={allowed.why}
            onClick={() => onAct(p, act, 'pointer')}
          >
            {ACT_LABEL[act]}
            {ACT_KEY[act] && <kbd>{ACT_KEY[act]}</kbd>}
          </button>
        );
      })}
    </div>
  );
}

const DECIDE_TITLE: Partial<Record<Act, string>> = { propose: 'Propose suppressing', dismiss: 'Dismiss', approve: 'Approve the proposal for', reject: 'Reject the proposal for' };
const DECIDE_HINT: Partial<Record<Act, string>> = {
  propose: 'It goes to a rule governor. Nothing is held back until they approve it.',
  dismiss: 'It leaves the list of things to decide. The rows stay in the file.',
  approve: 'It becomes a proposed rule on the Rules page, with this analysis as its evidence.',
  reject: 'It goes back to the analyst with your reason.',
};
const DECIDE_PLACEHOLDER: Partial<Record<Act, string>> = {
  propose: 'Why is this safe to hold back?',
  dismiss: 'Why doesn’t this need a decision?',
  approve: 'What convinced you?',
  reject: 'What would need to change?',
};

/** The decision form: glass over the pane, so the evidence stays behind it. A written reason of
 *  at least twelve characters, as on the Rules page. */
export function DecisionForm({ deciding, p, onCancel, onDecide }: { deciding: Deciding; p: Pattern; onCancel: () => void; onDecide: (note: string) => void }) {
  const [note, setNote] = useState('');
  const field = useRef<HTMLTextAreaElement>(null);
  const enough = note.trim().length >= MIN_REASON;
  useLayoutEffect(() => field.current?.focus(), []);
  const submit = () => enough && onDecide(note.trim());
  return (
    <form
      className="la-decide"
      data-animate={deciding.animate || undefined}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          e.stopPropagation();
          submit();
        }
      }}
    >
      <div className="la-decide-head">
        <div>
          <div className="la-decide-title">
            {DECIDE_TITLE[deciding.act]} {p.id}
          </div>
          <div className="la-decide-hint">{DECIDE_HINT[deciding.act]}</div>
        </div>
        {deciding.act === 'propose' && (
          <div className="mn-backtest" aria-label="What the proposal would do">
            <div>
              <b>{p.proposal.caught}</b>
              <span>alerts held back</span>
            </div>
            <div data-bad={p.proposal.hidden ? '' : undefined}>
              <b>{p.proposal.hidden}</b>
              <span>real incidents hidden</span>
            </div>
          </div>
        )}
      </div>
      <label className="la-decide-field">
        <span className="mn-sr">Reason</span>
        <textarea ref={field} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={DECIDE_PLACEHOLDER[deciding.act]} />
      </label>
      <div className="la-decide-foot">
        <span className="la-decide-count" data-ok={enough || undefined}>
          {enough ? (
            <>
              <Check size={13} /> Reason recorded with your name
            </>
          ) : (
            `${note.trim().length}/${MIN_REASON} characters`
          )}
        </span>
        <button type="button" className="mn-btn mn-btn-ghost" onClick={onCancel}>
          Cancel <kbd>Esc</kbd>
        </button>
        <button type="submit" className="mn-btn" data-variant={deciding.act === 'reject' ? 'danger' : 'primary'} disabled={!enough}>
          {ACT_LABEL[deciding.act]} <kbd>⌘↵</kbd>
        </button>
      </div>
    </form>
  );
}

/** Who is looking, for the bar and the provenance. */
export const personOf = (role: Role) => PEOPLE[role];
