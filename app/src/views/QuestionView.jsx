import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { effectiveQuestions, getProgress, keyOf, visit, setAnswer, check, resetAnswers, setDifficult, saveEdit, clearEdit, saveNotes, hasCorrections, resetChecks, setLibCurrent, finishLibRun, pendingChecks, runStatus } from '../lib/practice.js';
import Shell from '../components/Shell.jsx';
import Icon from '../components/Icon.jsx';
import { Stem, Solution } from '../components/Question.jsx';
import { PartAnswer, AnswerKeyEditor } from '../components/Parts.jsx';
import { knownTags } from '../components/TagInput.jsx';
import FormulaSidebar from '../components/FormulaSidebar.jsx';
import EditContent from '../components/EditContent.jsx';
import { useDialogs } from '../components/Dialogs.jsx';
import { sheetsOf } from '../lib/formulas.js';

const loadFlag = (key, fallback) => { try { const v = localStorage.getItem(key); return v === null ? fallback : v === 'true'; } catch { return fallback; } };
const saveFlag = (key, value) => { try { localStorage.setItem(key, String(value)); } catch { /* storage blocked */ } };

const typing = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

const BANNER = {
  right: ['ok', 'All correct.'],
  wrong: ['bad', 'Not all of these are right yet.'],
  incomplete: ['warn', 'Answer every part to check them all.'],
  nokey: ['warn', 'This question has no answer key yet, so it cannot be checked. Add one in the Answer key tab.'],
};

