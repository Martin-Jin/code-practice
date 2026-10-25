import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { LIB_MODE_LABELS } from '../../shared/librarymodes.js';
import { effectiveQuestions, getProgress, runStatus, createLibRun } from '../lib/practice.js';
import Shell from '../components/Shell.jsx';
import QuestionView from './QuestionView.jsx';
import { toast } from '../components/Toasts.jsx';

const STATUS_TEXT = { right: 'Right', wrong: 'Not right', null: 'Not checked' };

// A practice session over an imported set: the questions one by one, then a summary.
export default function PracticeView({ runId, param, theme }) {
  const st = useStore();
  const run = st.libRuns[runId];
  const set = run ? st.library.sets[run.setId] : null;
  if (!run || !set) {
    return <Shell theme={theme} crumbs={[{ label: 'Unknown session' }]}><div className="empty">That practice session, or its question set, is not in this browser. <a href="#/">Back to the dashboard</a></div></Shell>;
  }
  if (param === 'summary') return <Summary run={run} set={set} theme={theme} />;
  const known = new Set(effectiveQuestions(set).map((q) => q.uid));
  const uid = [param, run.current, ...run.questions].find((u) => u && run.questions.includes(u) && known.has(u));
  if (!uid) return <Shell theme={theme} crumbs={[{ label: run.name }]}><div className="empty">The questions of this session are no longer in the set. <a href="#/">Back to the dashboard</a></div></Shell>;
  return <QuestionView key={`${runId}/${uid}`} setId={run.setId} uid={uid} run={run} theme={theme} />;
}

function Summary({ run, set, theme }) {
  const all = effectiveQuestions(set);
  const questions = run.questions.map((uid) => all.find((q) => q.uid === uid)).filter(Boolean);
  const rows = questions.map((q) => ({ q, status: runStatus(run, q.uid), difficult: !!(getProgress(set.id, q.uid) || {}).difficult }));
  const count = (s) => rows.filter((r) => r.status === s).length;
  const missed = rows.filter((r) => r.status !== 'right').map((r) => r.q.uid);

  const retry = () => {
    try {
      const next = createLibRun({ setId: set.id, mode: 'custom', options: { uids: missed }, name: `Retry · ${run.name}` });
      window.location.hash = `#/practice/${next.id}`;
    } catch (e) { toast(e.message, 'bad'); }
  };

  return (
    <Shell theme={theme} crumbs={[{ label: set.title, href: `#/lib/${encodeURIComponent(set.id)}` }, { label: run.name }]}>
      <div className="page-head">
        <h1>{run.name}</h1>
        <p className="muted">{LIB_MODE_LABELS[run.mode]} · {plural(rows.length, 'question')}</p>
        <div className="row">
          <span className="chip ok">{count('right')} right</span>
          <span className="chip bad">{count('wrong')} not right</span>
          <span className="chip">{rows.length - count('right') - count('wrong')} not checked</span>
          <span className="chip warn">{rows.filter((r) => r.difficult).length} marked difficult</span>
        </div>
        <div className="row">
          <a className="btn" href={`#/practice/${run.id}`}>Review the questions</a>
          {missed.length > 0 && <button type="button" className="btn primary" onClick={retry}>Practise the {plural(missed.length, 'question')} not right</button>}
          <a className="btn" href={`#/lib/${encodeURIComponent(set.id)}`}>Back to the set</a>
        </div>
      </div>
      <div className="run-list">
        {rows.map(({ q, status, difficult }, i) => (
          <div key={q.uid} className="card sum-row">
            <span className={`chip ${status === 'right' ? 'ok' : status === 'wrong' ? 'bad' : ''}`}>{STATUS_TEXT[status]}</span>
            <a href={`#/practice/${run.id}/${encodeURIComponent(q.uid)}`} className="title">{i + 1}. {q.title}</a>
            {difficult && <span className="chip warn">difficult</span>}
          </div>
        ))}
      </div>
    </Shell>
  );
}
