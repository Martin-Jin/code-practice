import { capQuestionCount, poolCategories, practiceSize, splitProblem, MODE_LABELS } from '../../shared/modes.js';
import { plural } from '../lib/format.js';
import { statsFor } from '../lib/service.js';

export const defaultChoice = () => ({
  mode: 'practice',
  options: { count: 5, includeRevision: false, includeExtra: false, categories: [], split: false, hideCompleted: false },
});

const PICKABLE = ['practice', 'random', 'topic', 'difficult', 'unseen', 'wrong', 'all'];
const sum = (cats) => cats.reduce((n, c) => n + c.questions.length, 0);

// Controlled picker for a run's test mode and its options. value = { mode, options }.
export default function ModePicker({ set, value, onChange }) {
  const { mode, options } = value;
  const setMode = (m) => onChange({ ...value, mode: m });
  const setOpt = (patch) => onChange({ ...value, options: { ...options, ...patch } });

  const bp = set.practice;
  const catName = (id) => set.categories.find((c) => c.id === id).name;
  const fixed = bp.fixed.map((f) => `${f.count} from ${catName(f.category)}`).join(' and ');
  const counters = statsFor(set.id).questions;
  const isDone = (n) => options.hideCompleted && counters[n] && counters[n].correct > 0;
  const openCats = (cats) => cats.map((c) => ({ ...c, questions: c.questions.filter((n) => !isDone(n)) })).filter((c) => c.questions.length);
  const pool = openCats(poolCategories(set, options));
  const total = sum(pool);
  const count = capQuestionCount(options.count, total);
  const splitError = options.split && count >= 1 && count < total ? splitProblem(pool.length, total, count) : null;
  const matching = (test) => sum(pool) && pool.reduce((n, c) => n + c.questions.filter((q) => test(counters[q])).length, 0);
  const hasRevision = set.categories.some((c) => c.group === 'revision');
  const hasExtra = set.categories.some((c) => c.group === 'extra');

  const extraToggles = (
    <div className="row" style={{ gap: 18 }}>
      {hasRevision && (
        <label className="check">
          <input type="checkbox" checked={options.includeRevision} onChange={(e) => setOpt({ includeRevision: e.target.checked })} />
          Include {set.groups.revision || 'revision'}
        </label>
      )}
      {hasExtra && (
        <label className="check">
          <input type="checkbox" checked={options.includeExtra} onChange={(e) => setOpt({ includeExtra: e.target.checked })} />
          Include {set.groups.extra || 'extra practice'}
        </label>
      )}
    </div>
  );

  const toggleCategory = (id) => {
    const has = options.categories.includes(id);
    setOpt({ categories: has ? options.categories.filter((c) => c !== id) : [...options.categories, id] });
  };
  const toggleGroup = (cats) => {
    const ids = cats.map((c) => c.id);
    const all = ids.every((id) => options.categories.includes(id));
    setOpt({ categories: all ? options.categories.filter((id) => !ids.includes(id)) : [...new Set([...options.categories, ...ids])] });
  };

  // Topics to draw from, for every mode that works on a pool (none ticked means the usual pool).
  const topicFilter = (
    <>
      {Object.entries(set.groups).map(([group, label]) => {
        const cats = set.categories.filter((c) => c.group === group);
        if (!cats.length) return null;
        const allOn = cats.every((c) => options.categories.includes(c.id));
        return (
          <div className="topic-group" key={group}>
            <h4>{label}
              <button type="button" className="btn ghost sm" onClick={() => toggleGroup(cats)}>{allOn ? 'Clear' : 'Select all'}</button>
            </h4>
            <div className="topic-list">
              {cats.map((c) => (
                <label className="check" key={c.id}>
                  <input type="checkbox" checked={options.categories.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                  {c.name} <span className="muted">({c.questions.length})</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
      <span className="muted">
        {options.categories.length
          ? `${plural(sum(set.categories.filter((c) => options.categories.includes(c.id))), 'question')} in the ticked topics`
          : 'None ticked means every topic (and the optional groups above)'}
      </span>
    </>
  );

  // Only the chosen mode's card is shown, under the dropdown.
  const card = (id, desc, body) => mode === id && (
    <div className="mode selected">
      <div className="m-head">
        <span className="m-title">{MODE_LABELS[id]}</span>
        <span className="m-desc">{desc}</span>
      </div>
      {body && <div className="m-opts">{body}</div>}
    </div>
  );

  return (
    <div className="modes">
      <div className="row">
        <label htmlFor="run-mode">Practice mode</label>
        <select id="run-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
          {PICKABLE.map((id) => <option key={id} value={id}>{MODE_LABELS[id]}</option>)}
        </select>
      </div>
      {card('practice',
        `${practiceSize(set)} questions: ${fixed}, plus 1 each from ${bp.pick.count} randomly chosen topics. Like a short test.`,
        <span className="muted">Topics in the draw: {bp.pick.from.map(catName).join(', ')}.</span>)}

      {card('random', 'A random selection from across the set.', (
        <>
          <div className="row">
            <label htmlFor="rand-count">Number of questions</label>
            <input id="rand-count" type="number" min="1" max={total} required value={count}
              onChange={(e) => setOpt({ count: e.target.value })} />
            <span className="muted">of {plural(total, 'available question')}</span>
          </div>
          <label className="check">
            <input type="checkbox" checked={options.split} onChange={(e) => setOpt({ split: e.target.checked })} />
            Split evenly across topics ({plural(pool.length, 'topic')} in the pool)
          </label>
          {options.split && splitError && <span className="muted" role="alert">{splitError}</span>}
          {options.split && !splitError && count >= 1 && (
            <span className="muted">
              {count >= total ? `That is every question, so this runs as All questions.` : `${count / pool.length} from each topic, chosen at random.`}
            </span>
          )}
          {extraToggles}
          {topicFilter}
        </>
      ))}

      {card('topic', 'Every question in the topics you choose.', topicFilter)}

      {card('difficult', `Only the questions you marked difficult (${matching((c) => c && c.difficult)} available).`, <>{extraToggles}{topicFilter}</>)}

      {card('unseen', `Questions you have not run yet (${matching((c) => !c || !c.attempts)} available).`, <>{extraToggles}{topicFilter}</>)}

      {card('wrong', `Questions whose last run did not pass (${matching((c) => c && c.attempts && c.lastStatus !== 'passed')} available).`, <>{extraToggles}{topicFilter}</>)}

      {card('all', `Work through the whole set (${plural(total, 'question')} with the options below).`, <>{extraToggles}{topicFilter}</>)}
      <label className="check">
        <input type="checkbox" checked={options.hideCompleted} onChange={(e) => setOpt({ hideCompleted: e.target.checked })} />
        Leave out completed questions (ones you have got right at least once)
      </label>
    </div>
  );
}