// One question of an imported set: the question, an answer box for each part, and a side panel
// with the solution and the answer key editor. Inside a practice session (`run`), Previous and Next
// follow the session's questions and a strip along the top shows how each one went.
export default function QuestionView({ setId, uid, run, theme }) {
  const st = useStore();
  const { open } = useDialogs();
  const set = st.library.sets[setId];
  const all = set ? effectiveQuestions(set) : [];
  const questions = run ? run.questions.map((id) => all.find((q) => q.uid === id)).filter(Boolean) : all;
  const index = questions.findIndex((q) => q.uid === uid);
  const question = questions[index];
  const progress = getProgress(setId, uid);
  const [panel, setPanel] = useState(null);   // 'solution' | 'key' | null
  const [result, setResult] = useState(null); // the last check's overall result
  const [editMode, setEditMode] = useState(() => loadFlag('editMode', false));   // shows the controls that change the question
  const [formulaOpen, setFormulaOpen] = useState(() => loadFlag('formulaOpen', false));
  const toggleEdit = () => setEditMode((on) => { saveFlag('editMode', !on); if (on) setPanel((p) => (p === 'key' ? null : p)); return !on; });
  const openEdit = (what) => open(({ close }) => <EditContent set={set} question={question} what={what} close={close} />);
  // In edit mode a small pencil sits beside each thing that can be changed.
  const pencil = (label, onClick) => <button type="button" className="btn ghost sm icon-only edit-pencil" onClick={onClick} title={label} aria-label={label}><Icon name="pencil" /></button>;
  const toggleFormula = () => setFormulaOpen((on) => { saveFlag('formulaOpen', !on); return !on; });

  useEffect(() => {
    setPanel(null); setResult(null); window.scrollTo(0, 0);
    if (question) { visit(setId, uid); if (run) setLibCurrent(run.id, uid); }
  }, [setId, uid, !!question]);

  const go = (i) => (run ? `#/practice/${run.id}/${encodeURIComponent(questions[i].uid)}` : `#/q/${encodeURIComponent(setId)}/${encodeURIComponent(questions[i].uid)}`);
  // A session finishes only when every question that can be checked has been; until then Finish is not offered.
  const pending = run && !run.completedAt ? pendingChecks(run).length : 0;
  const finish = () => { if (finishLibRun(run.id)) window.location.hash = `#/practice/${run.id}/summary`; };
  const answers = progress ? progress.answers : {};

  const runCheck = () => setResult(check(setId, uid, question).overall);
  const onAnswer = (part, value) => {
    setAnswer(setId, uid, part.label, value);
    setResult(null);
    // A question with only self-marked parts is finished as soon as it is marked.
    if (part.type === 'self' && question.parts.every((p) => p.type === 'self')) setResult(check(setId, uid, question).overall);
  };
  const reset = () => { resetAnswers(setId, uid); setResult(null); };
  const toggleDifficult = () => setDifficult(setId, uid, !(progress && progress.difficult));

  useEffect(() => {
    if (!question) return undefined;
    const onKey = (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyT') { e.preventDefault(); toggleFormula(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || document.querySelector('dialog[open]')) return;
      if (e.key === 'd') { e.preventDefault(); toggleDifficult(); }
      else if (e.key === 's') { e.preventDefault(); setPanel((p) => (p === 'solution' ? null : 'solution')); }
      else if (e.key === 'ArrowRight' && index < questions.length - 1) window.location.hash = go(index + 1);
      else if (e.key === 'ArrowLeft' && index > 0) window.location.hash = go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!question) {
    return <Shell theme={theme} crumbs={[{ label: 'Unknown question' }]}><div className="empty">That question is not in an imported set. <a href="#/">Back to the dashboard</a></div></Shell>;
  }

  const live = (progress && progress.checked) || {};
  const checkable = question.parts.some((p) => p.type !== 'self');
  const difficult = !!(progress && progress.difficult);
  const banner = result && BANNER[result];
  const edited = hasCorrections(setId, uid);
  const notes = (st.libEdits[keyOf(setId, uid)] || {}).notes ?? question.notes ?? '';

  return (
    <Shell theme={theme} crumbs={[{ label: set.title, href: `#/lib/${encodeURIComponent(setId)}` }, { label: run ? run.name : question.section }]}>
      {run && (
        <nav className="qstrip" aria-label="Questions in this session">
          {questions.map((q, i) => {
            const status = runStatus(run, q.uid);
            const p = getProgress(setId, q.uid);
            return (
              <a key={q.uid} href={go(i)} title={q.title} aria-current={q.uid === uid ? 'step' : undefined}
                className={`qdot${q.uid === uid ? ' cur' : ''}${status ? ` ${status}` : ''}${p && p.difficult ? ' diff' : ''}`}>{i + 1}</a>
            );
          })}
        </nav>
      )}
      <div className="qview">
        <article className="card pad qmain">
          <div className="sub" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="chip accent">{index + 1} / {questions.length}</span>
            {question.marks !== null && <span className="chip">{plural(question.marks, 'mark')}</span>}
            {difficult && <span className="chip warn">Difficult</span>}
            {question.source && <span className="muted">{question.source}</span>}
          </div>
          <h1 className="title-with-icon" style={{ margin: '8px 0 14px' }}>{question.title}{editMode && pencil('Edit the question: title, wording, image', () => openEdit('stem'))}</h1>
          <Stem set={set} question={question} />
          {editMode && <div className="edit-row">Answers {pencil(`Edit the answer key${edited ? ' (changed)' : ''}`, () => setPanel('key'))}</div>}
          <ol className="parts">
            {question.parts.map((p) => (
              <PartAnswer key={p.label} uid={uid} part={p} value={answers[p.label]} status={live[p.label]}
                onChange={(v) => onAnswer(p, v)} onEnter={runCheck} />
            ))}
          </ol>
          {banner && <div className={`notice ${banner[0]}`} role="status" style={{ marginTop: 12 }}>{banner[1]}</div>}
          <div className="row" style={{ marginTop: 16 }}>
            {checkable && <button type="button" className="btn primary" onClick={runCheck}>Check answer</button>}
            {Object.keys(answers).length > 0 && <button type="button" className="btn" onClick={reset}>Reset</button>}
            <span className="spacer" />
            {index > 0 && <a className="btn" href={go(index - 1)}><Icon name="back" /> Previous</a>}
            {index < questions.length - 1 && <a className="btn primary" href={go(index + 1)}>Next</a>}
            {run && !run.completedAt && pending === 0 && <button type="button" className="btn primary" onClick={finish}>Finish</button>}
            {run && run.completedAt && <a className="btn primary" href={`#/practice/${run.id}/summary`}>Results</a>}
          </div>
          {run && pending > 0 && index === questions.length - 1 && (
            <p className="muted" style={{ marginTop: 10 }}>{plural(pending, 'question')} still to check before this session can finish: check each numbered question above that is not yet green or red (a question with no answer key cannot be checked, so it does not count).</p>
          )}
          {progress && progress.attempts > 0 && (
            <p className="muted" style={{ marginTop: 10 }}>Checked {plural(progress.attempts, 'time')}: {progress.right} right, {progress.wrong} not right.</p>
          )}
        </article>

        <aside className="qside">
          <div className="card pad stack" style={{ gap: 12 }}>
            <div className="row">
              <button type="button" className="btn" aria-pressed={difficult} onClick={toggleDifficult} title="Mark this question as difficult (D). Difficult questions can be drawn more often.">
                <Icon name="flag" /> {difficult ? 'Marked difficult' : 'Mark as difficult'}
              </button>
              <button type="button" className="btn" aria-pressed={panel === 'solution'} onClick={() => setPanel(panel === 'solution' ? null : 'solution')} title="Show or hide the solution (S)">Solution</button>
              <button type="button" className="btn" aria-pressed={editMode} onClick={toggleEdit} title="Edit mode shows the controls that change this question, such as the answer key"><Icon name="pencil" /> Edit mode</button>
              <button type="button" className="btn" aria-pressed={formulaOpen} onClick={toggleFormula} title="Show or hide the formula sheets (Alt+T)">Formulas{sheetsOf(setId).length ? ` (${sheetsOf(setId).length})` : ''}</button>
            </div>
            <label className="stack" style={{ gap: 4 }}>
              <b>Notes</b>
              <textarea rows={3} value={notes} placeholder="What went wrong last time, or what to remember" onChange={(e) => saveNotes(setId, uid, e.target.value)} />
            </label>
            {panel === 'solution' && (
              <>
                {editMode && <div className="edit-row">Solution {pencil('Edit the solution: wording, image', () => openEdit('solution'))}</div>}
                <Solution set={set} question={question} />
              </>
            )}
            {editMode && panel === 'key' && (
              <AnswerKeyEditor key={uid} question={question} edited={edited} tagChoices={knownTags(st, setId)}
                onSave={(edit) => { saveEdit(setId, uid, edit); setResult(null); }}
                onRevert={() => { clearEdit(setId, uid); resetChecks(setId, uid); setResult(null); }} />
            )}
            {!panel && <p className="muted">Shortcuts: <span className="kbd">D</span> difficult, <span className="kbd">S</span> solution, <span className="kbd">Alt</span>+<span className="kbd">T</span> formula sheets, <span className="kbd">←</span> <span className="kbd">→</span> move between questions.</p>}
          </div>
        </aside>
      </div>
      {formulaOpen && <FormulaSidebar setId={setId} onClose={toggleFormula} />}
    </Shell>
  );
}
