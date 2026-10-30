import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { effectiveQuestions, getProgress, keyOf, visit, setAnswer, setSelfMark, check, resetAnswers, setDifficult, saveEdit, clearEdit, saveNotes, hasCorrections, resetChecks, setLibCurrent, finishLibRun, pendingChecks, runStatus, hasAttemptedSolution, recordSolutionAttempted } from '../lib/practice.js';
import Shell from '../components/Shell.jsx';
import Icon from '../components/Icon.jsx';
import { Stem, Solution } from '../components/Question.jsx';
import { PartAnswer, SelfMark, AnswerKeyEditor } from '../components/Parts.jsx';
import { knownTags } from '../components/TagInput.jsx';
import FormulaSidebar from '../components/FormulaSidebar.jsx';
import EditContent from '../components/EditContent.jsx';
import { Modal, useDialogs } from '../components/Dialogs.jsx';
import { toast } from '../components/Toasts.jsx';
import { sheetsOf } from '../lib/formulas.js';
import { folderCrumbs } from '../lib/folders.js';
import { copyText } from '../lib/clipboard.js';
import { copyPromptAndImage, questionImage, readAgentUrl } from '../lib/solve-agent.js';
import { CLAUDE_DESKTOP_URL, formatSolvePrompt } from '../../shared/solve-agent.js';

const loadFlag = (key, fallback) => { try { const v = localStorage.getItem(key); return v === null ? fallback : v === 'true'; } catch { return fallback; } };
const saveFlag = (key, value) => { try { localStorage.setItem(key, String(value)); } catch { /* storage blocked */ } };

