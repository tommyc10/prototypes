/* Throwaway: the pieces of the upload every variant arranges its own way.
 *
 *   DropWell   nothing read yet: choose a file or try the sample, and what the file needs
 *   Reading    the file is being read: its name, and its rows counting up
 *   Mapper     the file's own first rows, with what we took each column to be above it
 *   Stages     the analysis, a step at a time, each leaving the figure it found
 *   UploadFlow whichever of those the phase calls for */

import { useEffect, useState, type CSSProperties } from 'react';
import { Menu } from '@base-ui/react/menu';
import { BorderBeam } from 'border-beam';
import { Check, ChevronDown, CornerDownLeft, FileSpreadsheet, FileUp, Radio } from 'lucide-react';
import { FIELDS, FIELD_LABEL, RULES, SAMPLE_NAME, bytes, count, download, missingFields, plural, sampleCsv, type Analysis, type FieldKey } from './model';
import { still, useCountUp, type Ingest } from './shared';

/** The beam is tuned for the surface it sits on, as on the Rules page's overnight block. */
const LIGHT_TUNING = { brightness: 0.45, glowSize: 1.4 };

/** What the file needs, as the file would have it: the columns we read, and a line under them. */
const SHAPE: { label: string; example: string; needed: boolean }[] = [
  { label: 'Time', example: '2026-09-14 08:12', needed: true },
  { label: 'Service', example: 'tractor-beam', needed: true },
  { label: 'Alert name', example: 'Queue backlog', needed: true },
  { label: 'Severity', example: 'P3', needed: false },
  { label: 'Incident', example: 'false', needed: false },
];

/** Nothing read yet. A raised card that asks for the file: its glow breathes while it waits
 *  (border-beam, pulse-outside: the main field on an empty page). With a file over the window
 *  the glow becomes a beam running round the edge, the card lifts, and the columns it will
 *  read light up. */
export function DropWell({ ingest }: { ingest: Ingest }) {
  // Read at render: the page re-renders on a theme switch and the moment a drag starts.
  const theme = document.documentElement.dataset.mnTheme === 'light' ? 'light' : 'dark';
  const over = ingest.dragging;
  return (
    <BorderBeam
      size={over ? 'md' : 'pulse-outside'}
      colorVariant="mono"
      theme={theme}
      {...(theme === 'light' ? LIGHT_TUNING : {})}
      // The travelling beam ignores reduced motion, so it's switched off there; the pulse turns itself off.
      active={!(over && still())}
      className="la-drop-beam"
      data-over={over || undefined}
    >
      <div className="la-drop" data-over={over || undefined}>
        <div className="la-drop-main">
          <span className="la-drop-icon" aria-hidden>
            <FileUp size={18} />
          </span>
          {/* Keyed, so the new words arrive rather than snap. */}
          <h2 key={over ? 'over' : 'idle'} className="la-drop-title">
            {over ? 'Let go to read it' : 'Drop a CSV of past alerts'}
          </h2>
          <p>Anywhere on this page, or choose one. It’s read in this browser and goes nowhere else.</p>
          <div className="la-drop-acts">
            <button className="mn-btn" data-variant="primary" onClick={ingest.browse}>
              Choose a file <kbd>U</kbd>
            </button>
            <button className="mn-btn" onClick={ingest.useSample}>
              Try the sample
            </button>
          </div>
          {ingest.error && (
            <p className="la-drop-error" role="alert">
              {ingest.error}
            </p>
          )}
        </div>

        <div className="la-shape">
          <div className="la-shape-head">
            <span>What the file needs</span>
            <button className="mn-link" onClick={() => download(SAMPLE_NAME, sampleCsv())}>
              Download the sample
            </button>
          </div>
          <div className="la-shape-table" role="table" aria-label="The columns the file needs, with an example">
            <div role="row">
              {SHAPE.map((c, i) => (
                <span key={c.label} role="columnheader" data-needed={c.needed || undefined} style={{ '--i': i } as CSSProperties}>
                  {c.label}
                  {!c.needed && <em>optional</em>}
                </span>
              ))}
            </div>
            <div role="row">
              {SHAPE.map((c) => (
                <span key={c.label} role="cell" className="mn-mono mn-truncate" title={c.example}>
                  {c.example}
                </span>
              ))}
            </div>
          </div>
        </div>

        <footer className="la-drop-foot">
          <button className="mn-link" onClick={ingest.goLive}>
            <Radio size={13} /> Or watch alerts as they arrive <kbd>L</kbd>
          </button>
        </footer>
      </div>
    </BorderBeam>
  );
}

