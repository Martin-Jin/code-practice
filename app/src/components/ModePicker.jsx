import { useState } from 'react';
import { capQuestionCount, eligibleCategories, poolCategories, practiceSize, splitProblem, MODE_LABELS } from '../../shared/modes.js';
import { plural } from '../lib/format.js';
import { statsFor } from '../lib/service.js';
import Icon from './Icon.jsx';
import TopicDialog from './TopicDialog.jsx';

export const defaultChoice = () => ({
  mode: 'practice',
  options: { count: 5, includeRevision: false, includeExtra: false, categories: [], split: false, hideCompleted: false, perTopic: null },
});

const PICKABLE = ['practice', 'random', 'topic', 'difficult', 'unseen', 'wrong', 'all'];
const sum = (cats) => cats.reduce((n, c) => n + c.questions.length, 0);

// Controlled picker for a run's test mode and its options. value = { mode, options }. With onStart it also shows a Start button.
export default function ModePicker({ set, value, onChange, onStart }) {
  const { mode, options } = value;
  const [customising, setCustomising] = useState(false);
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
  // The custom mix from the topics dialog (Random only): how many from each ticked topic.
  const mix = mode === 'random' && options.perTopic ? pool.map((c) => [c, Math.min(Number(options.perTopic[c.id]) || 0, c.questions.length)]).filter(([, n]) => n > 0) : null;
  const mixTotal = mix ? mix.reduce((n, [, k]) => n + k, 0) : 0;
  const topics = set.categories.map((c) => ({ id: c.id, name: c.name, group: c.group, available: c.questions.filter((n) => !isDone(n)).length }));
  const customisable = mode !== 'practice' && set.categories.length > 1;
  // Which topics the run draws from: the ticked ones from the topics dialog, else the assessed topics.
  const topicNote = (
    <div className="row">
      <span className="muted">
        {options.categories.length ? `${plural(options.categories.length, 'topic')} chosen` : mode === 'topic' ? 'No topics chosen yet' : 'The assessed topics'}
      </span>
      <button type="button" className="btn sm" onClick={() => setCustomising(true)}>Choose topics…</button>
      {options.categories.length > 0 && <button type="button" className="btn ghost sm" onClick={() => setOpt({ categories: [], perTopic: null })}>Clear</button>}
    </div>
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
        {customisable && (
          <button type="button" className="btn icon-only" onClick={() => setCustomising(true)} title="Customise by topic: choose the topics, and how many questions from each" aria-label="Customise by topic">
            <Icon name="tune" />
          </button>
        )}
        <label htmlFor="run-mode">Practice mode</label>
        <select id="run-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
          {PICKABLE.map((id) => <option key={id} value={id}>{MODE_LABELS[id]}</option>)}
        </select>
        {onStart && <button type="button" className="btn primary" onClick={onStart}>Start</button>}
      </div>
      {card('practice',
        `${practiceSize(set)} questions: ${fixed}, plus 1 each from ${bp.pick.count} randomly chosen topics. Like a short test.`,
        <span className="muted">Topics in the draw: {bp.pick.from.map(catName).join(', ')}.</span>)}

      {card('random', 'A random selection from across the set.', (
        <>
          {mix ? (
            <div className="row">
              <span>Custom mix: {plural(mixTotal, 'question')} from {plural(mix.length, 'topic')}</span>
              <button type="button" className="btn ghost sm" onClick={() => setOpt({ perTopic: null })}>Back to a single count</button>
            </div>
          ) : (
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
                  {count >= total ? 'That is every question, so this runs as All questions.' : `${count / pool.length} from each topic, chosen at random.`}
                </span>
              )}
            </>
          )}
          {topicNote}
        </>
      ))}

      {card('topic', 'Every question in the topics you choose.', topicNote)}

      {card('difficult', `Only the questions you marked difficult (${matching((c) => c && c.difficult)} available).`, topicNote)}

      {card('unseen', `Questions you have not run yet (${matching((c) => !c || !c.attempts)} available).`, topicNote)}

      {card('wrong', `Questions whose last run did not pass (${matching((c) => c && c.attempts && c.lastStatus !== 'passed')} available).`, topicNote)}

      {card('all', `Work through the whole set (${plural(total, 'question')} with the options below).`, topicNote)}
      <label className="check">
        <input type="checkbox" checked={options.hideCompleted} onChange={(e) => setOpt({ hideCompleted: e.target.checked })} />
        Leave out completed questions (ones you have got right at least once)
      </label>
      {customising && (
        <TopicDialog
          title="Customise by topic" topics={topics} groups={Object.entries(set.groups).map(([id, label]) => ({ id, label }))}
          selected={options.categories} defaults={eligibleCategories(set, options).map((c) => c.id)} counts={options.perTopic} withCounts={mode === 'random'}
          onClose={(result) => {
            setCustomising(false);
            if (result) setOpt({ categories: result.selected, ...(mode === 'random' ? { perTopic: result.counts } : {}) });
          }}
        />
      )}
    </div>
  );
}
