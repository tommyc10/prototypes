/* Throwaway: the pieces of the upload every variant arranges its own way.
 *
 *   DropWell   nothing read yet: the fan of sheets, choose a file, or try the sample
 *   Reading    the file is being read: its name, and its rows counting up
 *   Mapper     the file's own first rows, with what we took each column to be above it
 *   Stages     the analysis, a step at a time, each leaving the figure it found
 *   UploadFlow whichever of those the phase calls for */

import { useEffect, type CSSProperties } from 'react';
import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown, CornerDownLeft, FileSpreadsheet } from 'lucide-react';
import { FIELDS, FIELD_LABEL, RULES, SAMPLE_NAME, bytes, count, download, missingFields, plural, sampleCsv, type Analysis, type FieldKey } from './model';
import { useCountUp, type Ingest } from './shared';

/** Three sheets that fan out when a file comes near. */
const Sheets = () => (
  <span className="la-sheets" aria-hidden>
    <i />
    <i />
    <i />
  </span>
);

export function DropWell({ ingest, quiet }: { ingest: Ingest; quiet?: boolean }) {
  return (
    <div className="la-drop" data-over={ingest.dragging || undefined} data-quiet={quiet || undefined}>
      <Sheets />
      <h2>{ingest.dragging ? 'Let go to read it' : 'Drop a CSV of alerts or incidents'}</h2>
      <p>
        One alert per line, under a header row. It needs a <b>time</b>, a <b>service</b> and an <b>alert name</b>. The file is read in this browser and goes nowhere else.
      </p>
      <div className="la-drop-acts">
        <button className="mn-btn" data-variant="primary" onClick={ingest.browse}>
          Choose a file <kbd>U</kbd>
        </button>
        <button className="mn-btn" onClick={ingest.useSample}>
          Try the sample file
        </button>
      </div>
      {ingest.error ? (
        <p className="la-drop-error" role="alert">
          {ingest.error}
        </p>
      ) : (
        <button className="mn-link" onClick={() => download(SAMPLE_NAME, sampleCsv())}>
          Download {SAMPLE_NAME} to see the shape
        </button>
      )}
    </div>
  );
}

export function Reading({ ingest }: { ingest: Ingest }) {
  const rows = useCountUp(ingest.table?.rows.length ?? 0, 900);
  const source = ingest.source!;
  return (
    <div className="la-reading">
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
    <div className="la-map">
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
          We matched <b>{used}</b> of {table.headers.length} columns from their names. Change any that are wrong. Columns we don’t use stay in the file and out of the analysis.
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
export function UploadFlow({ ingest, analysis, quiet }: { ingest: Ingest; analysis: Analysis | null; quiet?: boolean }) {
  if (ingest.phase === 'ready') return null;
  return (
    <div className="la-flow-step" key={ingest.phase} data-phase={ingest.phase}>
      {ingest.phase === 'empty' && <DropWell ingest={ingest} quiet={quiet} />}
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
