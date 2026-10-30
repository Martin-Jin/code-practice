// How each test mode picks its questions. Works on a set as described in catalog.json.
import { weightedSample } from './weights.js';

export const MODES = ['practice', 'random', 'topic', 'difficult', 'unseen', 'wrong', 'all', 'custom'];
export const MODE_LABELS = {
  practice: 'Practice test', random: 'Random', topic: 'By topic', difficult: 'Marked difficult', unseen: 'Not seen yet',
  wrong: 'Not right last time', all: 'All questions', custom: 'Single question',
};

export const capQuestionCount = (count, maximum) =>
  Math.min(Math.max(0, Math.floor(Number(count) || 0)), Math.max(0, Math.floor(Number(maximum) || 0)));

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// `count` of the items, at random; with a weight function, the heavier ones more often (see weights.js).
const draw = (list, count, rng, weight) => (weight ? weightedSample(list, weight, count, rng) : shuffle(list, rng).slice(0, count));

// Categories a "random" or "all" run may draw from: assessed topics, plus the optional groups.
export function eligibleCategories(set, opts) {
  return set.categories.filter((c) =>
    c.group === 'core' || (c.group === 'revision' && opts.includeRevision) ||
    (c.group === 'extra' && opts.includeExtra));
}

// The categories a run draws from: the topics ticked in the picker if any, else the assessed ones plus the optional groups.
export function poolCategories(set, opts) {
  const ids = Array.isArray(opts.categories) ? opts.categories : [];
  return ids.length ? set.categories.filter((c) => ids.includes(c.id)) : eligibleCategories(set, opts);
}

// A "split evenly" random run takes count / (topics) questions from each topic. The count must
// reach every topic and divide evenly, unless it is every question (which just becomes "all").
export function splitProblem(groups, total, count, noun = 'topic') {
  if (!groups) return `No ${noun}s to draw from`;
  if (count === total) return null;
  if (count < groups) return `Use at least ${groups} so every ${noun} gets a question`;
  if (count % groups) return `Use a multiple of ${groups}, or all ${total}`;
  return null;
}

export const practiceSize = (set) =>
  set.practice.fixed.reduce((n, f) => n + f.count, 0) + set.practice.pick.count;

// Question numbers for a run, ordered by category then position inside the category.
export function pickQuestions(set, mode, options = {}, rng = Math.random) {
  if (!MODES.includes(mode)) throw new Error(`Unknown mode "${mode}"`);
  const opts = {
    includeRevision: !!options.includeRevision,
    includeExtra: !!options.includeExtra,
    count: Math.floor(Number(options.count) || 0),
    categories: Array.isArray(options.categories) ? options.categories : [],
    questions: Array.isArray(options.questions) ? options.questions.map(Number) : [],
    split: !!options.split,
    // A custom mix: { categoryId: how many } drawn from each ticked topic, in place of count and split.
    perTopic: options.perTopic && typeof options.perTopic === 'object' ? options.perTopic : null,
  };
  // Questions already marked correct once; left out of every pool when "hide completed" is on.
  const done = new Set(options.hideCompleted && Array.isArray(options.completed) ? options.completed.map(Number) : []);
  const open = (list) => list.filter((n) => !done.has(n));
  const weight = typeof options.weight === 'function' ? options.weight : null;   // question number -> weight
  // Question numbers the user marked difficult, has not tried, or did not pass last time (from their stats).
  const flagged = (key) => new Set(Array.isArray(options[key]) ? options[key].map(Number) : []);
  const byId = (ids) => set.categories.filter((c) => ids.includes(c.id));
  let picked = [];

  if (mode === 'practice') {
    const bp = set.practice;
    for (const f of bp.fixed) {
      const cat = set.categories.find((c) => c.id === f.category);
      picked.push(...draw(open(cat.questions), f.count, rng, weight));
    }
    const pickable = byId(bp.pick.from).filter((c) => open(c.questions).length);
    for (const cat of shuffle(pickable, rng).slice(0, bp.pick.count)) {
      picked.push(...draw(open(cat.questions), 1, rng, weight));
    }
  } else if (mode === 'random' && opts.perTopic) {
    for (const c of poolCategories(set, opts)) {
      const n = Math.floor(Number(opts.perTopic[c.id]) || 0);
      if (n > 0) picked.push(...draw(open(c.questions), n, rng, weight));
    }
    if (!picked.length) throw new Error('Choose how many questions you want from at least one topic');
  } else if (mode === 'random') {
    const cats = poolCategories(set, opts).map((c) => open(c.questions)).filter((l) => l.length);
    const all = cats.flat();
    if (opts.count < 1) throw new Error('Choose how many questions you want');
    if (opts.split && opts.count < all.length) {
      const problem = splitProblem(cats.length, all.length, opts.count);
      if (problem) throw new Error(problem);
      for (const list of cats) picked.push(...draw(list, opts.count / cats.length, rng, weight));
    } else picked = draw(all, Math.min(opts.count, all.length), rng, weight);
  } else if (mode === 'custom') {
    // An explicit list (the search box starts one-question runs this way); not offered in the picker.
    const known = new Set(set.categories.flatMap((c) => c.questions));
    picked = opts.questions.filter((n) => known.has(n));
    if (!picked.length) throw new Error('No such question');
  } else if (mode === 'topic') {
    picked = open(byId(opts.categories).flatMap((c) => c.questions));
    if (!picked.length) throw new Error('Pick at least one topic');
  } else if (mode === 'difficult' || mode === 'unseen' || mode === 'wrong') {
    const keep = flagged(mode);
    picked = open(poolCategories(set, opts).flatMap((c) => c.questions)).filter((n) => keep.has(n));
    if (!picked.length) throw new Error('No questions match those options');
  } else {
    picked = open(poolCategories(set, opts).flatMap((c) => c.questions));
  }

  const order = new Map();
  set.categories.forEach((c, ci) => c.questions.forEach((n, i) => order.set(n, [ci, i])));
  return [...new Set(picked)].sort((a, b) => order.get(a)[0] - order.get(b)[0] || order.get(a)[1] - order.get(b)[1]);
}
