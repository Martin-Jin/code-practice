import { useId, useMemo, useState } from 'react';
import { fuzzyFilter } from '../lib/fuzzy.js';

// A drop-down that reads as underlined text in a sentence. Clicking it turns it into a search box (fuzzy) with the matching
// options listed below; arrow keys and Enter choose, Escape closes. options: [{ value, label, count? }] (count is shown dimmed).
export default function UnderlineSelect({ options, value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const current = options.find((o) => o.value === value) || options[0];
  const items = useMemo(() => options.map((o) => ({ label: o.label, option: o })), [options]);
  const shown = useMemo(() => fuzzyFilter(items, query, items.length).map((r) => r.item.option), [items, query]);
  const close = () => { setOpen(false); setQuery(''); };
  const choose = (o) => { onChange(o.value); close(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, shown.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) choose(shown[active]); }
    else if (e.key === 'Escape') close();
  };
  if (!open) {
    return <button type="button" className="section-select" aria-haspopup="listbox" aria-label={label ? `${label}: ${current.label}` : undefined} onClick={() => { setOpen(true); setActive(Math.max(0, options.indexOf(current))); }}>{current.label} <span aria-hidden="true">▾</span></button>;
  }
  return (
    <span className="section-combo">
      <input className="section-select" autoFocus value={query} placeholder={current.label} role="combobox" aria-expanded="true" aria-controls={listId} aria-label={label ? `Search: ${label}` : 'Search'}
        onChange={(e) => { setQuery(e.target.value); setActive(0); }} onKeyDown={onKey} onBlur={close} />
      <ul id={listId} className="section-options" role="listbox">
        {shown.length === 0 && <li className="muted empty-opt">Nothing matches</li>}
        {shown.map((o, i) => (
          <li key={o.value} role="option" aria-selected={i === active} className={i === active ? 'active' : ''}
            onMouseDown={(e) => { e.preventDefault(); choose(o); }} onMouseEnter={() => setActive(i)}>
            {o.label} {o.count !== undefined && <span className="muted">{o.count}</span>}
          </li>
        ))}
      </ul>
    </span>
  );
}
