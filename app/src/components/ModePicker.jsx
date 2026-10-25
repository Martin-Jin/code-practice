import { eligibleCategories, practiceSize, MODE_LABELS } from '../../shared/modes.js';
import { plural } from '../lib/format.js';

export const defaultChoice = () => ({
  mode: 'practice',
  options: { count: 5, includeRevision: false, includeExtra: false, categories: [] },
});

const sum = (cats) => cats.reduce((n, c) => n + c.questions.length, 0);

// Controlled picker for a run's test mode and its options. value = { mode, options }.
export default function ModePicker({ set, value, onChange }) {
  const { mode, options } = value;
  const setMode = (m) => onChange({ ...value, mode: m });
  const setOpt = (patch) => onChange({ ...value, options: { ...options, ...patch } });

  const bp = set.practice;
  const catName = (id) => set.categories.find((c) => c.id === id).name;
  const fixed = bp.fixed.map((f) => `${f.count} from ${catName(f.category)}`).join(' and ');
  const pool = eligibleCategories(set, options);
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

  const card = (id, desc, body) => (
    <div className={`mode${mode === id ? ' selected' : ''}`}>
      <label>
        <input type="radio" name="mode" checked={mode === id} onChange={() => setMode(id)} />
        <span className="m-title">{MODE_LABELS[id]}</span>
        <span className="m-desc">{desc}</span>
      </label>
      {mode === id && body && <div className="m-opts">{body}</div>}
    </div>
  );

  return (
    <div className="modes">
      {card('practice',
        `${practiceSize(set)} questions: ${fixed}, plus 1 each from ${bp.pick.count} randomly chosen topics. Like a short test.`,
        <span className="muted">Topics in the draw: {bp.pick.from.map(catName).join(', ')}.</span>)}

      {card('random', 'A random selection from across the set.', (
        <>
          <div className="row">
            <label htmlFor="rand-count">Number of questions</label>
            <input id="rand-count" type="number" min="1" max={sum(pool)} value={options.count}
              onChange={(e) => setOpt({ count: e.target.value })} />
            <span className="muted">of {plural(sum(pool), 'available question')}</span>
          </div>
          {extraToggles}
        </>
      ))}

      {card('topic', 'Every question in the topics you choose.', (
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
            {plural(sum(set.categories.filter((c) => options.categories.includes(c.id))), 'question')} selected
          </span>
        </>
      ))}

      {card('all', `Work through the whole set (${plural(sum(pool), 'question')} with the options below).`, extraToggles)}
    </div>
  );
}
