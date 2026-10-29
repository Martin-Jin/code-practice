import { useEffect, useRef } from 'react';

// Ticking many things in a list without a click each. Returns `bind(key)`, the handlers to spread on each row (keys in
// display order are `order`; `picked` is a Set of keys and `setPicked` receives a new one):
//   - press on a row and drag over others: they all get the state the first one just got (tick or untick);
//   - shift-click: every row from the last one clicked to this one gets the last-clicked row's state;
//   - Enter or Space on a focused row toggles it (a keyboard click has detail 0).
// The click itself is always cancelled so a link row does not navigate and a checkbox does not toggle twice.
export default function useRangePick(order, picked, setPicked) {
  const live = useRef(picked);          // the newest set, ahead of props while a drag fires faster than renders
  const rows = useRef(order);
  const anchor = useRef(null);          // the key last pressed
  const paint = useRef(null);           // null, or the state a drag is painting
  live.current = picked;
  rows.current = order;

  useEffect(() => {
    const stop = () => { paint.current = null; };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => { window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop); };
  }, []);

  const apply = (keys, on) => {
    const next = new Set(live.current);
    for (const k of keys) { if (on) next.add(k); else next.delete(k); }
    live.current = next;
    setPicked(next);
  };

  return (key) => ({
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      e.preventDefault();   // no text selection while dragging across rows
      const from = rows.current.indexOf(anchor.current);
      if (e.shiftKey && from >= 0) {
        const to = rows.current.indexOf(key);
        apply(rows.current.slice(Math.min(from, to), Math.max(from, to) + 1), live.current.has(anchor.current));
      } else {
        const on = !live.current.has(key);
        apply([key], on);
        paint.current = on;
      }
      anchor.current = key;
    },
    onPointerEnter: () => { if (paint.current !== null) apply([key], paint.current); },
    onClick: (e) => {
      e.preventDefault();
      if (e.detail === 0) { apply([key], !live.current.has(key)); anchor.current = key; }
    },
  });
}
