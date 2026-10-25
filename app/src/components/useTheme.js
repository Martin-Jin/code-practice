import { useEffect, useState } from 'react';

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

function saved() {
  try {
    const t = localStorage.getItem('theme');
    return t === 'light' || t === 'dark' ? t : null;
  } catch { return null; }
}

// Light/dark follows the system until the user picks one with the toggle.
export default function useTheme() {
  const [theme, setTheme] = useState(saved);
  const [system, setSystem] = useState(prefersDark);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => setSystem(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const dark = theme ? theme === 'dark' : system;
  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch { /* storage blocked */ }
  };
  return { dark, toggle };
}
