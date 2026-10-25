import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import Shell from '../components/Shell.jsx';
import RunRow from '../components/RunRow.jsx';
import { BackupReminder } from '../components/Backup.jsx';
import { LibrarySection } from '../components/Library.jsx';

const questionCount = (set) => set.categories.reduce((n, c) => n + c.questions.length, 0);

export default function Dashboard({ theme }) {
  const st = useStore();
  const runs = Object.values(st.runs).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const ongoing = runs.filter((r) => !r.completedAt);
  const finished = runs.filter((r) => r.completedAt);

  return (
    <Shell theme={theme} crumbs={[{ label: 'Dashboard' }]}>
      <div className="page-head">
        <h1>Practice dashboard</h1>
        <p className="muted">Pick a question set to start a run. Runs keep their progress until you reset or abandon them, and you can have several going at once.</p>
      </div>

      <BackupReminder />

      <section>
        <div className="section-title"><h2>Question sets</h2></div>
        <div className="grid">
          {st.catalog.sets.map((set) => {
            const stats = st.stats[set.id];
            const solved = stats ? Object.values(stats.questions).filter((q) => q.correct > 0).length : 0;
            const active = ongoing.filter((r) => r.setId === set.id).length;
            return (
              <div key={set.id} className="card set-card">
                <div>
                  <h2>{set.name}</h2>
                  <p className="muted" style={{ marginTop: 4 }}>{set.description}</p>
                </div>
                <div className="meta">
                  <span className="chip">{plural(questionCount(set), 'question')}</span>
                  <span className="chip">{plural(set.categories.length, 'topic')}</span>
                  <span className={`chip${solved ? ' ok' : ''}`}>{solved} solved</span>
                  {active > 0 && <span className="chip accent">{plural(active, 'run')} in progress</span>}
                </div>
                <div className="actions">
                  <a className="btn primary" href={`#/set/${set.id}`}>Start a run</a>
                  <a className="btn" href={`#/set/${set.id}/stats`}>Stats</a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <LibrarySection />

      <section>
        <div className="section-title"><h2>Ongoing runs</h2><span className="muted">{ongoing.length}</span></div>
        {ongoing.length === 0
          ? <div className="empty">No runs in progress. Start one from a question set above.</div>
          : <div className="run-list">{ongoing.map((r) => <RunRow key={r.id} run={r} />)}</div>}
      </section>

      {finished.length > 0 && (
        <section>
          <details>
            <summary className="section-title" style={{ cursor: 'pointer' }}><h2>Finished runs</h2><span className="muted">{finished.length}</span></summary>
            <div className="run-list" style={{ marginTop: 12 }}>{finished.map((r) => <RunRow key={r.id} run={r} />)}</div>
          </details>
        </section>
      )}
    </Shell>
  );
}
