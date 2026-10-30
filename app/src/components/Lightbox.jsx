import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const LEVELS = [0.5, 0.75, 1, 1.5, 2, 3, 4];
const FIT = 2;   // index of 1x, where the viewer opens

// A full-window viewer for a figure. `render(width)` draws the figure `width` CSS pixels wide, so a PDF crop can be
// drawn sharply at each zoom level. 1x fits the window's width, and it can zoom out to half of that; the page scrolls, or drag to move around when zoomed.
export function Lightbox({ title, render, onClose, pages, initialPage = 0 }) {
  const dialog = useRef(null);
  const stage = useRef(null);
  const drag = useRef(null);
  const [fit, setFit] = useState(0);
  const [level, setLevel] = useState(FIT);
  const [page, setPage] = useState(initialPage);
  const currentPage = pages && pages[page];
  const shownTitle = currentPage ? currentPage.title : title;
  const shownRender = currentPage ? currentPage.render : render;

  const zoom = (delta) => setLevel((l) => Math.max(0, Math.min(LEVELS.length - 1, l + delta)));
  const changePage = (delta) => {
    setPage((i) => Math.max(0, Math.min(pages.length - 1, i + delta)));
    stage.current.scrollTo(0, 0);
  };

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
    const measure = () => setFit(Math.max(200, stage.current.clientWidth - 32));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage.current);
    // Ctrl + wheel (or a pinch on a trackpad) zooms the figure instead of the browser page. Needs a non-passive listener.
    const onWheel = (e) => { if (e.ctrlKey) { e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); } };
    stage.current.addEventListener('wheel', onWheel, { passive: false });
    const el = stage.current;
    return () => { observer.disconnect(); el.removeEventListener('wheel', onWheel); if (d && d.open) d.close(); };
  }, []);

  const onKeyDown = (e) => {
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(1); }
    else if (e.key === '-') { e.preventDefault(); zoom(-1); }
    else if (e.key === '0') { e.preventDefault(); setLevel(FIT); }
    else if (pages && pages.length > 1 && e.key === 'ArrowLeft' && page > 0) { e.preventDefault(); changePage(-1); }
    else if (pages && pages.length > 1 && e.key === 'ArrowRight' && page < pages.length - 1) { e.preventDefault(); changePage(1); }
  };
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, left: stage.current.scrollLeft, top: stage.current.scrollTop, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || !(e.buttons & 1)) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    if (d.moved) { stage.current.scrollLeft = d.left - dx; stage.current.scrollTop = d.top - dy; }
  };
  // A click on the figure toggles between fit and 2x; a click on the empty space around it closes the viewer.
  const onClick = (e) => {
    const moved = drag.current && drag.current.moved;
    drag.current = null;
    if (moved) return;
    if (e.target === stage.current) onClose();
    else setLevel((l) => (l === FIT ? FIT + 2 : FIT));
  };

  return (
    <dialog ref={dialog} className="lightbox" aria-label={shownTitle} onCancel={(e) => { e.preventDefault(); onClose(); }} onKeyDown={onKeyDown}>
      <div className="lb-bar">
        <span className="lb-title">{shownTitle}</span>
        {pages && pages.length > 1 && (
          <>
            <button type="button" className="btn ghost sm" onClick={() => changePage(-1)} disabled={page === 0} aria-label="Previous page" title="Previous page (←)">‹</button>
            <span className="lb-page" aria-live="polite">{page + 1} / {pages.length}</span>
            <button type="button" className="btn ghost sm" onClick={() => changePage(1)} disabled={page === pages.length - 1} aria-label="Next page" title="Next page (→)">›</button>
          </>
        )}
        <button type="button" className="btn ghost sm" onClick={() => zoom(-1)} disabled={level === 0} aria-label="Zoom out" title="Zoom out (-)">−</button>
        <button type="button" className="btn ghost sm lb-level" onClick={() => setLevel(FIT)} title="Fit to window (0)">{Math.round(LEVELS[level] * 100)}%</button>
        <button type="button" className="btn ghost sm" onClick={() => zoom(1)} disabled={level === LEVELS.length - 1} aria-label="Zoom in" title="Zoom in (+)">+</button>
        <button type="button" className="btn sm" onClick={onClose} autoFocus><Icon name="x" /> Close</button>
      </div>
      <div ref={stage} className="lb-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onClick={onClick}>
        <div className="lb-figure" style={{ cursor: level === FIT ? 'zoom-in' : 'zoom-out' }}>
          {fit > 0 && shownRender(Math.round(fit * LEVELS[level]))}
        </div>
      </div>
      <div className="lb-hint">Click the figure to zoom, drag to move around{pages && pages.length > 1 ? ', ← → to change page,' : ''}, Esc to close</div>
    </dialog>
  );
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 8;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// Where the figure's corner may sit: it can slide until its far edge meets the frame's (zoomed in), or stay inside the frame (zoomed out).
const bound = (v, size, k) => clamp(v, Math.min(0, size * (1 - k)), Math.max(0, size * (1 - k)));

// Lets a figure be zoomed in place: Ctrl + scroll zooms around the pointer, and with the left button held, dragging
// moves the figure around inside its frame. Double-click puts it back. Plain scrolling is left to the page.
export function ZoomPan({ children, resetTarget = null }) {
  const box = useRef(null);
  const drag = useRef(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });   // scale, and where the figure's top-left corner sits in the frame

  useEffect(() => {
    const el = box.current;
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      setView((v) => {
        const k = clamp(v.k * Math.exp(-e.deltaY * 0.002), MIN_ZOOM, MAX_ZOOM);
        const grow = k / v.k;
        return { k, x: bound(px - (px - v.x) * grow, r.width, k), y: bound(py - (py - v.y) * grow, r.height, k) };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });   // a passive listener cannot stop the browser zooming the page
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const onPointerDown = (e) => {
    if (e.target.closest?.('.zoompan-reset')) return;
    if (e.button !== 0 || view.k === 1) return;
    e.preventDefault();
    box.current.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX - view.x, y: e.clientY - view.y };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const r = box.current.getBoundingClientRect();
    setView((v) => ({ k: v.k, x: bound(e.clientX - d.x, r.width, v.k), y: bound(e.clientY - d.y, r.height, v.k) }));
  };
  const reset = () => setView({ k: 1, x: 0, y: 0 });
  const resetButton = view.k !== 1 && <button type="button" className="btn sm zoompan-reset" onClick={reset} onDoubleClick={(e) => e.stopPropagation()}>{Math.round(view.k * 100)}% · Reset</button>;

  return (
    <div
      ref={box} className={`zoompan${view.k !== 1 ? ' zoomed' : ''}`} title="Ctrl + scroll to zoom, drag to move, double-click to reset"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onDoubleClick={reset}
    >
      <div className="zoompan-inner" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}>{children}</div>
      {resetTarget ? resetButton && createPortal(resetButton, resetTarget) : resetButton}
    </div>
  );
}

// Wraps a figure so it can be zoomed and moved in place, with a magnifying-glass button in its corner (shown on
// hover, or when focused with the keyboard) that opens it in a Lightbox. Clicking the figure itself does nothing.
export function Enlargeable({ title, render, children, pages, initialPage = 0 }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="enlarge">
      <ZoomPan>{children}</ZoomPan>
      <button type="button" className="btn sm icon-only enlarge-btn" onClick={() => setOpen(true)} aria-label={`Enlarge: ${title}`} title="Open larger">
        <Icon name="zoom" />
      </button>
      {open && <Lightbox title={title} render={render} pages={pages} initialPage={initialPage} onClose={() => setOpen(false)} />}
    </div>
  );
}
