import { useStore } from '../lib/store.js';
import { plural, timeAgo } from '../lib/format.js';
import Shell from '../components/Shell.jsx';
import { libraryRunSet } from '../lib/practice.js';

export const HISTORY_SIZE = 5;

// The question sets (coding or imported) the user most recently ran, newest first, one entry per set.
export function recentSets(st, size = HISTORY_SIZE) {
  const latest = new Map();   // set key -> { key, title, href, runs, at, run }
  const add = (kind, run, title, href) => {
    if (!title) return;   // the set is gone (a session whose set was never imported here)
    const key = `${kind}:${run.setId}`;
    const e = latest.get(key) || { key, title, href, runs: 0, at: '', run: null };
    e.runs++;
    if (run.updatedAt > e.at) { e.at = run.updatedAt; e.run = run; }
    latest.set(key, e);
  };
  const codeName = (id) => (st.catalog.sets.find((s) => s.id === id) || {}).name;
  for (const r of Object.values(st.runs)) add('code', r, codeName(r.setId), `#/set/${r.setId}`);
  for (const r of Object.values(st.libRuns)) {
    const set = libraryRunSet(r);
    const href = r.folderRun ? `#/folder-practice/${r.folderId || 'root'}` : `#/lib/${encodeURIComponent(r.setId)}`;
    add('lib', r, set && set.title, href);
  }
  return [...latest.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, size)
    .map((e) => ({ ...e, kind: e.key.startsWith('code:') ? 'code' : 'lib' }));
}

export default function History({ theme }) {
  const st = useStore();
  const recent = recentSets(st);
  return (
    <Shell theme={theme}>
      <section>
        <div className="section-title"><h2>History</h2><span className="muted">last {HISTORY_SIZE} question sets you ran</span></div>
        {recent.length === 0 ? (
          <div className="empty">No runs yet. Start one from <a href="#/sets">Question sets</a>.</div>
        ) : (
          <div className="explorer-grid">
            {recent.map((e) => {
              const resume = e.run.completedAt ? `${e.kind === 'lib' ? '#/practice/' : '#/run/'}${e.run.id}/summary` : `${e.kind === 'lib' ? '#/practice/' : '#/run/'}${e.run.id}`;
              return (
                <a key={e.key} className="card tile" href={e.href}>
                  <h2>{e.title}</h2>
                  <span className="muted">Last run {timeAgo(e.at)}: {e.run.name}</span>
                  <div className="meta">
                    <span className="chip">{plural(e.runs, 'run')}</span>
                    <span className={`chip ${e.run.completedAt ? 'ok' : 'accent'}`}>{e.run.completedAt ? 'Last run finished' : 'Last run in progress'}</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>
    </Shell>
  );
}
