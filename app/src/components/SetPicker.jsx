import { useMemo, useState } from 'react';
import { useStore } from '../lib/store.js';
import { fuzzyFilter } from '../lib/fuzzy.js';
import { folderOf } from '../lib/folders.js';
import { plural } from '../lib/format.js';
import useRangePick from '../lib/rangepick.js';
import Icon from './Icon.jsx';

// Every set in the library (imported ones and the user's own), for choosing some of them.
export function useLibrarySets() {
  const st = useStore();
  return useMemo(() => Object.values(st.library.sets).sort((a, b) => a.title.localeCompare(b.title)).map((set) => ({
    key: set.id, label: set.title, sub: [set.course, (folderOf(set.id) || {}).name].filter(Boolean).join(' · '),
  })), [st.library.sets, st.libFolders]);
}

// A search box (fuzzy, over title, course and folder) above a list of ticks. Nothing is listed until something is typed.
// `picked` is a Set of set ids. Drag over rows to tick several, shift-click for a range, and "Select shown" ticks every set the
// search lists, so a search can pick a group at once. Chosen sets stay visible below the list, with a button to drop each.
export default function SetPicker({ items, picked, onChange }) {
  const [query, setQuery] = useState('');
  const typed = query.trim() !== '';
  const shown = useMemo(() => (typed ? fuzzyFilter(items, query, items.length).map((r) => r.item) : []), [items, query, typed]);
  const bind = useRangePick(useMemo(() => shown.map((i) => i.key), [shown]), picked, onChange);
  const drop = (key) => { const next = new Set(picked); next.delete(key); onChange(next); };
  const chosen = items.filter((i) => picked.has(i.key));
  return (
    <div className="set-picker">
      <div className="pick-bar">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to search your sets" aria-label="Search your sets" autoFocus />
        <button type="button" className="btn sm" disabled={!shown.length} onClick={() => onChange(new Set([...picked, ...shown.map((i) => i.key)]))}>Select shown</button>
        <button type="button" className="btn ghost sm" disabled={!picked.size} onClick={() => onChange(new Set())}>Clear</button>
      </div>
      {typed && (
        <div className="list" role="group" aria-label="Matching sets">
          {shown.map((item) => (
            <label key={item.key} {...bind(item.key)}>
              <input type="checkbox" checked={picked.has(item.key)} onChange={() => {}} />
              <span><b>{item.label}</b>{item.sub && <span className="muted"> · {item.sub}</span>}</span>
            </label>
          ))}
          {!shown.length && <div className="none muted">No set matches that search.</div>}
        </div>
      )}
      {!typed && <div className="muted">Type a few letters of a set's name to list matching sets. You have {plural(items.length, 'set')}.</div>}
      {typed && shown.length > 1 && <span className="muted">Drag over the sets, or shift-click, to choose several at once.</span>}
      {chosen.length > 0 && (
        <div className="chosen" aria-label="Chosen sets">
          {chosen.map((i) => <span key={i.key} className="chip">{i.label}<button type="button" className="chip-x" onClick={() => drop(i.key)} aria-label={`Remove ${i.label}`}><Icon name="x" /></button></span>)}
        </div>
      )}
      <span className="muted">{plural(picked.size, 'set')} chosen of {items.length}</span>
    </div>
  );
}
