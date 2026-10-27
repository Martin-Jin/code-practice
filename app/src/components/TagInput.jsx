import { useMemo, useRef, useState } from 'react';
import { fuzzyFilter } from '../lib/fuzzy.js';
import { effectiveQuestions } from '../lib/practice.js';

// Every tag used in the user's sets, those of `setId` first. For the suggestions in a TagInput.
export function knownTags(st, setId) {
  const of = (set) => effectiveQuestions(set).flatMap((q) => q.tags || []);   // with the tags the user has since edited
  const mine = st.library.sets[setId] ? of(st.library.sets[setId]) : [];
  const others = Object.values(st.library.sets).filter((s) => s.id !== setId).flatMap(of);
  return [...new Set([...mine, ...others])];
}

// A text box for comma-separated tags. The word being typed (after the last comma) is matched loosely against the tags
// used before, and the best ones are offered below: Up and Down move, Enter or Tab take one, Esc closes.
export default function TagInput({ value, onChange, tags, className = '', placeholder = '', style }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef(null);
  const cut = value.lastIndexOf(',') + 1;
  const typed = value.slice(cut).trim();
  const used = useMemo(() => new Set(value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)), [value]);
  const options = useMemo(
    () => (typed ? fuzzyFilter(tags.filter((t) => !used.has(t.toLowerCase())).map((t) => ({ label: t })), typed, 6).map((r) => r.item.label) : []),
    [tags, typed, used],
  );
  const shown = open && options.length > 0;

  const take = (tag) => {
    onChange(`${value.slice(0, cut)}${cut ? ' ' : ''}${tag}, `);
    setActive(0);
    box.current.focus();
  };
  const onKeyDown = (e) => {
    if (!shown) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); take(options[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setOpen(false); }
  };

  return (
    <span className="tag-input" style={{ position: 'relative', display: 'block' }}>
      <input ref={box} type="text" className={className} value={value} placeholder={placeholder} style={style} autoComplete="off" spellCheck={false}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0); }} onKeyDown={onKeyDown} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)} />
      {shown && (
        <ul className="tag-options" role="listbox">
          {options.map((t, i) => (
            <li key={t} role="option" aria-selected={i === active} className={i === active ? 'active' : ''} onMouseDown={(e) => { e.preventDefault(); take(t); }} onMouseMove={() => setActive(i)}>{t}</li>
          ))}
        </ul>
      )}
    </span>
  );
}
