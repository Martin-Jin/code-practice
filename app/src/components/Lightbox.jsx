import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const LEVELS = [1, 1.5, 2, 3, 4];

// A full-window viewer for a figure. `render(width)` draws the figure `width` CSS pixels wide, so a PDF crop can be
// drawn sharply at each zoom level. 1x fits the window's width; the page scrolls, or drag to move around when zoomed.
export function Lightbox({ title, render, onClose }) {
  const dialog = useRef(null);
  const stage = useRef(null);
  const drag = useRef(null);
  const [fit, setFit] = useState(0);
  const [level, setLevel] = useState(0);

  const zoom = (delta) => setLevel((l) => Math.max(0, Math.min(LEVELS.length - 1, l + delta)));

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
    else if (e.key === '0') { e.preventDefault(); setLevel(0); }
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
    else setLevel((l) => (l === 0 ? 2 : 0));
  };

  return (
    <dialog ref={dialog} className="lightbox" aria-label={title} onCancel={(e) => { e.preventDefault(); onClose(); }} onKeyDown={onKeyDown}>
      <div className="lb-bar">
        <span className="lb-title">{title}</span>
        <button type="button" className="btn ghost sm" onClick={() => zoom(-1)} disabled={level === 0} aria-label="Zoom out" title="Zoom out (-)">−</button>
        <button type="button" className="btn ghost sm lb-level" onClick={() => setLevel(0)} title="Fit to window (0)">{Math.round(LEVELS[level] * 100)}%</button>
        <button type="button" className="btn ghost sm" onClick={() => zoom(1)} disabled={level === LEVELS.length - 1} aria-label="Zoom in" title="Zoom in (+)">+</button>
        <button type="button" className="btn sm" onClick={onClose} autoFocus><Icon name="x" /> Close</button>
      </div>
      <div ref={stage} className="lb-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onClick={onClick}>
        <div className="lb-figure" style={{ cursor: level === 0 ? 'zoom-in' : 'zoom-out' }}>
          {fit > 0 && render(Math.round(fit * LEVELS[level]))}
        </div>
      </div>
      <div className="lb-hint">Click the figure to zoom, drag to move around, Esc to close</div>
    </dialog>
  );
}

// Wraps a figure so a click (or the Enlarge button, for the keyboard) opens it in a Lightbox.
export function Enlargeable({ title, render, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="enlarge">
      <div className="enlarge-body" onClick={() => setOpen(true)} title="Click to enlarge">{children}</div>
      <button type="button" className="btn sm enlarge-btn" onClick={() => setOpen(true)} aria-label={`Enlarge: ${title}`}><Icon name="expand" /> Enlarge</button>
      {open && <Lightbox title={title} render={render} onClose={() => setOpen(false)} />}
    </div>
  );
}
