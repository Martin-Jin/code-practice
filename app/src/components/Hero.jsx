import { useEffect, useMemo, useRef } from 'react';
import { pickGreeting } from '../../shared/greetings.js';

const SYMBOLS = [
  '∫', '∑', 'π', '√', '∂', '∇', 'Δ', 'θ', 'λ', 'μ', 'ρ', 'ω', '∞', '≈', '≠', '±', '×', '÷', 'σ', 'τ', 'φ', 'ε', 'α', 'β', 'γ', '∮',
  'F = ma', 'dx/dt', 'e^iπ', 'sin θ', 'cos θ', 'ln x', 'lim', 'x²', '∫∫', 'ΔS ≥ 0', 'Re', 'Σ F = 0', 'f(x)', 'dy/dx', 'PV = nRT', 'O(n)',
];
const COUNT = 150;
const NEAR = 0.07; // a symbol is replaced once it is this close to the viewer
const SPEED = 0.3; // depth covered per second: a symbol takes about three seconds to fly past
const BASE = 96;           // sprites are drawn at this font size and scaled down
const sprites = new Map(); // "text|italic|colour" -> { c, w, h }

function sprite(text, italic, colour) {
  const key = `${text}|${italic}|${colour}`;
  let s = sprites.get(key);
  if (s) return s;
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const font = `${italic ? 'italic ' : ''}${BASE}px Georgia, 'Times New Roman', serif`;
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + 8;
  const h = Math.ceil(BASE * 1.3);
  c.width = w;
  c.height = h;
  g.font = font;
  g.fillStyle = colour;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2);
  s = { c, w, h };
  sprites.set(key, s);
  return s;
}

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
  const focal = Math.max(w, h) * 0.5;
  // a narrow picture gets fewer, smaller symbols so it isn't crowded behind the text
  const k = Math.min(1, w / 900);
  const shown = Math.max(30, Math.round(symbols.length * k));
  for (let i = 0; i < shown; i++) {
    const s = symbols[i];
    const a = alphaOf(s.z);
    if (a <= 0.01) continue;
    const scale = 1 / s.z;
    const px = s.size * scale * (0.6 + 0.4 * k);
    const sp = sprite(s.text, s.italic, colour);
    const f = px / BASE;
    ctx.globalAlpha = a;
    ctx.save();
    ctx.translate(w / 2 + s.x * focal * scale, h / 2 + s.y * focal * scale);
    ctx.rotate(s.tilt);
    ctx.drawImage(sp.c, (-sp.w * f) / 2, (-sp.h * f) / 2, sp.w * f, sp.h * f);
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
    const recolour = () => { colour = getComputedStyle(canvas).color; sprites.clear(); paint(); };
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      colour = getComputedStyle(canvas).color;
      paint();
    };
    const tick = (now) => {
      frame = requestAnimationFrame(tick);
      if (now - last < 12) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      for (let i = 0; i < symbols.length; i++) {
        const s = symbols[i];
        s.z -= SPEED * dt;
        // gone past the viewer, or flown off the edge of the picture
        if (s.z < NEAR || (Math.abs(s.x / s.z) > 2.2 && Math.abs(s.y / s.z) > 2.2)) symbols[i] = spawn();
      }
      draw(ctx, w, h, symbols, colour);
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
