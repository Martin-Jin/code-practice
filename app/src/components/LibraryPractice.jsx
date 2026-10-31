import { useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural, timeAgo } from '../lib/format.js';
import { LIB_MODE_LABELS } from '../../shared/librarymodes.js';
import { capQuestionCount, splitProblem } from '../../shared/modes.js';
import { createLibRun, deleteLibRun, runStatus, getQuestionProgress, libraryRunSet } from '../lib/practice.js';
import { useDialogs } from './Dialogs.jsx';
import { toast, validationError } from './Toasts.jsx';
import { backupNote } from '../lib/backup.js';
import { useSlide } from './SlideText.jsx';
import Icon from './Icon.jsx';
import TopicDialog from './TopicDialog.jsx';

const MODES = ['random', 'sections', 'difficult', 'unseen', 'wrong', 'all'];
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
  const [perSection, setPerSection] = useState(null);   // a custom mix: { section: how many }, Random only
  const [customising, setCustomising] = useState(false);
  const { prompt } = useDialogs();
  const names = [...new Set(set.manifest.questions.map((q) => q.section))];
  // The pool a Random run draws from, as the picker shows it: the ticked sections, minus completed questions if asked.
  const pool = set.manifest.questions.filter((q) => (!sections.length || sections.includes(q.section))
    && !(hideCompleted && ((getQuestionProgress(set.id, q) || {}).right > 0)));
  const groups = new Set(pool.map((q) => q.section)).size;
  const n = capQuestionCount(count, pool.length);
  const splitError = split && n >= 1 && n < pool.length ? splitProblem(groups, pool.length, n, 'section') : null;
  const done = (q) => hideCompleted && ((getQuestionProgress(set.id, q) || {}).right > 0);
  const topics = names.map((s) => ({ id: s, name: s, available: set.manifest.questions.filter((q) => q.section === s && !done(q)).length }));
  const mix = mode === 'random' && perSection ? pool.reduce((m, q) => ({ ...m, [q.section]: (m[q.section] || 0) + 1 }), {}) : null;
  const mixCounts = mix ? Object.entries(mix).map(([s, avail]) => Math.min(Number(perSection[s]) || 0, avail)).filter((k) => k > 0) : [];

  const start = async () => {
    const custom = mode === 'random' && perSection;
    if (mode === 'random' && !custom && n < 1) return validationError('Choose how many questions you want.');
    if (mode === 'random' && !custom && splitError) return validationError(splitError);
    const name = await prompt({ title: 'Start session', label: 'Session name (optional)', placeholder: 'Leave blank for an automatic name', confirmText: 'Start' });
    if (name === null) return;
    try {
      const run = createLibRun({
        setId: set.id,
        ...(set.folderRun ? { folderId: set.folderId, sourceSetIds: set.sourceSetIds } : {}),
        mode, options: { count: n, sections, split, hideCompleted, ...(custom ? { perSection } : {}) }, name,
      });
      window.location.hash = `#/practice/${run.id}`;
    } catch (e) {
      toast(e.message, 'bad');
    }
  };

  const picker = (id) => (
    <div className="mode selected" key={id}>
      <div className="m-head">
        <span className="m-title">{LIB_MODE_LABELS[id]}</span>
        <span className="m-desc">{DESC[id]}</span>
      </div>
      {mode === id && id === 'random' && (
        <div className="m-opts">
          {mix ? (
            <div className="row">
              <span>Custom mix: {plural(mixCounts.reduce((t, k) => t + k, 0), 'question')} from {plural(mixCounts.length, 'section')}</span>
              <button type="button" className="btn ghost sm" onClick={() => setPerSection(null)}>Back to a single count</button>
            </div>
          ) : (
            <>
              <div className="row">
                <label htmlFor="lib-count">Number of questions</label>
                <input id="lib-count" type="number" min="1" max={pool.length} required value={n} onChange={(e) => setCount(e.target.value)} style={{ width: 80 }} />
                <span className="muted">of {plural(pool.length, 'available question')}</span>
              </div>
              <label className="check">
                <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} />
                Split evenly across sections ({plural(groups, 'section')} in the pool)
              </label>
              {split && !splitError && n >= 1 && (
                <span className="muted">{n >= pool.length ? 'That is every question, so this runs as All questions.' : `${n / groups} from each section, chosen at random.`}</span>
              )}
            </>
          )}
        </div>
      )}
      {mode === id && names.length > 1 && (
        <div className="m-opts">
          <div className="row">
            <span className="muted">{sections.length ? `${plural(sections.length, 'section')} chosen` : id === 'sections' ? 'No sections chosen yet' : 'All sections'}</span>
            <button type="button" className="btn sm" onClick={() => setCustomising(true)}>Choose sections…</button>
            {sections.length > 0 && <button type="button" className="btn ghost sm" onClick={() => { setSections([]); setPerSection(null); }}>Clear</button>}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section>
      <div className="section-title"><h2>Practise</h2>{st.prioritise && <span className="chip accent">Drawing hard questions more often</span>}</div>
      <div className="row" style={{ marginBottom: 10 }}>
        {names.length > 1 && (
          <button type="button" className="btn icon-only" onClick={() => setCustomising(true)} title="Customise by section: choose the sections, and how many questions from each" aria-label="Customise by section">
            <Icon name="tune" />
          </button>
        )}
        <label htmlFor="lib-mode">Practice mode</label>
        <select id="lib-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
          {MODES.filter((id) => id !== 'sections' || names.length > 1).map((id) => <option key={id} value={id}>{LIB_MODE_LABELS[id]}</option>)}
        </select>
        <button type="button" className="btn primary" onClick={start}>Start</button>
      </div>
      <div className="modes">{picker(mode)}</div>
      <label className="check" style={{ marginTop: 10 }}>
        <input type="checkbox" checked={hideCompleted} onChange={(e) => setHideCompleted(e.target.checked)} />
        Leave out completed questions (ones you have got right at least once)
      </label>
      {customising && (
        <TopicDialog
          title="Customise by section" topics={topics} selected={sections} counts={perSection} withCounts={mode === 'random'}
          onClose={(result) => {
            setCustomising(false);
            if (!result) return;
            setSections(result.selected);
            if (mode === 'random') setPerSection(result.counts);
          }}
        />
      )}
    </section>
  );
}

// One saved session over an imported set: progress, and Resume / Abandon.
export function LibRunRow({ run, showSet = true, compact = false }) {
  const st = useStore();
  const { confirm } = useDialogs();
  const row = useRef(null);
  const main = useRef(null);
  useSlide(main, row);   // a thin row cuts its text off and slides it on hover
  const set = libraryRunSet(run);
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
    <div className={`card run-row${compact ? ' compact' : ''}`} ref={row}>
      <div style={{ minWidth: 0 }} ref={main}>
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