/** The file's own first lines, streaming past behind the count while it's read. */
function Ticker({ ingest }: { ingest: Ingest }) {
  const lines = (ingest.table?.rows ?? []).slice(0, 40);
  if (!lines.length) return null;
  return (
    <div className="la-ticker" aria-hidden>
      <div>
        {lines.map((cells, i) => (
          <span key={i} className="mn-mono">
            {cells.filter(Boolean).join('  ·  ')}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Reading({ ingest }: { ingest: Ingest }) {
  const rows = useCountUp(ingest.table?.rows.length ?? 0, 900);
  const source = ingest.source!;
  return (
    <div className="la-reading">
      <Ticker ingest={ingest} />
      <span className="la-file">
        <FileSpreadsheet size={16} />
        <span className="mn-truncate">{source.name}</span>
        <span className="mn-subtle">{bytes(source.size)}</span>
      </span>
      <div className="la-reading-count">
        <b>{count(rows)}</b>
        <span>rows read</span>
      </div>
      <span className="la-reading-track" aria-hidden>
        <i />
      </span>
      <span className="mn-sr" role="status">
        Reading {source.name}
      </span>
    </div>
  );
}

export function Mapper({ ingest }: { ingest: Ingest }) {
  const table = ingest.table!;
  const fieldOf = (header: string) => (Object.keys(ingest.mapping) as FieldKey[]).find((k) => ingest.mapping[k] === header) ?? null;
  const missing = missingFields(ingest.mapping);
  const used = Object.keys(ingest.mapping).length;
  // Counts up once, when the columns arrive; after that it follows the person's changes.
  const [firstUsed] = useState(used);
  const counted = useCountUp(firstUsed, 520);
  const matched = counted < firstUsed ? counted : used;
  const sample = table.rows.slice(0, 4);
  // ↵ confirms the columns, unless a button or a menu has the key.
  const confirm = ingest.confirm;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || t.closest('button, a, input, [role="menu"]')) return;
      e.preventDefault();
      confirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return (
    <div className="la-map" style={{ '--cols': table.headers.length } as CSSProperties}>
      <header className="la-map-head">
        <span className="la-file">
          <FileSpreadsheet size={16} />
          <span className="mn-truncate">{ingest.source!.name}</span>
          <span className="mn-subtle">
            {count(table.rows.length)} rows · {bytes(ingest.source!.size)}
          </span>
        </span>
        <h2>Is this what each column is?</h2>
        <p>
          We matched <b>{matched}</b> of {table.headers.length} columns from their names. Change any that are wrong. Columns we don’t use stay in the file and out of the analysis.
        </p>
      </header>

      <div className="la-map-scroll">
        <div className="la-map-table" style={{ gridTemplateColumns: `repeat(${table.headers.length}, minmax(92px, 1fr))` }}>
          {table.headers.map((header, c) => {
            const field = fieldOf(header);
            return (
              <div key={header + c} className="la-map-col" data-used={field ? '' : undefined} style={{ '--i': c } as CSSProperties}>
                <Menu.Root>
                  <Menu.Trigger className="la-map-role" data-set={field ? '' : undefined}>
                    <span className="mn-truncate">{field ? FIELD_LABEL[field] : 'Not used'}</span>
                    <ChevronDown size={12} />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner sideOffset={6} align="start">
                      <Menu.Popup className="mn-menu la-menu" data-own-keys="">
                        <div className="mn-menu-label">{header} is the</div>
                        <Menu.RadioGroup value={field ?? 'none'} onValueChange={(v) => ingest.setField(header, v === 'none' ? null : (v as FieldKey))}>
                          {FIELDS.map((f) => (
                            <Menu.RadioItem key={f.key} value={f.key} className="mn-menu-item" closeOnClick>
                              <Menu.RadioItemIndicator className="mn-menu-ind">
                                <Check size={13} />
                              </Menu.RadioItemIndicator>
                              <span>
                                {f.label}
                                {f.required && <em className="la-menu-note">needed</em>}
                              </span>
                            </Menu.RadioItem>
                          ))}
                          <Menu.Separator className="mn-menu-sep" />
                          <Menu.RadioItem value="none" className="mn-menu-item" closeOnClick>
                            <Menu.RadioItemIndicator className="mn-menu-ind">
                              <Check size={13} />
                            </Menu.RadioItemIndicator>
                            <span>Not used</span>
                          </Menu.RadioItem>
                        </Menu.RadioGroup>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
                <div className="la-map-name mn-mono mn-truncate" title={header}>
                  {header}
                </div>
                {sample.map((row, r) => (
                  <div key={r} className="la-map-cell mn-truncate" title={row[c]}>
                    {row[c] || <span className="mn-subtle">empty</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <footer className="la-map-foot">
        {ingest.error ? (
          <span className="la-map-missing" role="alert">
            {ingest.error}
          </span>
        ) : missing.length ? (
          <span className="la-map-missing" role="alert">
            Still needed: {missing.map((f) => f.label.toLowerCase()).join(' and ')}. Open a column’s label and pick it.
          </span>
        ) : (
          <span className="la-map-ok">
            <Check size={13} /> Time, service and alert name are matched
          </span>
        )}
        <button className="mn-btn mn-btn-ghost" onClick={ingest.reset}>
          Another file <kbd>Esc</kbd>
        </button>
        <button className="mn-btn" data-variant="primary" disabled={missing.length > 0} onClick={ingest.confirm}>
          Analyse {count(table.rows.length)} rows
          <kbd>
            <CornerDownLeft size={11} />
          </kbd>
        </button>
      </footer>
    </div>
  );
}

/** The three steps of the analysis. The one under way shimmers; a finished one keeps the
 *  figure it found, so by the end the list reads as a receipt. */
export function Stages({ ingest, analysis, layout = 'column' }: { ingest: Ingest; analysis: Analysis | null; layout?: 'column' | 'row' }) {
  const data = ingest.data;
  const kept = data?.rows.length ?? 0;
  const dropped = data?.dropped.length ?? 0;
  const found = analysis?.patterns.length ?? 0;
  const steps = [
    { doing: `Reading ${count(ingest.table?.rows.length ?? 0)} rows`, done: `${count(kept)} rows kept${dropped ? `, ${dropped} dropped` : ''}` },
    { doing: 'Grouping what repeats', done: `${count(analysis?.signatures ?? 0)} alert names, ${found} ${plural(found, 'repeats', 'repeat')}` },
    { doing: `Comparing with ${RULES.length} rules`, done: `${analysis?.ruled ?? 0} already ${plural(analysis?.ruled ?? 0, 'has', 'have')} a rule` },
  ];
  return (
    <ol className="la-stages" data-layout={layout} aria-live="polite">
      {steps.map((s, i) => {
        const state = ingest.stage > i ? 'done' : ingest.stage === i ? 'doing' : 'todo';
        return (
          <li key={i} data-state={state}>
            <i aria-hidden>{state === 'done' && <Check size={11} strokeWidth={3} />}</i>
            <span className="la-stage-text">
              <span className="la-stage-doing">{s.doing}</span>
              {state === 'done' && <span className="la-stage-done">{s.done}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Whichever step of the upload the phase calls for. Each arrives once, as it becomes the step. */
export function UploadFlow({ ingest, analysis }: { ingest: Ingest; analysis: Analysis | null }) {
  if (ingest.phase === 'ready') return null;
  return (
    <div className="la-flow-step" key={ingest.phase} data-phase={ingest.phase}>
      {ingest.phase === 'empty' && <DropWell ingest={ingest} />}
      {ingest.phase === 'reading' && <Reading ingest={ingest} />}
      {ingest.phase === 'mapping' && <Mapper ingest={ingest} />}
      {ingest.phase === 'analysing' && (
        <div className="la-working">
          <span className="la-file">
            <FileSpreadsheet size={16} />
            <span className="mn-truncate">{ingest.source!.name}</span>
          </span>
          <Stages ingest={ingest} analysis={analysis} />
        </div>
      )}
    </div>
  );
}
