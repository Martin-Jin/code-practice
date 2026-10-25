import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../lib/store.js';
import { createRun } from '../lib/service.js';
import Icon from './Icon.jsx';
import QuickSearch from './QuickSearch.jsx';
import { toast } from './Toasts.jsx';

const count = (set) => set.categories.reduce((n, c) => n + c.questions.length, 0);
const typing = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

// The search box in the top bar of the dashboard, set and stats pages. Finds question sets
// and the questions inside them. Choosing a question starts a one-question run.
export default function GlobalSearch() {
  const st = useStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'p') { e.preventDefault(); setOpen(true); }
      else if (e.key === '/' && !typing(e.target) && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const items = useMemo(() => {
    const out = [];
    for (const set of st.catalog.sets) {
      out.push({
        key: `set:${set.id}`, label: set.name, rank: 10, badge: 'Set',
        sub: `Question set · ${count(set)} questions`,
        keywords: `${set.description} ${set.categories.map((c) => c.name).join(' ')}`,
        onSelect: () => { window.location.hash = `#/set/${set.id}`; },
      });
      const questions = st.catalog.questions[set.id];
      for (const c of set.categories) {
        for (const n of c.questions) {
          const q = questions[n];
          out.push({
            key: `q:${set.id}:${n}`, label: `Q${n} ${q.title}`, badge: `${q.marks}m`, showWhenEmpty: false,
            // The set name is only worth searching when there is more than one set to tell apart.
            sub: st.catalog.sets.length > 1 ? `${set.name} · ${c.name}` : c.name,
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
    return out;
  }, [st.catalog]);

  return (
    <>
      <button type="button" className="nav-search" onClick={() => setOpen(true)} title="Search question sets and questions (Ctrl+P or /)" aria-label="Search question sets and questions">
        <Icon name="search" /><span className="nav-search-text">Search sets and questions</span><span className="kbd">Ctrl+P</span>
      </button>
      {open && (
        <QuickSearch
          items={items} onClose={() => setOpen(false)}
          placeholder="Search question sets and questions…"
          emptyHint={`Type to search ${items.filter((i) => i.showWhenEmpty === false).length} questions in ${st.catalog.sets.length} set(s).`}
        />
      )}
    </>
  );
}
