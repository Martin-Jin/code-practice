import { useEffect, useMemo, useState } from 'react';
import { useStore, state } from '../lib/store.js';
import { createRun } from '../lib/service.js';
import Icon from './Icon.jsx';
import QuickSearch from './QuickSearch.jsx';
import { toast } from './Toasts.jsx';
import { eventCombo, actionFor } from '../lib/shortcuts.js';
import { searchText } from '../../shared/markup.js';

const count = (set) => set.categories.reduce((n, c) => n + c.questions.length, 0);
const typing = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

// The set a page belongs to, from its address: { coding: true|false, id } or null on the dashboard and the list of sets.
function scopeOf(hash, st) {
  const [view, id, extra] = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (view === 'set' && id) return { coding: true, id };
  if (view === 'lib' || view === 'q') return id ? { coding: false, id } : null;
  if (view === 'run' && st.runs[id]) return { coding: true, id: st.runs[id].setId };
  if (view === 'practice' && st.libRuns[id] && !st.libRuns[id].folderRun) return { coding: false, id: st.libRuns[id].setId };
  return null;
}

// The search box in the top bar. On the dashboard and the list of sets it finds question sets only; inside a set it
// finds that set's questions only. Choosing a coding question starts a one-question run.
export default function GlobalSearch() {
  const st = useStore();
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const scope = scopeOf(hash, st);
  const scopeKey = scope ? `${scope.coding ? 'c' : 'l'}:${scope.id}` : '';

  useEffect(() => {
    const onKey = (e) => {
      const action = actionFor(eventCombo(e), state.shortcuts);
      if (action && action.id === 'search' && !document.querySelector('dialog[open]')) { e.preventDefault(); setOpen(true); }
      else if (e.key === '/' && !typing(e.target) && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const items = useMemo(() => {
    const out = [];
    for (const set of st.catalog.sets) {
      if (scope && !(scope.coding && scope.id === set.id)) continue;
      if (!scope) out.push({
        key: `set:${set.id}`, label: set.name, rank: 10, badge: 'Set',
        sub: `Question set · ${count(set)} questions`,
        keywords: `${set.description} ${set.categories.map((c) => c.name).join(' ')}`,
        onSelect: () => { window.location.hash = `#/set/${set.id}`; },
      });
      const questions = st.catalog.questions[set.id];
      if (!scope) continue;
      for (const c of set.categories) {
        for (const n of c.questions) {
          const q = questions[n];
          out.push({
            key: `q:${set.id}:${n}`, label: `Q${n} ${q.title}`, badge: `${q.marks}m`,
            // The set name is only worth searching when there is more than one set to tell apart.
            sub: c.name,
            hint: 'starts a one-question run', keywords: q.topic,
            onSelect: () => {
              try {
                const run = createRun({ setId: set.id, mode: 'custom', options: { questions: [n] }, name: `Q${n} · ${q.title}` });
                window.location.hash = `#/run/${run.id}`;
              } catch (e) { toast(e.message, 'bad'); }
            },
          });
        }
      }
    }
    // Questions of imported sets (PDFs, quiz screenshots): found by title, section, source, tags and wording.
    for (const set of Object.values(st.library.sets)) {
      if (scope && (scope.coding || scope.id !== set.id)) continue;
      if (!scope) out.push({
        key: `lib:${set.id}`, label: set.title, rank: 10, badge: 'Set', sub: `Your library · ${set.manifest.questions.length} questions`,
        keywords: `${set.course} ${[...new Set(set.manifest.questions.map((q) => q.section))].join(' ')}`,
        onSelect: () => { window.location.hash = `#/lib/${encodeURIComponent(set.id)}`; },
      });
      if (!scope) continue;
      for (const q of set.manifest.questions) {
        out.push({
          key: `lq:${set.id}:${q.uid}`, label: q.title, badge: q.marks !== null ? `${q.marks}m` : undefined,
          sub: q.section,
          keywords: [q.source, q.tags.join(' '), searchText(q.stem.text), ...q.parts.map((p) => searchText(p.prompt))].join(' '),
          onSelect: () => { window.location.hash = `#/q/${encodeURIComponent(set.id)}/${encodeURIComponent(q.uid)}`; },
        });
      }
    }
    return out;
  }, [st.catalog, st.library, scopeKey]);

  const label = scope ? 'Search the questions in this set' : 'Search question sets';
  return (
    <>
      <button type="button" className="nav-search" onClick={() => setOpen(true)} title={label} aria-label={label}>
        <Icon name="search" /><span className="nav-search-text">{scope ? 'Search this set' : 'Search sets'}</span>
      </button>
      {open && (
        <QuickSearch
          items={items} onClose={() => setOpen(false)}
          placeholder={`${label}…`}
          emptyHint={scope ? `Type to search the ${items.length} questions in this set.` : `Type to search ${items.length} question set(s).`}
        />
      )}
    </>
  );
}
