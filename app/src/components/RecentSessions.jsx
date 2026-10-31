import { runStatus, libraryRunSet } from '../lib/practice.js';
import { LIB_MODE_LABELS } from '../../shared/librarymodes.js';
import { timeAgo, plural } from '../lib/format.js';

// A compact list of the latest practice sessions, for the space beside the practice options. `limit` is how many rows fit
// (the page measures the options beside it); when there are more sessions than that, "See all" calls onAll (a window with every one).
export default function RecentSessions({ runs, limit, onAll }) {
  const shown = runs.slice(0, limit);
  return (
    <section className="recent">
      <div className="section-title"><h2>Recent sessions</h2><span className="muted">{runs.length}</span></div>
      {runs.length === 0 ? (
        <p className="muted">No sessions yet. Choose a mode and press Start.</p>
      ) : (
        <ul className="recent-list">
          {shown.map((run) => {
            const done = run.questions.filter((uid) => runStatus(run, uid)).length;
            const right = run.questions.filter((uid) => runStatus(run, uid) === 'right').length;
            const pct = run.questions.length ? (done / run.questions.length) * 100 : 0;
            const open = !!libraryRunSet(run);
            return (
              <li key={run.id}>
                <a className="recent-row" href={open ? `#/practice/${run.id}${run.completedAt ? '/summary' : ''}` : undefined} title={`${run.name} (${LIB_MODE_LABELS[run.mode]})`}>
                  <span className="recent-name">{run.name}</span>
                  <span className="recent-meta">{done} / {run.questions.length} checked · {right} right · {timeAgo(run.updatedAt)}</span>
                  <span className={`bar${run.completedAt ? ' ok' : ''}`}><i style={{ width: `${pct}%` }} /></span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {runs.length > shown.length && (
        <button type="button" className="btn sm" onClick={onAll}>See all {plural(runs.length, 'session')}</button>
      )}
    </section>
  );
}
