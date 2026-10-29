// The app's mark: a flower of six petals around a centre, a ring of twelve rounded bars and an outer ring of eighteen dots. It is
// drawn in the current text colour (the theme's accent in the header), so it follows light and dark. public/favicon.svg is the
// same drawing in the brand red.
const turns = (count, offset = 0) => Array.from({ length: count }, (_, i) => offset + (i * 360) / count);

export default function Logo({ size = 32 }) {
  return (
    <svg className="logo-mark" viewBox="-100 -100 200 200" width={size} height={size} aria-hidden="true" focusable="false" fill="currentColor">
      <circle r="9" />
      {turns(6).map((a) => <ellipse key={`p${a}`} cy="-27" rx="7" ry="11" transform={`rotate(${a})`} />)}
      {turns(12, 15).map((a) => <rect key={`b${a}`} x="-4.5" y="-62" width="9" height="20" rx="4.5" transform={`rotate(${a})`} />)}
      {turns(18).map((a) => <circle key={`d${a}`} cy="-86" r="5" transform={`rotate(${a})`} />)}
    </svg>
  );
}
