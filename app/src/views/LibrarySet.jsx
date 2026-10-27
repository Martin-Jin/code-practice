import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { removeSet, deleteOwnQuestion } from '../lib/library.js';
import { deleteMine, deleteMineQuestion } from '../lib/mine.js';
import AddQuestionDialog from '../components/AddQuestion.jsx';
import { effectiveQuestions, getProgress } from '../lib/practice.js';
import Shell from '../components/Shell.jsx';
import { useDialogs } from '../components/Dialogs.jsx';
import { LibraryPracticePicker, LibRunRow } from '../components/LibraryPractice.jsx';
import { toast } from '../components/Toasts.jsx';
import { Modal } from '../components/Dialogs.jsx';
import { canLink, canSync, getLink, linkPdf, unlinkPdf, checkForUpdate, deleteQuestionFromPdf } from '../lib/pdfsync.js';
import { saveEdit } from '../lib/practice.js';

const reportText = (r) => (r ? `${r.kept} questions kept their progress, ${r.added} new${r.droppedTitles.length ? `, ${r.droppedTitles.length} no longer in the PDF` : ''}.` : 'The PDF has not changed.');

// The PDF behind an indexed set: linking the file lets the app notice when it changes and write edits into it.
function PdfBar({ record }) {
  const st = useStore();
  const link = getLink(record.id);
  const [busy, setBusy] = useState(false);
  const run = async (fn, done) => {
    setBusy(true);
    try { const r = await fn(); if (done) toast(done(r)); } catch (e) { if (e.name !== 'AbortError') toast(e.message, 'bad'); }
    setBusy(false);
  };
  // Look for a changed file when the page opens and when the window is focused again.
  useEffect(() => {
    if (!link) return undefined;
    const look = () => checkForUpdate(record.id).then((r) => { if (r) toast(`The PDF changed, so the set was updated: ${reportText(r)}`); }).catch((e) => toast(`The PDF changed but could not be used: ${e.message}`, 'bad'));
    look();
    window.addEventListener('focus', look);
    return () => window.removeEventListener('focus', look);
  }, [record.id, !!link]);
  return (
    <div className="row">
      {!canLink && <span className="muted">This browser cannot keep a link to your PDF. Changes you make here download an updated PDF to replace yours with.</span>}
      {canLink && !link && <button type="button" className="btn" disabled={busy} onClick={() => run(() => linkPdf(record.id), (r) => `Linked. ${reportText(r)}`)}>Link the PDF file</button>}
      {link && <span className="muted">Linked to {link.name}: edits are written into it, and changes to it update this set.</span>}
      {link && <button type="button" className="btn sm" disabled={busy} onClick={() => run(() => checkForUpdate(record.id, true), reportText)}>Check for changes</button>}
      {link && <button type="button" className="btn ghost sm" onClick={() => unlinkPdf(record.id)}>Unlink</button>}
    </div>
  );
}

// Deleting a question of an indexed PDF: from the app only (it stays hidden), or from the PDF too.
function DeleteQuestion({ record, question, close }) {
  const [fromPdf, setFromPdf] = useState(false);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      if (fromPdf) {
        const { written } = await deleteQuestionFromPdf(record.id, question);
        toast(written ? 'Deleted from the PDF and the set.' : 'Deleted. The updated PDF was downloaded: replace your original with it.');
      } else { saveEdit(record.id, question.uid, { hidden: true }); toast('Deleted from the app. The PDF is unchanged.'); }
      close(true);
    } catch (e) { toast(`Could not delete it: ${e.message}`, 'bad'); setBusy(false); }
  };
  return (
    <Modal title="Delete this question?" onClose={() => !busy && close(false)}
      footer={<><button type="button" className="btn" disabled={busy} onClick={() => close(false)}>Cancel</button><button type="button" className="btn danger" disabled={busy} onClick={go}>Delete</button></>}>
      <p>"{question.title}" is deleted from this set. Your answers to it are kept but have nothing to show.</p>
      <label className="check"><input type="checkbox" checked={fromPdf} onChange={(e) => setFromPdf(e.target.checked)} /> Also delete it from the PDF (its question and solution pages are removed)</label>
      {!fromPdf && <p className="muted">Without this the PDF keeps the question; the app just hides it.</p>}
    </Modal>
  );
}

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
    try { await (mine ? deleteMine(setId) : removeSet(setId)); window.location.hash = '#/'; } catch (e) { toast(`Could not remove it: ${e.message}`, 'bad'); }
  };

  const removeQuestion = async (q) => {
    if (canSync(record) && q.stem.pdf) { open(({ close }) => <DeleteQuestion record={record} question={q} close={close} />); return; }
    const ok = await confirm({ title: 'Delete this question?', body: `"${q.title}" and its image are deleted. Your answers to it are kept but have nothing to show.`, confirmText: 'Delete', danger: true });
    if (!ok) return;
    try { await (record.userOwned ? deleteMineQuestion(setId, q.uid) : deleteOwnQuestion(setId, q.uid)); } catch (e) { toast(`Could not delete it: ${e.message}`, 'bad'); }
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
          <button type="button" className="btn primary" onClick={() => open(({ close }) => <AddQuestionDialog close={close} setId={setId} />)}>Add a question</button>
          <button type="button" className="btn danger" onClick={remove}>{record.userOwned ? 'Delete all my questions' : 'Remove from this browser'}</button>
        </div>
      </div>

      {canSync(record) && <PdfBar record={record} />}
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
                {(record.userOwned || q.own || (canSync(record) && q.stem.pdf)) && <button type="button" className="btn ghost sm" onClick={() => removeQuestion(q)} aria-label={`Delete ${q.title}`}>Delete</button>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </Shell>
  );
}
