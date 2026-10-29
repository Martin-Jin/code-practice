import { useMemo, useState } from 'react';
import { useStore } from '../lib/store.js';
import { fuzzyFilter } from '../lib/fuzzy.js';
import { folderOf } from '../lib/folders.js';
import { plural } from '../lib/format.js';

// Every set in the library (imported ones and the user's own), for choosing some of them.
export function useLibrarySets() {
  const st = useStore();
  return useMemo(() => Object.values(st.library.sets).sort((a, b) => a.title.localeCompare(b.title)).map((set) => ({
    key: set.id, label: set.title, sub: [set.course, (folderOf(set.id) || {}).name].filter(Boolean).join(' · '),
  })), [st.library.sets, st.libFolders]);
}

// A search box (fuzzy, over title, course and folder) above a list of ticks. `picked` is a Set of set ids; "Select shown"
// ticks the sets the search currently lists, so a search can pick a group at once.
export default function SetPicker({ items, picked, onChange }) {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => fuzzyFilter(items, query, items.length).map((r) => r.item), [items, query]);
  const flip = (key) => { const next = new Set(picked); if (next.has(key)) next.delete(key); else next.add(key); onChange(next); };
  return (
    <div className="set-picker">
      <div className="bar">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your sets" aria-label="Search your sets" autoFocus />
        <button type="button" className="btn sm" disabled={!shown.length} onClick={() => onChange(new Set([...picked, ...shown.map((i) => i.key)]))}>Select shown</button>
        <button type="button" className="btn ghost sm" disabled={!picked.size} onClick={() => onChange(new Set())}>Clear</button>
      </div>
      <div className="list" role="group" aria-label="Sets">
        {shown.map((item) => (
          <label key={item.key}>
            <input type="checkbox" checked={picked.has(item.key)} onChange={() => flip(item.key)} />
            <span><b>{item.label}</b>{item.sub && <span className="muted"> · {item.sub}</span>}</span>
          </label>
        ))}
        {!shown.length && <div className="none muted">{items.length ? 'No set matches that search.' : 'There are no sets yet.'}</div>}
      </div>
      <span className="muted">{plural(picked.size, 'set')} chosen of {items.length}</span>
    </div>
  );
}
