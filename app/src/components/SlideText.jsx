import { useEffect, useRef } from 'react';

// Slides a one-line box along to its end and back while its host (a row, a button) is hovered or focused, so text cut off by
// a lack of room can be read. `boxRef` is the box that scrolls sideways; `hostRef` the element to watch (by default the
// nearest button or link around the box). A trackpad, wheel or touch can scroll the box by hand too.
export function useSlide(boxRef, hostRef = null) {
  useEffect(() => {
    const box = boxRef.current;
    const host = hostRef ? hostRef.current : box && (box.closest('button, a') || box.parentElement);
    if (!box || !host) return undefined;
    let frame = 0;
    const slide = (toEnd) => {
      cancelAnimationFrame(frame);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const from = box.scrollLeft;
      const to = toEnd ? box.scrollWidth - box.clientWidth : 0;
      if (from === to) return;
      const ms = Math.max(400, Math.abs(to - from) * 12);
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / ms);
        box.scrollLeft = from + (to - from) * (t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    const enter = () => slide(true);
    const leave = () => slide(false);
    host.addEventListener('mouseenter', enter);
    host.addEventListener('mouseleave', leave);
    host.addEventListener('focus', enter);
    host.addEventListener('blur', leave);
    return () => {
      cancelAnimationFrame(frame);
      host.removeEventListener('mouseenter', enter);
      host.removeEventListener('mouseleave', leave);
      host.removeEventListener('focus', enter);
      host.removeEventListener('blur', leave);
    };
  }, []);
}

// One line of text that never wraps and slides on hover when it is wider than its space.
export default function SlideText({ children }) {
  const el = useRef(null);
  useSlide(el);
  return <span ref={el} className="slide-text">{children}</span>;
}
