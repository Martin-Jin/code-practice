import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { removeSet } from '../lib/library.js';
import Shell from '../components/Shell.jsx';
import { useDialogs } from '../components/Dialogs.jsx';
import { toast } from '../components/Toasts.jsx';

const PART_LABEL = { numeric: 'number', mcq: 'choice', self: 'self-mark' };

// An imported set: its questions grouped by section, in the order the manifest lists them.
export default function LibrarySet({ setId, theme }) {
  const st = useStore();
  const { confirm } = useDialogs();
  const record = st.library.sets[setId];

  if (!record) {
    return <Shell theme={theme} crumbs={[{ label: 'Unknown set' }]}><div className="empty">There is no imported set called "{setId}". <a href="#/">Back to the dashboard</a></div></Shell>;
  }

  const { questions } = record.manifest;
  const sections = [];
  for (const q of questions) {
    let s = sections.find((x) => x.name === q.section);
    if (!s) sections.push(s = { name: q.section, questions: [] });
    s.questions.push(q);
  }

  const remove = async () => {
    const ok = await confirm({
      title: `Remove ${record.title}?`,
      body: 'This deletes the copy kept in this browser. Your folder is not touched, and you can add it again later.',
      confirmText: 'Remove', danger: true,
    });
    if (!ok) return;
    try { await removeSet(setId); window.location.hash = '#/'; } catch (e) { toast(`Could not remove it: ${e.message}`, 'bad'); }
  };

  return (
    <Shell theme={theme} crumbs={[{ label: record.title }]}>
      <div className="page-head">
        <h1>{record.title}</h1>
        <p className="muted">
          {[record.course, plural(questions.length, 'question'), plural(sections.length, 'section'), `from ${record.folder || 'the top of the folder you chose'}`].filter(Boolean).join(' · ')}
        </p>
        <div className="row"><button type="button" className="btn danger" onClick={remove}>Remove from this browser</button></div>
      </div>

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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </Shell>
  );
}
