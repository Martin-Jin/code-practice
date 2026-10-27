import { useStore } from '../lib/store.js';
import { plural } from '../lib/format.js';
import Shell from '../components/Shell.jsx';
import { LibrarySection } from '../components/Library.jsx';

const questionCount = (set) => set.categories.reduce((n, c) => n + c.questions.length, 0);

// Every question set: the C++ sets that ship with the app, then the sets in the user's library.
export default function SetsPage({ theme }) {
  const st = useStore();
  const ongoing = Object.values(st.runs).filter((r) => !r.completedAt);
  return (
    <Shell theme={theme} crumbs={[{ label: 'Question sets' }]}>
      <section>
        <div className="section-title"><h2>Coding question sets</h2></div>
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
    </Shell>
  );
}
