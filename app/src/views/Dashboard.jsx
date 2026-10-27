import { useStore } from '../lib/store.js';
import Shell from '../components/Shell.jsx';
import RunRow from '../components/RunRow.jsx';
import { LibRunRow } from '../components/LibraryPractice.jsx';
import { BackupReminder } from '../components/Backup.jsx';
import Hero from '../components/Hero.jsx';

export default function Dashboard({ theme }) {
  const st = useStore();
  const runs = Object.values(st.runs).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const libRuns = Object.values(st.libRuns);
  const merged = (done) => [...runs.filter((r) => !!r.completedAt === done).map((r) => ({ kind: 'code', r })), ...libRuns.filter((r) => !!r.completedAt === done).map((r) => ({ kind: 'lib', r }))]
    .sort((a, b) => b.r.updatedAt.localeCompare(a.r.updatedAt));
  const ongoing = merged(false);
  const finished = merged(true);
  // The hero offers to pick up the session touched last.
  const last = ongoing[0];
  const resume = last ? { label: `Resume ${last.r.name}`, href: last.kind === 'lib' ? `#/practice/${last.r.id}` : `#/run/${last.r.id}` } : null;
  const row = ({ kind, r }) => (kind === 'lib' ? <LibRunRow key={r.id} run={r} /> : <RunRow key={r.id} run={r} />);

  return (
    <Shell theme={theme} crumbs={[{ label: 'Dashboard' }]} hero={<Hero action={resume} />}>

      <BackupReminder />

      <section>
        <div className="section-title"><h2>Ongoing runs</h2><span className="muted">{ongoing.length}</span></div>
        {ongoing.length === 0
          ? <div className="empty">No runs in progress. Start one from <a href="#/sets">Question sets</a>.</div>
          : <div className="run-list">{ongoing.map(row)}</div>}
      </section>

      {finished.length > 0 && (
        <section>
          <details>
            <summary className="section-title" style={{ cursor: 'pointer' }}><h2>Finished runs</h2><span className="muted">{finished.length}</span></summary>
            <div className="run-list" style={{ marginTop: 12 }}>{finished.map(row)}</div>
          </details>
        </section>
      )}
    </Shell>
  );
}
