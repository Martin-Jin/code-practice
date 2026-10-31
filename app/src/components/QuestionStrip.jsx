import { useEffect, useMemo, useRef, useState } from 'react';
import { fuzzyFilter } from '../lib/fuzzy.js';
import Icon from './Icon.jsx';

// The numbered strip of a practice session: one row that scrolls to keep the current question in view, and an "All" button that
// opens a searchable list of every question underneath. items: [{ uid, title, status ('right' | 'wrong' | null), difficult }];
// href(i) is the address of the i-th question.
export default function QuestionStrip({ items, current, href }) {
  const row = useRef(null);
  const wrap = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const dotClass = (it) => `qdot${it.uid === current ? ' cur' : ''}${it.status ? ` ${it.status}` : ''}${it.difficult ? ' diff' : ''}`;

  // Slide the row so the current question sits in the middle of it.
  useEffect(() => {
    const box = row.current;
    const dot = box && box.querySelector('[aria-current="step"]');
    if (!dot) return;
    const to = dot.offsetLeft - (box.clientWidth - dot.offsetWidth) / 2;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ left: Math.max(0, to), behavior: smooth ? 'smooth' : 'auto' });
  }, [current, items.length]);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const entries = useMemo(() => items.map((it, i) => ({ label: `${i + 1} ${it.title}`, i })), [items]);
  const shown = useMemo(() => fuzzyFilter(entries, query, entries.length).map((r) => r.item.i), [entries, query]);
  const go = (i) => { window.location.hash = href(i); setOpen(false); setQuery(''); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, shown.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[active] !== undefined) go(shown[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };
  // The active row follows the arrow keys.
  useEffect(() => {
    const el = open && wrap.current && wrap.current.querySelector('.qlist [aria-selected="true"]');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [active, open, query]);

  return (
    <div className="qstrip-wrap" ref={wrap}>
      <nav className="qstrip" aria-label="Questions in this session">
        <div className="qstrip-row" ref={row} onWheel={(e) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) row.current.scrollLeft += e.deltaY; }}>
          {items.map((it, i) => (
            <a key={it.uid} href={href(i)} title={it.title} aria-current={it.uid === current ? 'step' : undefined} className={dotClass(it)}>{i + 1}</a>
          ))}
        </div>
        <button type="button" className="btn sm qstrip-all" aria-expanded={open} aria-haspopup="listbox" title="List every question, with search"
          onClick={() => { setOpen(!open); setQuery(''); setActive(Math.max(0, items.findIndex((it) => it.uid === current))); }}>
          All {items.length} <Icon name="chevron" />
        </button>
      </nav>
      {open && (
        <div className="qlist-panel card">
          <input type="text" autoFocus value={query} placeholder="Search the questions by number or title" aria-label="Search the questions" role="combobox" aria-expanded="true"
            onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKey} />
          <ul className="qlist" role="listbox">
            {shown.length === 0 && <li className="muted empty-opt">No question matches</li>}
            {shown.map((i, n) => (
              <li key={items[i].uid} role="option" aria-selected={n === active} className={n === active ? 'active' : ''}
                onMouseDown={(e) => { e.preventDefault(); go(i); }} onMouseEnter={() => setActive(n)}>
                <span className={dotClass(items[i])}>{i + 1}</span>
                <span className="qlist-title">{items[i].title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
