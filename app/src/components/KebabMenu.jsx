import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

// A three-dot button that opens a small menu. items: [{ label, icon, onClick, danger }]. `label` names it for screen readers.
export default function KebabMenu({ items, label = 'More actions', icon = 'more', className = '' }) {
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
    <div className={`menu-wrap kebab${className ? ` ${className}` : ''}`} ref={wrap}>
      <button type="button" className="btn ghost icon-only" aria-haspopup="menu" aria-expanded={open} aria-label={label} title={label} onClick={() => setOpen(!open)}>
        <Icon name={icon} />
      </button>
      {open && (
        <div className="menu" role="menu" style={{ minWidth: 190, maxHeight: 320, overflowY: 'auto' }}>
          {items.map((it) => (
            <button key={it.label} type="button" role="menuitem" className={it.danger ? 'danger' : ''} onClick={() => { setOpen(false); it.onClick(); }}>
              {it.icon && <Icon name={it.icon} />} {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
