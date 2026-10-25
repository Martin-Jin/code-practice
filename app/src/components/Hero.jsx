import { useMemo } from 'react';
import { pickGreeting } from '../../shared/greetings.js';

// A damped oscillation, drawn once: the shape of a vibrations question.
const wave = (base, amp, decay, period, phase = 0) => {
  let d = '';
  for (let x = 0; x <= 1200; x += 6) d += `${x ? 'L' : 'M'}${x} ${(base + amp * Math.exp(-x / decay) * Math.sin(x / period + phase)).toFixed(1)}`;
  return d;
};
const WAVE_A = wave(300, 70, 750, 38);
const WAVE_B = wave(335, 28, 4000, 90, 1);

const EQUATIONS = [
  [90, 96, 'F = ma', 30], [330, 96, 'ΔS ≥ 0', 24], [560, 110, 'Re = ρvD/μ', 26], [800, 70, 'q = −kA dT/dx', 22],
  [1010, 150, '∮ E·dA = Q/ε₀', 22], [700, 250, 'I = ∫ r² dm', 26], [940, 392, 'O(n log n)', 24], [470, 215, 'p + ½ρv² = const', 22],
];

// The landing page's picture: a blueprint grid with the shapes of the courses on it (a vibration trace, a
// projectile path, vectors, a polar plot, a few equations), faint enough to sit behind text. It takes its colours
// from the theme. The greeting is picked once per visit.
export default function Hero({ action }) {
  const { hello, message } = useMemo(() => pickGreeting(), []);
  return (
    <header className="hero">
      <svg className="art" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="1" opacity=".12" /></pattern>
          <radialGradient id="hero-glow-a" cx="85%" cy="15%" r="45%"><stop offset="0" stopColor="currentColor" stopOpacity=".28" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></radialGradient>
          <radialGradient id="hero-glow-b" cx="10%" cy="90%" r="40%"><stop offset="0" stopColor="currentColor" stopOpacity=".18" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></radialGradient>
          <marker id="hero-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor" /></marker>
        </defs>
        <rect width="1200" height="420" fill="url(#hero-grid)" />
        <rect width="1200" height="420" fill="url(#hero-glow-a)" />
        <rect width="1200" height="420" fill="url(#hero-glow-b)" />
        <path d={WAVE_A} fill="none" stroke="currentColor" strokeWidth="2.5" opacity=".5" />
        <path d={WAVE_B} fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".28" />
        <path d="M70 380Q250 -10 430 380" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 7" opacity=".4" />
        <g stroke="currentColor" strokeWidth="2.5" opacity=".5" markerEnd="url(#hero-arrow)">
          <line x1="860" y1="190" x2="1010" y2="110" markerEnd="url(#hero-arrow)" />
          <line x1="860" y1="190" x2="990" y2="215" markerEnd="url(#hero-arrow)" />
          <line x1="860" y1="190" x2="880" y2="70" markerEnd="url(#hero-arrow)" />
        </g>
        <g fill="none" stroke="currentColor" opacity=".32" strokeWidth="1.8">
          <circle cx="1040" cy="310" r="64" />
          <circle cx="1040" cy="310" r="32" strokeDasharray="4 6" />
          <line x1="1040" y1="310" x2="1086" y2="266" />
          <path d="M1040 310h40" strokeDasharray="2 5" />
        </g>
        <g fill="currentColor" opacity=".3" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic">
          {EQUATIONS.map(([x, y, text, size]) => <text key={text} x={x} y={y} fontSize={size}>{text}</text>)}
        </g>
      </svg>
      <div className="copy">
        <p className="eyebrow">{hello}</p>
        <h1>{message}</h1>
        {action && <a className="btn primary lg" href={action.href}>{action.label}</a>}
      </div>
    </header>
  );
}
