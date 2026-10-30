import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import { folderPracticeSet } from '../lib/practice.js';
import { folderPath, setsInFolder } from '../lib/folders.js';
import Shell from '../components/Shell.jsx';
import { LibraryPracticePicker, LibRunRow } from '../components/LibraryPractice.jsx';

export default function FolderPractice({ folderId, theme }) {
  const st = useStore();
  const folder = folderId ? st.libFolders[folderId] : null;
  const set = folderPracticeSet(folderId);
  const sourceSets = setsInFolder(folderId);
  const runs = Object.values(st.libRuns).filter((run) => run.folderRun && run.folderId === folderId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const topics = [...new Set(set.manifest.questions.map((q) => q.section))];
  const crumbs = folderId
    ? folderPath(folderId).map((item, i, path) => (i < path.length - 1
      ? { label: item.name, href: `#/sets/${item.id}` }
      : { label: item.name }))
    : [{ label: 'Question sets', href: '#/sets' }, { label: 'Your library' }];

  if (folderId && !folder) {
    return <Shell theme={theme} crumbs={[{ label: 'Unknown folder' }]}><div className="empty">That folder no longer exists. <a href="#/sets">Back to your library</a></div></Shell>;
  }

  if (set.manifest.questions.length === 0) {
    return <Shell theme={theme} crumbs={crumbs}><div className="empty">There are no questions in this folder yet. Add a question set here, or choose another folder.</div></Shell>;
  }

  return (
    <Shell theme={theme} crumbs={crumbs}>
      <div className="page-head">
        <h1>{set.title}</h1>
        <p className="muted">{plural(sourceSets.length, 'question set')} · {plural(set.manifest.questions.length, 'question')} from this folder and its subfolders</p>
      </div>

      <div className="two-col">
        <LibraryPracticePicker set={set} />
        <section>
          <div className="section-title"><h2>Your runs in this folder</h2><span className="muted">{runs.length}</span></div>
          {runs.length === 0
            ? <div className="empty">No runs yet. Choose a mode and press Start.</div>
            : <div className="run-list">{runs.map((run) => <LibRunRow key={run.id} run={run} showSet={false} />)}</div>}

          <div className="section-title" style={{ marginTop: 28 }}><h2>Topics</h2></div>
          <div className="card pad" style={{ display: 'grid', gap: 6 }}>
            {topics.map((topic) => (
              <div key={topic} className="row" style={{ justifyContent: 'space-between' }}>
                <span>{topic}</span>
                <span className="muted">{plural(set.manifest.questions.filter((q) => q.section === topic).length, 'question')}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <p className="muted"><a href={folderId ? `#/sets/${folderId}` : '#/sets'}>Back to {folder ? folder.name : 'Your library'}</a></p>
    </Shell>
  );
}
