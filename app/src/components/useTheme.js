import { useEffect, useState } from 'react';

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
export const MODES = ['auto', 'light', 'dark'];

function saved() {
  try {
    const t = localStorage.getItem('theme');
    return t === 'light' || t === 'dark' ? t : 'auto';
  } catch { return 'auto'; }
}

// Three modes: auto follows the system (and changes with it), light and dark are fixed.
// The toggle cycles auto, light, dark. `dark` is what is actually showing.
export default function useTheme() {
  const [mode, setMode] = useState(saved);
  const [system, setSystem] = useState(prefersDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSystem(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const dark = mode === 'auto' ? system : mode === 'dark';
  const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
  const toggle = () => {
    setMode(next);
    // No attribute lets the prefers-color-scheme rule in app.css decide.
    if (next === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
    try {
      if (next === 'auto') localStorage.removeItem('theme');
      else localStorage.setItem('theme', next);
    } catch { /* storage blocked */ }
  };
  return { mode, next, dark, toggle };
}
