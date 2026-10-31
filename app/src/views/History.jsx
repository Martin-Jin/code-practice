import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store.js';
import { timeAgo } from '../lib/format.js';
import { fuzzyFilter } from '../lib/fuzzy.js';
import { LIB_MODE_LABELS } from '../../shared/librarymodes.js';
import { MODE_LABELS } from '../../shared/modes.js';
import Shell from '../components/Shell.jsx';
import Icon from '../components/Icon.jsx';
import { libraryRunSet } from '../lib/practice.js';
import RunRow from '../components/RunRow.jsx';
import { LibRunRow } from '../components/LibraryPractice.jsx';

const ROW = 50;   // px per row, with its gap

// Every run of every set (coding runs and imported-set sessions), newest first. The rows are the dashboard's run rows, in their thin form.
function allRuns(st) {
  const codeName = (id) => (st.catalog.sets.find((s) => s.id === id) || {}).name;
  const out = [];
  for (const r of Object.values(st.runs)) {
    const title = codeName(r.setId);
    if (title) out.push({ key: `code:${r.id}`, kind: 'code', run: r, title, name: r.name, mode: MODE_LABELS[r.mode] || '', at: r.updatedAt });
  }
  for (const r of Object.values(st.libRuns)) {
    const set = libraryRunSet(r);
    if (set) out.push({ key: `lib:${r.id}`, kind: 'lib', run: r, title: set.title, name: r.name, mode: LIB_MODE_LABELS[r.mode] || '', at: r.updatedAt });   // else the set is gone (never imported here)
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

// A search box over the history: fuzzy over set, run name and mode, with the matching set and run names offered as you type
// (arrow keys and Enter or Tab take one). The list below narrows and ranks as you type.
function HistorySearch({ runs, query, onChange }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const names = useMemo(() => [...new Set(runs.flatMap((r) => [r.title, r.name]))].map((label) => ({ label })), [runs]);
  const hints = useMemo(() => (query.trim() ? fuzzyFilter(names, query, 6).map((m) => m.item.label).filter((l) => l !== query) : []), [names, query]);
  const take = (label) => { onChange(label); setOpen(false); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown' && hints.length) { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, hints.length - 1)); }
    else if (e.key === 'ArrowUp' && hints.length) { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if ((e.key === 'Enter' || e.key === 'Tab') && open && hints[active] !== undefined) { e.preventDefault(); take(hints[active]); }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); setOpen(false); } else if (query) { e.preventDefault(); onChange(''); } }
  };
  return (
    <div className="hist-search section-combo">
      <Icon name="search" />
      <input type="text" value={query} placeholder="Search your history by set, run name or mode" aria-label="Search your history" role="combobox" aria-expanded={open && hints.length > 0} aria-autocomplete="list"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0); }} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={onKey} />
      {query && <button type="button" className="btn ghost icon-only sm" onMouseDown={(e) => e.preventDefault()} onClick={() => onChange('')} aria-label="Clear the search"><Icon name="x" /></button>}
      {open && hints.length > 0 && (
        <ul className="section-options" role="listbox">
          {hints.map((h, i) => (
            <li key={h} role="option" aria-selected={i === active} className={i === active ? 'active' : ''} onMouseDown={(e) => { e.preventDefault(); take(h); }} onMouseEnter={() => setActive(i)}>{h}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function History({ theme }) {
  const st = useStore();
  const runs = allRuns(st);
  const [query, setQuery] = useState('');
  const [screens, setScreens] = useState(1);
  // As many rows as fit the window; Show more adds another window's worth.
  const [perScreen, setPerScreen] = useState(() => Math.max(6, Math.floor((window.innerHeight - 250) / ROW)));
  useEffect(() => {
    const size = () => setPerScreen(Math.max(6, Math.floor((window.innerHeight - 250) / ROW)));
    window.addEventListener('resize', size);
    return () => window.removeEventListener('resize', size);
  }, []);
  useEffect(() => setScreens(1), [query]);

  const matches = useMemo(() => {
    if (!query.trim()) return runs;
    const byKey = new Map(runs.map((r) => [r.key, r]));
    return fuzzyFilter(runs.map((r) => ({ label: r.title, sub: r.name, keywords: r.mode, key: r.key })), query, runs.length).map((m) => byKey.get(m.item.key));
  }, [runs, query]);
  const shown = matches.slice(0, perScreen * screens);
  const rest = matches.length - shown.length;

  return (
    <Shell theme={theme}>
      <section>
        <div className="section-title"><h2>History</h2><span className="muted">{query.trim() ? `${matches.length} of ${runs.length}` : runs.length} runs, newest first</span></div>
        {runs.length === 0 ? (
          <div className="empty">No runs yet. Start one from <a href="#/sets">Question sets</a>.</div>
        ) : (
          <>
            <HistorySearch runs={runs} query={query} onChange={setQuery} />
            {matches.length === 0 ? <div className="empty">No run matches that search.</div> : (
              <div className="hist-list">
                {shown.map((r) => (r.kind === 'lib' ? <LibRunRow key={r.key} run={r.run} compact /> : <RunRow key={r.key} run={r.run} compact />))}
              </div>
            )}
            {rest > 0 && <button type="button" className="btn hist-more" onClick={() => setScreens(screens + 1)}>Show {Math.min(rest, perScreen)} more</button>}
          </>
        )}
      </section>
    </Shell>
  );
}
