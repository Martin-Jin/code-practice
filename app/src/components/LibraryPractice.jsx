import { useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural, timeAgo } from '../lib/format.js';
import { LIB_MODE_LABELS } from '../../shared/librarymodes.js';
import { splitProblem } from '../../shared/modes.js';
import { createLibRun, deleteLibRun, runStatus, getProgress } from '../lib/practice.js';
import { useDialogs } from './Dialogs.jsx';
import { toast } from './Toasts.jsx';
import { backupNote } from '../lib/backup.js';

const MODES = ['all', 'random', 'sections', 'difficult', 'unseen', 'wrong'];
const DESC = {
  all: 'Every question, in the order of the set.',
  random: 'A random selection. With "draw questions I struggle with more often" on in Settings, difficult ones come up more.',
  sections: 'Every question in the sections you choose.',
  difficult: 'Only the questions you marked difficult.',
  unseen: 'Questions you have not opened yet.',
  wrong: 'Questions whose last check was not right.',
};

// Choose a practice mode for an imported set and start a session.
export function LibraryPracticePicker({ set }) {
  const st = useStore();
  const [mode, setMode] = useState('random');
  const [count, setCount] = useState(10);
  const [sections, setSections] = useState([]);
  const [split, setSplit] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const { prompt } = useDialogs();
  const names = [...new Set(set.manifest.questions.map((q) => q.section))];
  // The pool a Random run draws from, as the picker shows it: the ticked sections, minus completed questions if asked.
  const pool = set.manifest.questions.filter((q) => (!sections.length || sections.includes(q.section))
    && !(hideCompleted && ((getProgress(set.id, q.uid) || {}).right > 0)));
  const groups = new Set(pool.map((q) => q.section)).size;
  const n = Math.floor(Number(count) || 0);
  const splitError = split && n >= 1 && n < pool.length ? splitProblem(groups, pool.length, n, 'section') : null;
  const toggle = (s) => setSections((list) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s]));

  const start = async () => {
    const name = await prompt({ title: 'Start session', label: 'Session name (optional)', placeholder: 'Leave blank for an automatic name', confirmText: 'Start' });
    if (name === null) return;
    try {
      const run = createLibRun({ setId: set.id, mode, options: { count: Number(count), sections, split, hideCompleted }, name });
      window.location.hash = `#/practice/${run.id}`;
    } catch (e) {
      toast(e.message, 'bad');
    }
  };

  const picker = (id) => (
    <div className={`mode${mode === id ? ' selected' : ''}`} key={id}>
      <div className="m-head">
        <span className="m-title">{LIB_MODE_LABELS[id]}</span>
        <span className="m-desc">{DESC[id]}</span>
      </div>
      {mode === id && id === 'random' && (
        <div className="m-opts">
          <div className="row">
            <label htmlFor="lib-count">Number of questions</label>
            <input id="lib-count" type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} style={{ width: 80 }} />
            <span className="muted">of {plural(pool.length, 'available question')}</span>
          </div>
          <label className="check">
            <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} />
            Split evenly across sections ({plural(groups, 'section')} in the pool)
          </label>
          {split && splitError && <span className="muted" role="alert" style={{ color: 'var(--bad, #c0392b)' }}>{splitError}</span>}
          {split && !splitError && n >= 1 && (
            <span className="muted">{n >= pool.length ? 'That is every question, so this runs as All questions.' : `${n / groups} from each section, chosen at random.`}</span>
          )}
        </div>
      )}
      {mode === id && (id === 'random' || id === 'sections' || id === 'all') && names.length > 1 && (
        <div className="m-opts">
          <span className="muted">{id === 'sections' ? 'Sections' : 'Only from these sections (none ticked means all)'}</span>
          <div className="topic-list">
            {names.map((s) => (
              <label className="check" key={s}><input type="checkbox" checked={sections.includes(s)} onChange={() => toggle(s)} /> {s}</label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section>
      <div className="section-title"><h2>Practise</h2>{st.prioritise && <span className="chip accent">Drawing hard questions more often</span>}</div>
      <div className="row" style={{ marginBottom: 10 }}>
        <label htmlFor="lib-mode">Practice mode</label>
        <select id="lib-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
          {MODES.map((id) => <option key={id} value={id}>{LIB_MODE_LABELS[id]}</option>)}
        </select>
        <button type="button" className="btn primary" onClick={start}>Start</button>
      </div>
      <div className="modes">{picker(mode)}</div>
      <label className="check" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={hideCompleted} onChange={(e) => setHideCompleted(e.target.checked)} />
        Leave out completed questions (ones you have got right at least once)
      </label>
    </section>
  );
}

// One saved session over an imported set: progress, and Resume / Abandon.
export function LibRunRow({ run, showSet = true }) {
  const st = useStore();
  const { confirm } = useDialogs();
  const set = st.library.sets[run.setId];
  const done = run.questions.filter((uid) => runStatus(run, uid)).length;
  const right = run.questions.filter((uid) => runStatus(run, uid) === 'right').length;
  const pct = run.questions.length ? (done / run.questions.length) * 100 : 0;

  const abandon = async () => {
    const ok = await confirm({
      title: run.completedAt ? 'Delete this session?' : 'Abandon this session?',
      body: `Its list of questions is removed. Your answers and results on the questions are kept.${run.completedAt ? '' : backupNote()}`,
      confirmText: run.completedAt ? 'Delete' : 'Abandon', danger: true,
    });
    if (ok) deleteLibRun(run.id);
  };

  return (
    <div className="card run-row">
      <div style={{ minWidth: 0 }}>
        <div className="title" title={run.name}>{run.name}</div>
        <div className="sub">
          <span className="chip accent">{LIB_MODE_LABELS[run.mode]}</span>
          {showSet && <span className="chip">{set ? set.title : run.setId}</span>}
          <span className="muted">Updated {timeAgo(run.updatedAt)}</span>
        </div>
      </div>
      <div className="prog">
        <div className={`bar${run.completedAt ? ' ok' : ''}`}><i style={{ width: `${pct}%` }} /></div>
        <span>{done} / {run.questions.length} checked · {right} right</span>
      </div>
      <div className="btns">
        {set
          ? <a className="btn primary" href={`#/practice/${run.id}${run.completedAt ? '/summary' : ''}`}>{run.completedAt ? 'Results' : 'Resume'}</a>
          : <span className="muted">Set not imported</span>}
        <button type="button" className="btn ghost icon-only" onClick={abandon} aria-label={`Delete ${run.name}`} title="Delete"><span aria-hidden="true">×</span></button>
      </div>
    </div>
  );
}

