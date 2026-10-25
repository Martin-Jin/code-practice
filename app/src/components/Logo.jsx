// The app's mark: two rings of eight hand-drawn petals, each with a fan of lines. It is drawn in the current text
// colour (the theme's accent in the header), so it follows light and dark.
const petal = (base, length, spread) => {
  const y = (t) => (50 - base - length * t).toFixed(2);
  const x = (s) => (50 + spread * s).toFixed(2);
  const outline = `M${x(-0.34)} ${y(0)}L${x(-1)} ${y(0.7)}Q${x(-0.9)} ${y(1)} ${x(0)} ${y(1)}Q${x(0.9)} ${y(1)} ${x(1)} ${y(0.7)}L${x(0.34)} ${y(0)}Z`;
  let hatch = '';
  for (const s of [-0.62, -0.31, 0, 0.31, 0.62]) hatch += `M${x(s * 0.25)} ${y(0.1)}L${x(s)} ${y(0.86)}`;
  return { outline, hatch };
};
const RINGS = [
  { ...petal(12.5, 17, 5.6), offset: 0 },
  { ...petal(30, 18, 6.6), offset: 22.5 },
];

export default function Logo({ size = 32 }) {
  return (
    <svg className="logo-mark" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round">
      {RINGS.map((ring) => [...Array(8)].map((_, i) => (
        <g key={`${ring.offset}-${i}`} transform={`rotate(${ring.offset + i * 45} 50 50)`}>
          <path d={ring.outline} strokeWidth="2.4" />
          <path d={ring.hatch} strokeWidth="1.5" opacity=".8" />
        </g>
      )))}
    </svg>
  );
}