// A title kept to one line. When it is longer than the space, hovering or focusing it slides it along to the end and back
// (a trackpad, wheel or touch can scroll it by hand too).
function ScrollTitle({ text }) {
  const el = useRef(null);
  const frame = useRef(0);
  const slide = (toEnd) => {
    const box = el.current;
    cancelAnimationFrame(frame.current);
    if (!box || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const from = box.scrollLeft;
    const to = toEnd ? box.scrollWidth - box.clientWidth : 0;
    if (from === to) return;
    const ms = Math.max(400, Math.abs(to - from) * 12);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      box.scrollLeft = from + (to - from) * (t < .5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  return <span ref={el} className="qtitle" tabIndex={0} title={text} onMouseEnter={() => slide(true)} onMouseLeave={() => slide(false)} onFocus={() => slide(true)} onBlur={() => slide(false)}>{text}</span>;
}

const typing =(t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

const BANNER = {
  right: ['ok', 'All correct.'],
  wrong: ['bad', 'Not all of these are right yet.'],
  incomplete: ['warn', 'Answer every part to check them all.'],
  nokey: ['warn', 'This question has no answer key yet, so it cannot be checked. Add one in the Answer key tab.'],
};

const SOLUTION_ENCOURAGEMENT = [
  'Even a rough first attempt gives you something useful to learn from.',
  'A little persistence now can make the worked steps click later.',
  'Try writing down what you know so far; it is a good starting point.',
  'Give it one more honest go. You can compare your approach afterwards.',
];

// One question of an imported set: the question, an answer box for each part, and a side panel
// with the solution and the answer key editor. Inside a practice session (`run`), Previous and Next
// follow the session's questions and a strip along the top shows how each one went.
export default function QuestionView({ setId, uid, run, theme }) {
  const st = useStore();
  const { open, confirm } = useDialogs();
  const set = st.library.sets[setId];
  const all = set ? effectiveQuestions(set) : [];
  const questions = run ? run.questions.map((id) => all.find((q) => q.uid === id)).filter(Boolean) : all;
  const index = questions.findIndex((q) => q.uid === uid);
  const question = questions[index];
  const progress = getProgress(setId, uid);
  const [panel, setPanel] = useState(null);   // 'solution' | 'key' | null
  const solutionPromptOpen = useRef(false);
  const [result, setResult] = useState(null); // the last check's overall result
  const [editMode, setEditMode] = useState(() => loadFlag('editMode', false));   // shows the controls that change the question
  const [formulaOpen, setFormulaOpen] = useState(() => loadFlag('formulaOpen', false));
  const toggleEdit = () => setEditMode((on) => { saveFlag('editMode', !on); if (on) setPanel((p) => (p === 'key' ? null : p)); return !on; });
  const openEdit = (what) => open(({ close }) => <EditContent set={set} question={question} what={what} close={close} />);
  // In edit mode a small pencil sits beside each thing that can be changed.
  const pencil = (label, onClick) => <button type="button" className="btn ghost sm icon-only edit-pencil" onClick={onClick} title={label} aria-label={label}><Icon name="pencil" /></button>;
  const [formulaSeen, setFormulaSeen] = useState(formulaOpen);   // once opened, the panel stays mounted (hidden) so Alt+T does not reload the sheet
  const toggleFormula = () => { setFormulaSeen(true); setFormulaOpen((on) => { saveFlag('formulaOpen', !on); return !on; }); };

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
    // A question with only self-marked parts is finished as soon as it is marked; pressing a mark again takes it back.
    if (part.type === 'self' && question.parts.every((p) => p.type === 'self')) {
      const overall = setSelfMark(setId, uid, question, part.label, value, run ? run.id : null);
      setResult(overall === 'right' || overall === 'wrong' ? overall : null);   // no banner once the mark is taken back
      return;
    }
    setAnswer(setId, uid, part.label, value);
    setResult(null);
  };
  const reset = () => { resetAnswers(setId, uid); setResult(null); };
  const resetStats = async () => {
    const ok = await confirm({ title: 'Reset the checks?', body: 'The count of times this question was checked, and how many were right, goes back to zero. Your typed answers and notes are kept.', confirmText: 'Reset' });
    if (ok) { resetChecks(setId, uid); setResult(null); }
  };
  const toggleSolution = async () => {
    if (panel === 'solution') { setPanel(null); return; }
    if (!hasAttemptedSolution(setId, uid, run ? run.id : null)) {
      if (solutionPromptOpen.current) return;
      solutionPromptOpen.current = true;
      const encouragement = SOLUTION_ENCOURAGEMENT[Math.floor(Math.random() * SOLUTION_ENCOURAGEMENT.length)];
      let attempted;
      try {
        attempted = await open(({ close }) => (
          <Modal compact className="attempt-prompt" title="Have you attempted this question?" onClose={() => close(false)}
            footer={(
              <>
                <button type="button" className="btn" onClick={() => close(false)}>Not yet</button>
                <button type="button" className="btn primary" autoFocus onClick={() => close(true)}>Yes, I've attempted this myself</button>
              </>
            )}>
            <div className="attempt-prompt-body">
              <span className="attempt-spark" aria-hidden="true">✦</span>
              <p>{encouragement}</p>
            </div>
          </Modal>
        ));
      } finally {
        solutionPromptOpen.current = false;
      }
      if (!attempted) return;
      recordSolutionAttempted(setId, uid, run ? run.id : null);
    }
    setPanel('solution');
  };
  const toggleDifficult = () => setDifficult(setId, uid, !(progress && progress.difficult));
  const solveWithAgent = () => {
    const prompt = formatSolvePrompt({ set, question, answers, notes });
    const hasImage = question.stem.imageData || question.stem.image || (question.stem.pdf && set.manifest.pdf);
    const imageCopy = hasImage ? copyPromptAndImage(prompt, questionImage(set, question)) : null;
    void (async () => {
      if (!imageCopy) {
        if (!(await copyText(prompt))) {
          toast('Could not copy the prompt. Check clipboard permissions and try again.', 'bad');
          return;
        }
        toast('Prompt copied. Paste it into the new chat.', 'info');
        return;
      }
      try {
        if (await imageCopy) {
          toast('Prompt and question image copied. Paste them into the new chat.', 'info');
        } else {
          const copied = await copyText(prompt);
          toast(copied
            ? 'Prompt copied. This browser cannot copy the image with it; attach the image manually.'
            : 'Could not copy the prompt. Check clipboard permissions and attach the image manually.', copied ? 'info' : 'bad');
        }
      } catch {
        const copied = await copyText(prompt);
        toast(copied
          ? 'Prompt copied. The image could not be copied with it; attach the image manually.'
          : 'Could not copy the prompt. Check clipboard permissions and attach the image manually.', copied ? 'info' : 'bad');
      }
    })();
  };

  useEffect(() => {
    if (!question) return undefined;
    const onKey = (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyT') { e.preventDefault(); toggleFormula(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || document.querySelector('dialog[open]')) return;
      if (e.key === 'd') { e.preventDefault(); toggleDifficult(); }
      else if (e.key === 's') { e.preventDefault(); void toggleSolution(); }
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
  // Reset clears typed or chosen answers, so it is only offered when there is one (an I got it / Not quite mark is not).
  const typed = question.parts.some((p) => { const v = answers[p.label]; return p.type !== 'self' && v != null && v !== '' && !(Array.isArray(v) && v.length === 0); });
  // In a session the I got it / Not quite buttons start unpressed, whatever an earlier session marked.
  const markedHere = !run || (progress && progress.markRun === run.id);
  // Self-marked parts keep their wording under the question but put their buttons in the side panel, beside Next.
  const selfParts = question.parts.filter((p) => p.type === 'self');
  const inline = question.parts.filter((p) => p.type !== 'self' || p.prompt);
  // Moving between questions is by the arrow keys and the strip of numbers; only the session's end buttons are shown.
  const showEnd = run && (run.completedAt || pending === 0);
  const nav = showEnd && (
    <>
      <span className="spacer" />
      {!run.completedAt && <button type="button" className="btn sm primary" onClick={finish}>Finish</button>}
      {run.completedAt && <a className="btn sm primary" href={`#/practice/${run.id}/summary`}>Results</a>}
    </>
  );
  const difficult = !!(progress && progress.difficult);
  const banner = result && BANNER[result];
  const edited = hasCorrections(setId, uid);
  const notes = (st.libEdits[keyOf(setId, uid)] || {}).notes ?? question.notes ?? '';

  return (
    <Shell theme={theme} crumbs={[...folderCrumbs(setId), { label: set.title, href: `#/lib/${encodeURIComponent(setId)}` }, { label: run ? run.name : question.section }]}>
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
          <h1 className="title-with-icon" style={{ margin: '6px 0 12px' }}><ScrollTitle text={question.title} />
            <button type="button" className={`btn ghost sm icon-only edit-toggle${editMode ? ' on' : ''}`} aria-pressed={editMode} onClick={toggleEdit}
              title={editMode ? 'Leave edit mode' : 'Edit this question'} aria-label={editMode ? 'Leave edit mode' : 'Edit this question'}><Icon name="pencil" /></button>
          </h1>
          {progress && progress.attempts > 0 && (
            <p className="muted checked-line">
              Checked {plural(progress.attempts, 'time')}: {progress.right} right, {progress.wrong} not right.
              <button type="button" className="btn ghost sm icon-only" onClick={resetStats} title="Reset the checks for this question" aria-label="Reset the checks for this question"><Icon name="refresh" /></button>
            </p>
          )}
          {editMode && <div className="edit-row">Question {pencil('Edit the question: title, wording, image', () => openEdit('stem'))}</div>}
          <Stem set={set} question={question} />
          {editMode && <div className="edit-row before-answers">Answers {pencil(`Edit the answer key${edited ? ' (changed)' : ''}`, () => setPanel('key'))}</div>}
          {inline.length > 0 && (
            <ol className="parts">
              {inline.map((p) => (
                <PartAnswer key={p.label} uid={uid} part={p} value={answers[p.label]} status={live[p.label]}
                  onChange={(v) => onAnswer(p, v)} onEnter={runCheck} />
              ))}
            </ol>
          )}
          {banner && <div className={`notice ${banner[0]}`} role="status" style={{ marginTop: 12 }}>{banner[1]}</div>}
          {(checkable || typed) && (
            <div className="row" style={{ marginTop: 16 }}>
              {checkable && <button type="button" className="btn primary" onClick={runCheck}>Check answer</button>}
              {typed && <button type="button" className="btn" onClick={reset}>Reset</button>}
            </div>
          )}
        </article>

        <aside className="qside">
          <div className="card pad stack" style={{ gap: 12 }}>
            <div className="row">
              <button type="button" className="btn" aria-pressed={difficult} onClick={toggleDifficult} title="Mark this question as difficult (D). Difficult questions can be drawn more often.">
                <Icon name="flag" /> {difficult ? 'Marked difficult' : 'Mark as difficult'}
              </button>
              <button type="button" className="btn" aria-pressed={panel === 'solution'} onClick={() => void toggleSolution()} title="Show or hide the solution (S)">Solution</button>
              <button type="button" className="btn" aria-pressed={formulaOpen} onClick={toggleFormula} title="Show or hide the formula sheets (Alt+T)">Formulas{sheetsOf(setId).length ? ` (${sheetsOf(setId).length})` : ''}</button>
            </div>
            <label className="stack" style={{ gap: 4 }}>
              <b>Notes</b>
              <textarea rows={3} value={notes} placeholder="What went wrong last time, or what to remember" onChange={(e) => saveNotes(setId, uid, e.target.value)} />
            </label>
            {selfParts.map((p) => <SelfMark key={p.label} part={p} value={markedHere ? answers[p.label] : undefined} onChange={(v) => onAnswer(p, v)}>{selfParts.length === 1 && nav}</SelfMark>)}
            {selfParts.length !== 1 && nav && <div className="row">{nav}</div>}
            {!panel && <p className="muted">Shortcuts: <span className="kbd">D</span> difficult, <span className="kbd">S</span> solution, <span className="kbd">Alt</span>+<span className="kbd">T</span> formula sheets, <span className="kbd">←</span> <span className="kbd">→</span> move between questions.</p>}
            {run && pending > 0 && index === questions.length - 1 && (
              <p className="muted">{plural(pending, 'question')} still to check before this session can finish: check each numbered question that is not yet green or red (a question with no answer key cannot be checked, so it does not count).</p>
            )}
            {panel === 'solution' && (
              <>
                {editMode && <div className="edit-row">Solution {pencil('Edit the solution: wording, image', () => openEdit('solution'))}</div>}
                <Solution set={set} question={question} />
                <div style={{ marginTop: 12 }}>
                  <a className="btn primary" href={readAgentUrl()} target="_blank" rel="noopener noreferrer" onClick={solveWithAgent}><Icon name="robot" /> Solve with agent</a>
                  <a className="btn" href={CLAUDE_DESKTOP_URL} target="_blank" rel="noopener noreferrer" onClick={solveWithAgent} title="Try to open Claude Desktop, then paste with Ctrl+V"><Icon name="robot" /> Try Claude Desktop</a>
                </div>
              </>
            )}
            {editMode && panel === 'key' && (
              <AnswerKeyEditor key={uid} question={question} edited={edited} tagChoices={knownTags(st, setId)}
                onSave={(edit) => { saveEdit(setId, uid, edit); setResult(null); }}
                onRevert={() => { clearEdit(setId, uid); resetChecks(setId, uid); setResult(null); }} />
            )}
          </div>
        </aside>
      </div>
      {(formulaOpen || formulaSeen) && <FormulaSidebar setId={setId} onClose={toggleFormula} hidden={!formulaOpen} />}
    </Shell>
  );
}
