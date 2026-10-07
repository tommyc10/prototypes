/* The waterline: the last hour of alerts, one dot each.
 *
 *   above the line   alerts people saw: the ones that reached a person nearest the line
 *                    (bright), then the ones folded into an open incident (grey)
 *   below the line   alerts a rule hid (dim)
 *
 * Time runs left to right and "now" is the right edge. A new alert appears in the gutter
 * beyond it, then settles into its place: up if it was seen, down if it was hidden.
 * With the preview on, alerts a proposed rule would hide sink below the line as hollow
 * rings. A red ring was a real page.
 *
 * It's drawn on a <canvas>, not as hundreds of elements: one function redraws every dot
 * each frame, which is what keeps a thousand of them smooth. Every dot has a place it wants
 * to be (worked out from the data) and a place it is; each frame it closes part of the gap.
 * That one rule gives arriving, sinking and re-stacking without writing three animations,
 * and a change of mind mid-move just gives the dot a new place to head for.
 *
 * The chart is the picture; the feed beside it is the same alerts as a list, for anyone
 * who can't use the picture. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { MINUTE, WINDOW, WINDOW_MINUTES } from '../../data/mockData';
import { OUTCOME_LABEL } from '../../model/labels';
import { isSunk } from '../../model/stream';
import type { StreamAlert, Tally } from '../../model/types';
import './Waterline.css';

/** Room on the right, past "now", where new alerts appear. */
const GUTTER = 64;
/** Space kept clear above and below the dots, for the labels and the time axis. */
const PAD_TOP = 34;
const PAD_BOTTOM = 30;
/** The gap between the line and the first row of dots, each side. */
const LINE_GAP = 7;
/** How long a new alert waits in the gutter before it moves. */
const HOLD = 320;

type Kind = 'paged' | 'folded' | 'hidden' | 'ring' | 'ring-paged';

interface Slot {
  alert: StreamAlert;
  kind: Kind;
  up: boolean;
  /** Its place in its minute's stack: 0 is nearest the line. */
  index: number;
}

interface Plan {
  slots: Slot[];
  /** The tallest stacks, whichever way the preview is set, so the dot size never jumps. */
  maxUp: number;
  maxDown: number;
  byMinute: Map<number, { paged: number; folded: number; hidden: number }>;
}

/** Give every alert its place in its minute's stack. */
function plan(alerts: StreamAlert[], preview: boolean): Plan {
  const minutes = new Map<number, StreamAlert[]>();
  for (const alert of alerts) {
    const minute = Math.floor(alert.at / MINUTE);
    (minutes.get(minute) ?? minutes.set(minute, []).get(minute)!).push(alert);
  }

  const slots: Slot[] = [];
  const byMinute: Plan['byMinute'] = new Map();
  let maxUp = 1;
  let maxDown = 1;

  for (const [minute, group] of minutes) {
    const sunk = (a: StreamAlert) => isSunk(a, preview);
    const ring = (a: StreamAlert): Kind => (a.outcome === 'paged' ? 'ring-paged' : 'ring');
    // Above: reached a person first (nearest the line), then folded.
    const up = [...group.filter((a) => !sunk(a) && a.outcome === 'paged'), ...group.filter((a) => !sunk(a) && a.outcome === 'folded')];
    // Below: what the preview would newly hide (nearest the line, where it's seen), then the hidden.
    const down = [...group.filter((a) => sunk(a) && a.outcome !== 'hidden'), ...group.filter((a) => a.outcome === 'hidden')];
    up.forEach((alert, index) => slots.push({ alert, kind: alert.outcome, up: true, index }));
    down.forEach((alert, index) => slots.push({ alert, kind: alert.outcome === 'hidden' ? 'hidden' : ring(alert), up: false, index }));

    const count = { paged: 0, folded: 0, hidden: 0 };
    for (const alert of group) count[alert.outcome]++;
    byMinute.set(minute, count);
    maxUp = Math.max(maxUp, count.paged + count.folded);
    maxDown = Math.max(maxDown, group.filter((a) => a.outcome === 'hidden' || a.wouldHide).length);
  }
  return { slots, maxUp, maxDown, byMinute };
}

const time = (ms: number, seconds = false) =>
  new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: seconds ? '2-digit' : undefined });

type Tip =
  | { kind: 'alert'; x: number; y: number; alert: StreamAlert; sunk: boolean }
  | { kind: 'minute'; x: number; minute: number; count: { paged: number; folded: number; hidden: number }; /** Sit to the left: no room on the right. */ flip: boolean };

