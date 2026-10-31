// Totals for an imported set, worked out from its questions and the progress saved on them
// (see src/lib/practice.js: attempts, right, wrong, difficult, firstAt, lastAt, and times, the data points of shared/timing.js).
// Pure, so it is unit tested.
import { libraryTrouble, codingTrouble } from './weights.js';
import { summariseTimes } from './timing.js';

const rateOf = (right, wrong) => (right + wrong ? right / (right + wrong) : null);

function tally(questions, progressOf) {
  const t = { questions: questions.length, tried: 0, solved: 0, notYetRight: 0, difficult: 0, attempts: 0, right: 0, wrong: 0, lastAt: null };
  const times = [];
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
    if (p.times) times.push(...p.times);
  }
  t.untried = t.questions - t.tried;
  t.rate = rateOf(t.right, t.wrong);
  const time = summariseTimes(times);
  t.timed = time.count;
  t.totalMs = time.totalMs;
  t.avgMs = time.avgMs;
  return t;
}

// questions: the set's effective questions ({ uid, title, section }); progressOf(uid) -> progress record or null.
// Returns the overall tally and one tally per section, in the order the sections first appear.
export function libraryStats(questions, progressOf) {
  const sections = [];
  for (const q of questions) {
    let s = sections.find((x) => x.name === q.section);
    if (!s) sections.push(s = { name: q.section, list: [] });
    s.list.push(q);
  }
  return {
    total: tally(questions, progressOf),
    sections: sections.map((s) => ({ name: s.name, ...tally(s.list, progressOf) })),
  };
}

// One row per question, for the per-question table on the Stats page. `questions` as for libraryStats.
export function questionRows(questions, progressOf, troubleOf = libraryTrouble) {
  return questions.map((q) => {
    const p = progressOf(q.uid) || {};
    const right = p.right || 0;
    const wrong = p.wrong || 0;
    const times = p.times || [];
    const time = summariseTimes(times);
    return {
      uid: q.uid, title: q.title, section: q.section, right, wrong, attempts: right + wrong, difficult: !!p.difficult,
      lastAt: p.lastAt || null, lastOverall: p.lastOverall || null, rate: rateOf(right, wrong), trouble: troubleOf(p),
      times, avgMs: time.avgMs, bestMs: time.bestMs, worstMs: time.worstMs,
    };
  });
}

// A coding set's counters (see src/lib/service.js) in the shape of an imported set's progress, so the same totals, rows,
// filters and ranking serve both Stats pages. Runs that did not pass, compile errors included, count as not right.
export const codingAsProgress = (s) => s && ({
  right: s.correct || 0, wrong: (s.wrong || 0) + (s.compileErrors || 0), difficult: !!s.difficult, lastAt: s.lastAt || null,
  lastOverall: s.attempts > 0 ? (s.lastStatus === 'passed' ? 'right' : 'wrong') : undefined, times: s.times || [], raw: s,
});
export const codingTroubleOf = (p) => codingTrouble(p.raw || {});

// The stats filters, worded to follow "Display ... questions" (the same ideas as the C++ set's: all, attempted, struggling,
// not tried) plus difficult and time consuming.
export const ROW_FILTERS = [['all', 'all'], ['attempted', 'attempted'], ['struggling', 'struggling'], ['new', 'not tried yet'], ['difficult', 'marked difficult'], ['slow', 'time consuming']];

// What a filter needs to know about the whole list: "time consuming" means slower than the questions' average time.
export function filterContext(rows) {
  const timed = rows.filter((r) => r.avgMs !== null);
  return { avgMs: timed.length ? timed.reduce((a, r) => a + r.avgMs, 0) / timed.length : null };
}

export function keepRow(filter, row, context = {}) {
  if (filter === 'attempted') return row.attempts > 0;
  if (filter === 'struggling') return row.wrong > 0 && row.lastOverall === 'wrong';   // as the Not right last time mode
  if (filter === 'new') return row.attempts === 0;
  if (filter === 'difficult') return row.difficult;
  if (filter === 'slow') return row.avgMs !== null && context.avgMs !== null && context.avgMs !== undefined && row.avgMs > context.avgMs;
  return true;
}

// What the list can be ranked by. 'section' keeps the set's order, grouped by section, and has no direction.
export const SORT_KEYS = [['section', 'section order'], ['trouble', 'trouble'], ['rate', 'right rate'], ['time', 'average time'], ['attempts', 'attempts'], ['last', 'last attempt']];

const SORT_VALUE = {
  trouble: (r) => r.trouble,
  rate: (r) => r.rate,
  time: (r) => r.avgMs,
  attempts: (r) => r.attempts,
  last: (r) => r.lastAt,
};

// Rows ranked by one measure, highest first for 'desc' and lowest first for 'asc'. Rows without a value (no rate yet, no
// time recorded) always come last, and ties keep the set's order.
export function sortRows(rows, key, dir = 'desc') {
  const value = SORT_VALUE[key];
  if (!value) return rows.slice();
  const sign = dir === 'asc' ? 1 : -1;
  return rows.map((r, i) => ({ r, i, v: value(r) })).sort((a, b) => {
    const an = a.v === null || a.v === undefined;
    const bn = b.v === null || b.v === undefined;
    if (an || bn) return an === bn ? a.i - b.i : an ? 1 : -1;
    return (a.v < b.v ? -1 : a.v > b.v ? 1 : 0) * sign || a.i - b.i;
  }).map((x) => x.r);
}
