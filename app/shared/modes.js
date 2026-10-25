// How each test mode picks its questions. Works on a set as described in catalog.json.
import { weightedSample } from './weights.js';

export const MODES = ['practice', 'random', 'topic', 'all', 'custom'];
export const MODE_LABELS = { practice: 'Practice test', random: 'Random', topic: 'By topic', all: 'All questions', custom: 'Single question' };

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
  };
  const weight = typeof options.weight === 'function' ? options.weight : null;   // question number -> weight
  const byId = (ids) => set.categories.filter((c) => ids.includes(c.id));
  let picked = [];

  if (mode === 'practice') {
    const bp = set.practice;
    for (const f of bp.fixed) {
      const cat = set.categories.find((c) => c.id === f.category);
      picked.push(...draw(cat.questions, f.count, rng, weight));
    }
    for (const cat of shuffle(byId(bp.pick.from), rng).slice(0, bp.pick.count)) {
      picked.push(...draw(cat.questions, 1, rng, weight));
    }
  } else if (mode === 'random') {
    const all = eligibleCategories(set, opts).flatMap((c) => c.questions);
    if (opts.count < 1) throw new Error('Choose how many questions you want');
    picked = draw(all, Math.min(opts.count, all.length), rng, weight);
  } else if (mode === 'custom') {
    // An explicit list (the search box starts one-question runs this way); not offered in the picker.
    const known = new Set(set.categories.flatMap((c) => c.questions));
    picked = opts.questions.filter((n) => known.has(n));
    if (!picked.length) throw new Error('No such question');
  } else if (mode === 'topic') {
    picked = byId(opts.categories).flatMap((c) => c.questions);
    if (!picked.length) throw new Error('Pick at least one topic');
  } else {
    picked = eligibleCategories(set, opts).flatMap((c) => c.questions);
  }

  const order = new Map();
  set.categories.forEach((c, ci) => c.questions.forEach((n, i) => order.set(n, [ci, i])));
  return [...new Set(picked)].sort((a, b) => order.get(a)[0] - order.get(b)[0] || order.get(a)[1] - order.get(b)[1]);
}
