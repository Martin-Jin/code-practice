// Totals for an imported set, worked out from its questions and the progress saved on them
// (see src/lib/practice.js: attempts, right, wrong, difficult, firstAt, lastAt). Pure, so it is unit tested.
import { libraryTrouble } from './weights.js';

const rateOf = (right, wrong) => (right + wrong ? right / (right + wrong) : null);

function tally(questions, progressOf) {
  const t = { questions: questions.length, tried: 0, solved: 0, notYetRight: 0, difficult: 0, attempts: 0, right: 0, wrong: 0, lastAt: null };
  for (const q of questions) {
    const p = progressOf(q.uid);
    if (!p) continue;
    const right = p.right || 0;
    const wrong = p.wrong || 0;
    if (p.difficult) t.difficult++;
    if (right + wrong > 0) {
      t.tried++;
      if (right > 0) t.solved++; else t.notYetRight++;
    }
    t.attempts += right + wrong;
    t.right += right;
    t.wrong += wrong;
    if (p.lastAt && (!t.lastAt || p.lastAt > t.lastAt)) t.lastAt = p.lastAt;
  }
  t.untried = t.questions - t.tried;
  t.rate = rateOf(t.right, t.wrong);
  return t;
}

// questions: the set's effective questions ({ uid, title, section }); progressOf(uid) -> progress record or null.
// Returns the overall tally, one tally per section (in the order the sections first appear) and the
// `limit` questions most worth another go: marked difficult and/or often not right, worst first.
export function libraryStats(questions, progressOf, limit = 10) {
  const sections = [];
  for (const q of questions) {
    let s = sections.find((x) => x.name === q.section);
    if (!s) sections.push(s = { name: q.section, list: [] });
    s.list.push(q);
  }
  const worth = questions
    .map((q) => {
      const p = progressOf(q.uid) || {};
      return { uid: q.uid, title: q.title, section: q.section, right: p.right || 0, wrong: p.wrong || 0, difficult: !!p.difficult, lastAt: p.lastAt || null, trouble: libraryTrouble(p) };
    })
    .filter((r) => r.wrong > 0 || r.difficult)
    .sort((a, b) => b.trouble - a.trouble || b.wrong - a.wrong || a.title.localeCompare(b.title))
    .slice(0, limit);
  return {
    total: tally(questions, progressOf),
    sections: sections.map((s) => ({ name: s.name, ...tally(s.list, progressOf) })),
    worth,
  };
}

// One row per question, for the per-question table on the Stats page. `questions` as for libraryStats.
export function questionRows(questions, progressOf) {
  return questions.map((q) => {
    const p = progressOf(q.uid) || {};
    const right = p.right || 0;
    const wrong = p.wrong || 0;
    return {
      uid: q.uid, title: q.title, section: q.section, right, wrong, attempts: right + wrong, difficult: !!p.difficult,
      lastAt: p.lastAt || null, lastOverall: p.lastOverall || null, rate: rateOf(right, wrong), trouble: libraryTrouble(p),
    };
  });
}

// The stats filters (the same ideas as the C++ set's: all, attempted, struggling, not tried) plus difficult.
export const ROW_FILTERS = [['all', 'All'], ['attempted', 'Attempted'], ['struggling', 'Struggling'], ['new', 'Not tried'], ['difficult', 'Difficult']];

export function keepRow(filter, row) {
  if (filter === 'attempted') return row.attempts > 0;
  if (filter === 'struggling') return row.wrong > 0 && row.lastOverall === 'wrong';   // as the Not right last time mode
  if (filter === 'new') return row.attempts === 0;
  if (filter === 'difficult') return row.difficult;
  return true;
}

// Every row in one list, the ones giving the most trouble first; ties keep the set's order.
export const rankRows = (rows) => rows.map((r, i) => ({ r, i })).sort((a, b) => b.r.trouble - a.r.trouble || b.r.wrong - a.r.wrong || a.i - b.i).map((x) => x.r);
