import { useEffect, useRef } from 'react';

// One line of text that never wraps. When it is wider than its space, hovering or focusing the button (or other element) it
// sits in slides it along to the end and back; a trackpad, wheel or touch can scroll it by hand too.
export default function SlideText({ children }) {
  const el = useRef(null);
  useEffect(() => {
    const box = el.current;
    const host = box && (box.closest('button, a') || box.parentElement);
    if (!host) return undefined;
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
  return <span ref={el} className="slide-text">{children}</span>;
}