export function Waterline({
  alerts,
  counts,
  clock,
  playhead,
  preview,
  selectedId,
  focusRuleId,
  theme,
  onSelect,
  onScrub,
}: {
  /** The last hour, oldest first. */
  alerts: StreamAlert[];
  /** The totals up to the playhead, for the labels. */
  counts: Tally;
  /** The exact time, read every frame. */
  clock: () => number;
  /** Where the stream has been rewound to, or null when it's live. */
  playhead: number | null;
  preview: boolean;
  selectedId: string | null;
  /** Light up one rule's alerts and dim the rest. */
  focusRuleId: string | null;
  /** Only so the colours are read again when the theme changes. */
  theme: string;
  onSelect: (id: string) => void;
  onScrub: (at: number | null) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const planned = useMemo(() => plan(alerts, preview), [alerts, preview]);

  // The drawing loop is started once, so it reads the latest of everything from this ref.
  const live = useRef({ planned, playhead, selectedId, focusRuleId, onSelect, onScrub });
  live.current = { planned, playhead, selectedId, focusRuleId, onSelect, onScrub };

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // The theme's colours, read from CSS so the chart follows light and dark like everything else.
    const css = getComputedStyle(wrap);
    const colour = (name: string) => css.getPropertyValue(name).trim();
    const ink = {
      paged: colour('--al-paged'),
      folded: colour('--al-folded'),
      hidden: colour('--al-hidden'),
      ring: colour('--al-folded'),
      'ring-paged': colour('--red'),
      line: colour('--line-2'),
      grid: colour('--line'),
      text: colour('--fg-3'),
      strong: colour('--fg'),
      surface: colour('--l2'),
    };

    let width = 0;
    let height = 0;
    const measure = () => {
      const dpr = window.devicePixelRatio || 1;
      width = wrap.clientWidth;
      height = wrap.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    measure();

    /** Where each dot is right now. */
    const dots = new Map<string, { x: number; y: number; alpha: number; since: number; arriving: boolean }>();
    /** Alerts newer than this arrived while the page was open, so they animate in. */
    const openedAt = clock();
    /** Where the dots were drawn last frame, for finding the one under the pointer. */
    let drawn: { slot: Slot; x: number; y: number }[] = [];
    let pointer: { x: number; y: number } | null = null;
    let dragging = false;
    let tipKey = '';
    let last = performance.now();
    let frame = 0;

    const draw = (t: number) => {
      frame = requestAnimationFrame(draw);
      const dt = Math.min(64, t - last);
      last = t;
      const { planned, playhead, selectedId, focusRuleId } = live.current;
      const now = clock();
      const start = now - WINDOW;
      const plotW = Math.max(120, width - GUTTER);
      const minuteW = plotW / WINDOW_MINUTES;
      const baseline = Math.round(PAD_TOP + (height - PAD_TOP - PAD_BOTTOM) * 0.42);

      // The biggest dot that lets the tallest stacks fit, each side of the line. A wide chart
      // has room for several dots side by side in a minute, so its stacks are shorter and
      // its dots can be bigger: the chart fills its height at any width.
      let pitch = 13;
      let perRow = 1;
      for (; pitch >= 4; pitch -= 0.5) {
        perRow = Math.max(1, Math.floor((minuteW - 1) / pitch));
        const fitsUp = Math.ceil(planned.maxUp / perRow) * pitch <= baseline - LINE_GAP - PAD_TOP;
        const fitsDown = Math.ceil(planned.maxDown / perRow) * pitch <= height - PAD_BOTTOM - LINE_GAP - baseline;
        if (fitsUp && fitsDown) break;
      }
      pitch = Math.max(4, pitch);
      const radius = (pitch - 2) / 2;
      const inset = (minuteW - perRow * pitch) / 2 + pitch / 2;
      const xOf = (ms: number) => ((ms - start) / WINDOW) * plotW;

      ctx.clearRect(0, 0, width, height);

      // The time axis: a faint rule and a label every ten minutes.
      ctx.font = "11px 'Geist Variable', system-ui, sans-serif";
      ctx.textBaseline = 'alphabetic';
      for (let m = Math.ceil(start / (10 * MINUTE)) * 10 * MINUTE; m < now - 4 * MINUTE; m += 10 * MINUTE) {
        const x = Math.round(xOf(m)) + 0.5;
        ctx.strokeStyle = ink.grid;
        ctx.beginPath();
        ctx.moveTo(x, PAD_TOP - 6);
        ctx.lineTo(x, height - PAD_BOTTOM + 6);
        ctx.stroke();
        ctx.fillStyle = ink.text;
        ctx.textAlign = x < 24 ? 'left' : 'center';
        ctx.fillText(time(m), x, height - 9);
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = playhead === null ? ink.strong : ink.text;
      ctx.fillText('Now', plotW, height - 9);
      ctx.strokeStyle = ink.line;
      ctx.beginPath();
      ctx.moveTo(Math.round(plotW) + 0.5, PAD_TOP - 6);
      ctx.lineTo(Math.round(plotW) + 0.5, height - PAD_BOTTOM + 6);
      ctx.stroke();

      // The minute under the pointer, as a faint band.
      if (pointer && !dragging && pointer.x <= plotW) {
        const minute = Math.floor((start + (pointer.x / plotW) * WINDOW) / MINUTE) * MINUTE;
        ctx.fillStyle = ink.grid;
        ctx.fillRect(xOf(minute), PAD_TOP - 6, minuteW, height - PAD_TOP - PAD_BOTTOM + 12);
      }

      // The waterline itself.
      ctx.strokeStyle = ink.line;
      ctx.beginPath();
      ctx.moveTo(0, baseline + 0.5);
      ctx.lineTo(width, baseline + 0.5);
      ctx.stroke();

      // Each frame a dot closes this share of the gap to where it should be: fast at first,
      // then easing in. With reduced motion it's simply there.
      const still = reduceMotion.matches;
      const ease = (ms: number) => (still ? 1 : 1 - Math.exp(-dt / ms));

      drawn = [];
      const seen = new Set<string>();
      for (const slot of planned.slots) {
        const { alert } = slot;
        seen.add(alert.id);
        const column = xOf(Math.floor(alert.at / MINUTE) * MINUTE) + inset + (slot.index % perRow) * pitch;
        const row = Math.floor(slot.index / perRow) * pitch + pitch / 2 + LINE_GAP;
        const targetX = column;
        const targetY = slot.up ? baseline - row : baseline + row;

        let dot = dots.get(alert.id);
        if (!dot) {
          // New while the page is open: it starts in the gutter, on the line. Otherwise it was
          // already there when the page loaded, so it starts in its place.
          const arriving = alert.at > openedAt && !still;
          dot = arriving
            ? { x: plotW + GUTTER / 2, y: baseline, alpha: 0, since: t, arriving: true }
            : { x: targetX, y: targetY, alpha: 1, since: t, arriving: false };
          dots.set(alert.id, dot);
        }

        dot.alpha += (1 - dot.alpha) * (1 - Math.exp(-dt / 120));
        if (dot.arriving) {
          if (t - dot.since > HOLD) {
            dot.x += (targetX - dot.x) * ease(170);
            dot.y += (targetY - dot.y) * ease(170);
            if (Math.abs(targetX - dot.x) < 0.5 && Math.abs(targetY - dot.y) < 0.5) dot.arriving = false;
          }
        } else {
          dot.x = targetX; // time only drifts: no need to chase it
          dot.y += (targetY - dot.y) * ease(110);
          if (Math.abs(targetY - dot.y) < 0.3) dot.y = targetY;
        }
        if (dot.x < -pitch) continue;

        // Fainter: past the left edge, after the playhead, or not the rule in focus.
        let alpha = dot.alpha * Math.min(1, Math.max(0, (dot.x + pitch) / 16));
        if (playhead !== null && alert.at > playhead) alpha *= 0.2;
        if (focusRuleId && alert.ruleId !== focusRuleId) alpha *= 0.16;

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        if (slot.kind === 'ring' || slot.kind === 'ring-paged') {
          ctx.arc(dot.x, dot.y, radius - 0.6, 0, Math.PI * 2);
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = ink[slot.kind];
          ctx.stroke();
        } else {
          ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = ink[slot.kind];
          ctx.fill();
        }
        drawn.push({ slot, x: dot.x, y: dot.y });
      }
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      for (const id of dots.keys()) if (!seen.has(id)) dots.delete(id);

      // The playhead, when the stream has been rewound.
      if (playhead !== null) {
        const x = Math.round(xOf(playhead)) + 0.5;
        ctx.strokeStyle = ink.strong;
        ctx.beginPath();
        ctx.moveTo(x, PAD_TOP - 10);
        ctx.lineTo(x, height - PAD_BOTTOM + 6);
        ctx.stroke();
        ctx.fillStyle = ink.strong;
        ctx.beginPath();
        ctx.arc(x, PAD_TOP - 10, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // The dot under the pointer, or failing that the minute it's over.
      let hit: (typeof drawn)[number] | null = null;
      if (pointer && !dragging) {
        let best = (pitch / 2 + 5) ** 2;
        for (const d of drawn) {
          const distance = (d.x - pointer.x) ** 2 + (d.y - pointer.y) ** 2;
          if (distance < best) {
            best = distance;
            hit = d;
          }
        }
      }
      const ringed = [hit, drawn.find((d) => d.slot.alert.id === selectedId) ?? null];
      ringed.forEach((d, i) => {
        if (!d) return;
        // A ring with a gap of the surface colour, so it reads against its neighbours.
        ctx.strokeStyle = ink.surface;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = i === 1 ? ink.strong : ink.text;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius + 3.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = 1;
      });

      canvas.style.cursor = hit ? 'pointer' : pointer && pointer.x <= plotW ? 'col-resize' : 'default';

      // Tell React about the tooltip only when what it shows changes.
      let next: Tip | null = null;
      if (hit) next = { kind: 'alert', x: hit.x, y: hit.y, alert: hit.slot.alert, sunk: !hit.slot.up };
      else if (pointer && pointer.x <= plotW) {
        const minute = Math.floor((start + (pointer.x / plotW) * WINDOW) / MINUTE);
        const count = planned.byMinute.get(minute);
        if (count) next = { kind: 'minute', x: xOf(minute * MINUTE) + minuteW, minute, count, flip: pointer.x > plotW - 190 };
      }
      const key = !next ? '' : next.kind === 'alert' ? next.alert.id : `m${next.minute}:${Math.round(next.x / 4)}`;
      if (key !== tipKey) {
        tipKey = key;
        setTip(next);
      }
    };
    frame = requestAnimationFrame(draw);

    // ---- the pointer: hover to read, click a dot to open it, drag the plot to rewind ----
    const at = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    };
    const scrubTo = (x: number) => {
      const plotW = Math.max(120, width - GUTTER);
      // Letting go at the right edge means "back to live".
      live.current.onScrub(x >= plotW - 6 ? null : clock() - WINDOW + (Math.max(0, x) / plotW) * WINDOW);
    };
    const onMove = (e: PointerEvent) => {
      pointer = at(e);
      if (dragging) scrubTo(pointer.x);
    };
    const onDown = (e: PointerEvent) => {
      pointer = at(e);
      const radius = 9;
      const hit = drawn.find((d) => (d.x - pointer!.x) ** 2 + (d.y - pointer!.y) ** 2 < radius ** 2);
      if (hit) return live.current.onSelect(hit.slot.alert.id);
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
      scrubTo(pointer.x);
    };
    const onUp = () => (dragging = false);
    const onLeave = () => (pointer = null);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [theme]);

  const sunkNow = counts.hidden + (preview ? counts.wouldHide : 0);
  const seenNow = counts.total - sunkNow;

  return (
    <figure className="al-water" data-tour="al-water">
      <div className="al-water-plot" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`The last hour of alerts. ${seenNow} were seen by people, ${counts.paged} of them opening a new incident. ${sunkNow} were hidden by rules. The alert list has every one.`}
        />

        {/* The labels sit on the chart, each side of the line, so there's no legend to look up. */}
        <div className="al-water-label" data-side="up">
          <span>
            <i data-kind="paged" /> Reached a person <b>{counts.paged - (preview ? counts.wouldHidePaged : 0)}</b>
          </span>
          <span>
            <i data-kind="folded" /> Folded into an incident{' '}
            <b>{counts.folded - (preview ? counts.wouldHide - counts.wouldHidePaged : 0)}</b>
          </span>
        </div>
        <div className="al-water-label" data-side="down">
          <span>
            <i data-kind="hidden" /> Hidden by rules <b>{counts.hidden}</b>
          </span>
          {preview && (
            <>
              <span>
                <i data-kind="ring" /> Would be hidden <b>{counts.wouldHide - counts.wouldHidePaged}</b>
              </span>
              <span>
                <i data-kind="ring-paged" /> Would hide a page <b>{counts.wouldHidePaged}</b>
              </span>
            </>
          )}
        </div>
        <div className="al-water-gutter" aria-hidden>
          Incoming
        </div>

        {tip?.kind === 'alert' && (
          <div className="al-tip" style={{ left: tip.x, top: tip.y }} data-below={tip.sunk || undefined}>
            <div className="al-tip-title">{tip.alert.title}</div>
            <div className="al-tip-meta">
              <span className="mn-mono">{time(tip.alert.at, true)}</span>
              {tip.sunk && tip.alert.outcome !== 'hidden' ? 'Would be hidden' : OUTCOME_LABEL[tip.alert.outcome]}
              {tip.alert.rule && (tip.sunk || tip.alert.wouldHide) && <span className="mn-mono">{tip.alert.rule.id}</span>}
            </div>
          </div>
        )}
        {tip?.kind === 'minute' && (
          <div className="al-tip" style={{ left: tip.x, top: PAD_TOP }} data-minute data-flip={tip.flip || undefined}>
            <div className="al-tip-title">{time(tip.minute * MINUTE)}</div>
            <div className="al-tip-row">
              <i data-kind="paged" />
              <b>{tip.count.paged}</b> reached a person
            </div>
            <div className="al-tip-row">
              <i data-kind="folded" />
              <b>{tip.count.folded}</b> folded
            </div>
            <div className="al-tip-row">
              <i data-kind="hidden" />
              <b>{tip.count.hidden}</b> hidden
            </div>
          </div>
        )}
      </div>
    </figure>
  );
}
