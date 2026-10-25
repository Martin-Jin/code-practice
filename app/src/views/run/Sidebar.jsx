import { useState } from 'react';
import { getQuestion } from '../../lib/catalog.js';
import Icon from '../../components/Icon.jsx';

const STATUS_ICON = { passed: 'check', failed: 'x', compile_error: 'warning', editing: 'pencil', untouched: null };
const STATUS_LABEL = {
  passed: 'Passed', failed: 'Tests failing', compile_error: 'Does not compile', editing: 'Edited, not run yet', untouched: 'Not started',
};

export function questionStatus(run, n) {
  const st = run.state[n];
  if (st.status !== 'untouched') return st.status;
  return st.code !== getQuestion(run.setId, n).starter ? 'editing' : 'untouched';
}

// Questions of the run, grouped under collapsible category headings.
export default function Sidebar({ run, set, current, onSelect }) {
  const key = `collapsed:${run.id}`;
  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
  });
  const toggle = (id) => {
    const next = { ...collapsed, [id]: !collapsed[id] };
    setCollapsed(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage blocked */ }
  };

  const inRun = new Set(run.questions);
  const sections = Object.entries(set.groups).map(([group, label]) => ({
    group, label, cats: set.categories.filter((c) => c.group === group && c.questions.some((n) => inRun.has(n))),
  })).filter((s) => s.cats.length);

  return (
    <nav className="side" aria-label="Questions in this run">
      {sections.map((s) => (
        <div key={s.group}>
          {sections.length > 1 && <div className="grp-label">{s.label}</div>}
          {s.cats.map((c) => {
            const nums = c.questions.filter((n) => inRun.has(n));
            const passed = nums.filter((n) => run.state[n].status === 'passed').length;
            const open = !collapsed[c.id];
            return (
              <div key={c.id}>
                <button type="button" className="cat" aria-expanded={open} onClick={() => toggle(c.id)}>
                  <span className="chev"><Icon name="chevron" /></span>
                  <span className="name" title={c.name}>{c.name}</span>
                  <span className={`count${passed === nums.length ? ' done' : ''}`}>{passed}/{nums.length}</span>
                </button>
                {open && nums.map((n) => {
                  const q = getQuestion(run.setId, n);
                  const status = questionStatus(run, n);
                  return (
                    <button key={n} type="button" className={`qitem${n === current ? ' active' : ''}`} onClick={() => onSelect(n)}
                      aria-current={n === current ? 'true' : undefined} title={`${q.title} — ${STATUS_LABEL[status]}`}>
                      <span className={`st ${status}`}>{STATUS_ICON[status] && <Icon name={STATUS_ICON[status]} />}</span>
                      <span className="num">Q{n}</span>
                      <span className="t">{q.title}</span>
                      <span className="mk">{q.marks}m</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
