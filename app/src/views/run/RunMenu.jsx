import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import SlideText from '../../components/SlideText.jsx';

// The settings and run options menu (a cog). items: [{ label, icon, onClick, disabled, title, danger }] or 'sep'.
// `side` opens it beside the button (for the icon strip) instead of below it.
export default function RunMenu({ items, side = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <div className={`menu-wrap${className ? ` ${className}` : ''}`} ref={wrap}>
      <button type="button" className="btn ghost icon-only" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
        title="Settings and more: reset code, suggestions, theme, shortcuts, run options" aria-label="Settings and more">
        <Icon name="gear" />
      </button>
      {open && (
        <div className={`menu${side ? ' side' : ''}`} role="menu">
          {items.map((it, i) => (it === 'sep'
            ? <hr key={i} />
            : (
              <button key={i} type="button" role="menuitem" className={it.danger ? 'danger' : ''} disabled={it.disabled} title={it.title}
                onClick={() => { setOpen(false); it.onClick(); }}>
                <Icon name={it.icon} /><SlideText>{it.label}</SlideText>
              </button>
            )))}
        </div>
      )}
    </div>
  );
}
