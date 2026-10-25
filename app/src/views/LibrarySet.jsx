import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { removeSet } from '../lib/library.js';
import { deleteMine, deleteMineQuestion } from '../lib/mine.js';
import AddQuestionDialog from '../components/AddQuestion.jsx';
import { effectiveQuestions, getProgress } from '../lib/practice.js';
import Shell from '../components/Shell.jsx';
import { useDialogs } from '../components/Dialogs.jsx';
import { LibraryPracticePicker, LibRunRow } from '../components/LibraryPractice.jsx';
import { toast } from '../components/Toasts.jsx';

// How a question is going: marked difficult, and the result of the last check.
function progressChips(p) {
  if (!p) return null;
  return (
    <>
      {p.difficult && <span className="chip warn">difficult</span>}
      {p.attempts > 0 && <span className={`chip ${p.lastOverall === 'right' ? 'ok' : 'bad'}`}>{p.right} right · {p.wrong} not right</span>}
    </>
  );
}

const PART_LABEL = { numeric: 'number', mcq: 'choice', self: 'self-mark' };

// An imported set: its questions grouped by section, in the order the manifest lists them.
export default function LibrarySet({ setId, theme }) {
  const st = useStore();
  const { confirm, open } = useDialogs();
  const record = st.library.sets[setId];

  if (!record) {
    return <Shell theme={theme} crumbs={[{ label: 'Unknown set' }]}><div className="empty">There is no imported set called "{setId}". <a href="#/">Back to the dashboard</a></div></Shell>;
  }

  const questions = effectiveQuestions(record);
  const sections = [];
  for (const q of questions) {
    let s = sections.find((x) => x.name === q.section);
    if (!s) sections.push(s = { name: q.section, questions: [] });
    s.questions.push(q);
  }

  const runs = Object.values(st.libRuns).filter((r) => r.setId === setId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const remove = async () => {
    const mine = record.userOwned;
    const ok = await confirm({
      title: mine ? 'Delete all your own questions?' : `Remove ${record.title}?`,
      body: mine ? `This deletes the ${plural(questions.length, 'question')} you made, with their images. They are only kept in this browser and in your backups.`
        : 'This deletes the copy kept in this browser. Your folder is not touched, and you can add it again later.',
      confirmText: mine ? 'Delete them' : 'Remove', danger: true,
    });
    if (!ok) return;
    try { await (mine ? deleteMine() : removeSet(setId)); window.location.hash = '#/'; } catch (e) { toast(`Could not remove it: ${e.message}`, 'bad'); }
  };

  const removeQuestion = async (q) => {
    const ok = await confirm({ title: 'Delete this question?', body: `"${q.title}" and its image are deleted. Your answers to it are kept but have nothing to show.`, confirmText: 'Delete', danger: true });
    if (!ok) return;
    try { await deleteMineQuestion(q.uid); } catch (e) { toast(`Could not delete it: ${e.message}`, 'bad'); }
  };

  return (
    <Shell theme={theme} crumbs={[{ label: record.title }]}>
      <div className="page-head">
        <h1>{record.title}</h1>
        <p className="muted">
          {[record.course, plural(questions.length, 'question'), plural(sections.length, 'section'), `from ${record.folder || 'the top of the folder you chose'}`].filter(Boolean).join(' · ')}
        </p>
        <div className="row">
          <a className="btn" href={`#/lib/${encodeURIComponent(setId)}/stats`}>Stats</a>
          {record.userOwned && <button type="button" className="btn primary" onClick={() => open(({ close }) => <AddQuestionDialog close={close} />)}>Add a question</button>}
          <button type="button" className="btn danger" onClick={remove}>{record.userOwned ? 'Delete all my questions' : 'Remove from this browser'}</button>
        </div>
      </div>

      <LibraryPracticePicker set={record} />
      {runs.length > 0 && (
        <section>
          <div className="section-title"><h2>Your sessions in this set</h2><span className="muted">{runs.length}</span></div>
          <div className="run-list">{runs.map((r) => <LibRunRow key={r.id} run={r} showSet={false} />)}</div>
        </section>
      )}

      {sections.map((s) => (
        <section key={s.name}>
          <div className="section-title"><h2>{s.name}</h2><span className="muted">{s.questions.length}</span></div>
          <div className="run-list">
            {s.questions.map((q) => (
              <div key={q.uid} className="card run-row" style={{ gridTemplateColumns: 'minmax(0, 1fr) auto' }}>
                <div style={{ minWidth: 0 }}>
                  <div className="title" title={q.title}><a href={`#/q/${encodeURIComponent(setId)}/${encodeURIComponent(q.uid)}`}>{q.title}</a></div>
                  <div className="sub">
                    {q.source && <span className="muted">{q.source}</span>}
                    {q.marks !== null && <span className="chip">{plural(q.marks, 'mark')}</span>}
                    {[...new Set(q.parts.map((p) => p.type))].map((t) => <span key={t} className="chip">{PART_LABEL[t]}</span>)}
                    {q.parts.some((p) => (p.type === 'numeric' && p.answer == null) || (p.type === 'mcq' && p.correct.length === 0)) && <span className="chip warn">no answer yet</span>}
                    {progressChips(getProgress(setId, q.uid))}
                  </div>
                </div>
                {record.userOwned && <button type="button" className="btn ghost sm" onClick={() => removeQuestion(q)} aria-label={`Delete ${q.title}`}>Delete</button>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </Shell>
  );
}
