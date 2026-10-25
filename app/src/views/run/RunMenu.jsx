import { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon.jsx';

// The "Run options" dropdown. items: [{ label, icon, onClick, disabled, title, danger }] or 'sep'.
export default function RunMenu({ items }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <div className="menu-wrap" ref={wrap}>
      <button type="button" className="btn ghost icon-only" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
        title="More: reset code, settings, theme, shortcuts, and run options" aria-label="More options">
        <Icon name="more" />
      </button>
      {open && (
        <div className="menu" role="menu">
          {items.map((it, i) => (it === 'sep'
            ? <hr key={i} />
            : (
              <button key={i} type="button" role="menuitem" className={it.danger ? 'danger' : ''} disabled={it.disabled} title={it.title}
                onClick={() => { setOpen(false); it.onClick(); }}>
                <Icon name={it.icon} /> {it.label}
              </button>
            )))}
        </div>
      )}
    </div>
  );
}
