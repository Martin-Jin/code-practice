import { useEffect, useMemo, useRef } from 'react';
import { pickGreeting } from '../../shared/greetings.js';

const SYMBOLS = [
  '∫', '∑', 'π', '√', '∂', '∇', 'Δ', 'θ', 'λ', 'μ', 'ρ', 'ω', '∞', '≈', '≠', '±', '×', '÷', 'σ', 'τ', 'φ', 'ε', 'α', 'β', 'γ', '∮',
  'F = ma', 'dx/dt', 'e^iπ', 'sin θ', 'cos θ', 'ln x', 'lim', 'x²', '∫∫', 'ΔS ≥ 0', 'Re', 'Σ F = 0', 'f(x)', 'dy/dx', 'PV = nRT', 'O(n)',
];
const COUNT = 150;
const NEAR = 0.07; // a symbol is replaced once it is this close to the viewer
const SPEED = 0.3; // depth covered per second: a symbol takes about three seconds to fly past

// One symbol at a random spot in the tunnel. `z` is its distance from the viewer, 1 (far) down to NEAR.
const spawn = (z = 1) => ({
  text: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
  x: (Math.random() - 0.5) * 1.6,
  y: (Math.random() - 0.5) * 1.6,
  z,
  size: 16 + Math.random() * 14,
  tilt: (Math.random() - 0.5) * 0.7,
  italic: Math.random() < 0.6,
});

// A symbol is faint far away, strongest in the middle of its flight, and fades as it passes the viewer.
const alphaOf = (z) => Math.min(1, (1 - z) * 5) * Math.min(1, (z - NEAR) * 9) * 0.55;

function draw(ctx, w, h, symbols, colour) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = colour;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const focal = Math.max(w, h) * 0.5;
  for (const s of symbols) {
    const a = alphaOf(s.z);
    if (a <= 0.01) continue;
    const scale = 1 / s.z;
    ctx.globalAlpha = a;
    ctx.save();
    ctx.translate(w / 2 + s.x * focal * scale, h / 2 + s.y * focal * scale);
    ctx.rotate(s.tilt);
    ctx.font = `${s.italic ? 'italic ' : ''}${Math.round(s.size * scale)}px Georgia, 'Times New Roman', serif`;
    ctx.fillText(s.text, 0, 0);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// Maths symbols flying towards the viewer, as if zooming through a tunnel of them. Drawn on a canvas in the
// page's muted text colour; with reduced motion requested it shows one still frame instead of moving.
function MathZoom() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const symbols = Array.from({ length: COUNT }, () => spawn(NEAR + Math.random() * (1 - NEAR)));
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let colour = '#888';
    let frame = 0;
    let last = 0;

    const paint = () => { if (still) draw(ctx, w, h, symbols, colour); };
    const recolour = () => { colour = getComputedStyle(canvas).color; paint(); };
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      recolour();
    };
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      for (let i = 0; i < symbols.length; i++) {
        const s = symbols[i];
        s.z -= SPEED * dt;
        // gone past the viewer, or flown off the edge of the picture
        if (s.z < NEAR || (Math.abs(s.x / s.z) > 2.2 && Math.abs(s.y / s.z) > 2.2)) symbols[i] = spawn();
      }
      draw(ctx, w, h, symbols, colour);
      frame = requestAnimationFrame(tick);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    // the colour changes with the theme (the setting, or the system's light/dark), so read it again then
    const theme = new MutationObserver(recolour);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const scheme = window.matchMedia?.('(prefers-color-scheme: dark)');
    scheme?.addEventListener?.('change', recolour);
    if (!still) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      theme.disconnect();
      scheme?.removeEventListener?.('change', recolour);
    };
  }, []);
  return <canvas ref={ref} className="art" aria-hidden="true" />;
}

// The landing page's picture: maths symbols zooming towards you, faint enough to sit behind text. The greeting is
// picked once per visit.
export default function Hero({ action }) {
  const { hello, message } = useMemo(() => pickGreeting(), []);
  return (
    <header className="hero">
      <MathZoom />
      <div className="copy">
        <p className="eyebrow">{hello}</p>
        <h1>{message}</h1>
        {action && <a className="btn primary lg" href={action.href}>{action.label}</a>}
      </div>
    </header>
  );
}
