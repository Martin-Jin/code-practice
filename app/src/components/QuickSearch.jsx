import { useEffect, useMemo, useRef, useState } from 'react';
import { fuzzyFilter } from '../lib/fuzzy.js';
import Icon from './Icon.jsx';

// Text with the matched letters emphasised.
function Highlight({ text, indices }) {
  if (!indices.length) return text;
  const hit = new Set(indices);
  const parts = [];
  let run = '';
  let on = false;
  for (let i = 0; i < text.length; i++) {
    const h = hit.has(i);
    if (h !== on && run) { parts.push([run, on]); run = ''; }
    on = h;
    run += text[i];
  }
  if (run) parts.push([run, on]);
  return parts.map(([s, marked], i) => (marked ? <mark key={i}>{s}</mark> : <span key={i}>{s}</span>));
}

// A search palette: type to filter, arrows to move, Enter to choose, Esc to close.
// items: [{ key, label, sub?, keywords?, badge?, status?, rank?, showWhenEmpty?, onSelect }]
export default function QuickSearch({ items, placeholder, onClose, emptyHint }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const dialog = useRef(null);
  const list = useRef(null);

  useEffect(() => {
    const d = dialog.current;
    d.showModal();
    return () => { if (d.open) d.close(); };
  }, []);

  const results = useMemo(() => fuzzyFilter(items, query, 60), [items, query]);
  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    const row = list.current && list.current.children[active];
    if (row) row.scrollIntoView({ block: 'nearest' });
  }, [active, results]);

  const choose = (r) => { onClose(); r.item.onSelect(); };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); choose(results[active]); }
  };

  return (
    <dialog
      ref={dialog} className="modal quick" aria-label="Search"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onMouseDown={(e) => { if (e.target === dialog.current) onClose(); }}
    >
      <div className="quick-input">
        <Icon name="search" />
        <input
          type="text" autoFocus value={query} placeholder={placeholder} spellCheck={false} autoComplete="off"
          aria-controls="quick-results" onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown}
        />
        <span className="kbd">Esc</span>
      </div>
      <ul id="quick-results" className="quick-list" role="listbox" ref={list}>
        {results.map((r, i) => (
          <li
            key={r.item.key} role="option" aria-selected={i === active} className={i === active ? 'active' : ''}
            onMouseMove={() => { if (active !== i) setActive(i); }} onClick={() => choose(r)}
          >
            {r.item.status && <span className={`st ${r.item.status}`} aria-hidden="true" />}
            <span className="q-text">
              <span className="q-label"><Highlight text={r.item.label} indices={r.labelIdx} /></span>
              {(r.item.sub || r.item.hint) && (
                <span className="q-sub">
                  <Highlight text={r.item.sub || ''} indices={r.subIdx} />
                  {r.item.hint && <span>{r.item.sub ? ' · ' : ''}{r.item.hint}</span>}
                </span>
              )}
            </span>
            {r.item.badge && <span className="chip">{r.item.badge}</span>}
          </li>
        ))}
        {results.length === 0 && <li className="quick-empty">{query.trim() ? 'Nothing matches.' : emptyHint || 'Start typing to search.'}</li>}
      </ul>
      <div className="quick-foot muted">↑ ↓ move · Enter open · Esc close</div>
    </dialog>
  );
}
