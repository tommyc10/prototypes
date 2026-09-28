import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { Toaster, type ToasterProps } from 'sonner';
import { Ledger } from './variants/Ledger';
import { Console } from './variants/Console';
import { Dossier } from './variants/Dossier';
import { Atlas } from './variants/Atlas';
import { Midnight } from './variants/Midnight';

const VARIANTS: { name: string; Component: ComponentType; toaster: ToasterProps }[] = [
  { name: 'Ledger', Component: Ledger, toaster: { position: 'bottom-right', theme: 'light' } },
  { name: 'Console', Component: Console, toaster: { position: 'bottom-right', theme: 'dark' } },
  { name: 'Dossier', Component: Dossier, toaster: { position: 'top-center', theme: 'light' } },
  { name: 'Atlas', Component: Atlas, toaster: { position: 'bottom-right', theme: 'light' } },
  { name: 'Midnight', Component: Midnight, toaster: { position: 'bottom-right', theme: 'dark' } },
];

const initial = () => {
  const v = parseInt(new URLSearchParams(location.search).get('v') ?? '', 10);
  return v >= 1 && v <= VARIANTS.length ? v - 1 : 0;
};

export function Harness() {
  const [current, setCurrent] = useState(initial);
  const [mountKey, setMountKey] = useState(0);
  const [ready, setReady] = useState(false);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const highlightRef = useRef<HTMLSpanElement>(null);

  const moveHighlight = useCallback(() => {
    const el = itemRefs.current[current];
    const hl = highlightRef.current;
    if (!el || !hl) return;
    hl.style.width = el.offsetWidth + 'px';
    hl.style.transform = `translateX(${el.offsetLeft}px)`;
  }, [current]);

  useLayoutEffect(moveHighlight, [moveHighlight]);

  useEffect(() => {
    window.addEventListener('resize', moveHighlight);
    return () => window.removeEventListener('resize', moveHighlight);
  }, [moveHighlight]);

  // Enable the slide only after first paint, so load doesn't animate.
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
  }, []);

  const setActive = useCallback((i: number) => {
    if (i < 0 || i >= VARIANTS.length) return;
    setCurrent(i);
    setMountKey((k) => k + 1);
    const url = new URL(location.href);
    url.searchParams.set('v', String(i + 1));
    history.replaceState(null, '', url);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Variants that own the keyboard (Console) mark handled events.
      if (e.defaultPrevented) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= VARIANTS.length) setActive(num - 1);
      else if (e.key === 'ArrowRight') setActive((current + 1) % VARIANTS.length);
      else if (e.key === 'ArrowLeft') setActive((current - 1 + VARIANTS.length) % VARIANTS.length);
      else if (e.key === 'r' || e.key === 'R') setMountKey((k) => k + 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [current, setActive]);

  const { Component, toaster } = VARIANTS[current];

  return (
    <>
      <Component key={`variant-${mountKey}`} />
      <Toaster key={`toaster-${current}`} {...toaster} />
      <nav className="proto-picker" aria-label="Prototype variants" data-ready={ready || undefined}>
        <span className="proto-picker-highlight" aria-hidden="true" ref={highlightRef} />
        {VARIANTS.map((v, i) => (
          <button
            key={v.name}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="proto-picker-item"
            data-active={i === current || undefined}
            aria-current={i === current ? 'true' : undefined}
            onClick={() => setActive(i)}
          >
            {v.name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button
          className="proto-picker-item proto-picker-replay"
          aria-label="Replay animation (R)"
          onClick={() => setMountKey((k) => k + 1)}
        >
          ↻
        </button>
      </nav>
    </>
  );
}
