// How each practice mode picks questions from an imported set (docs/question-set-format.md).
// Works on the set's questions and the user's progress. Pure, so it is tested without a browser.
import { weightedSample } from './weights.js';
import { splitProblem } from './modes.js';

export const LIB_MODES = ['all', 'random', 'sections', 'difficult', 'unseen', 'wrong', 'custom'];
export const LIB_MODE_LABELS = {
  all: 'All questions', random: 'Random', sections: 'By section', difficult: 'Marked difficult', unseen: 'Not seen yet', wrong: 'Not right last time', custom: 'Chosen questions',
};

export function combineLibraryQuestions(sets) {
  return sets.flatMap((set) => set.manifest.questions.map((q) => ({
    ...q,
    uid: `folder:${JSON.stringify([set.id, q.uid])}`,
    section: `${set.title} · ${q.section}`,
    sourceSetId: set.id,
    sourceUid: q.uid,
  })));
}

function shuffle(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Returns the uids for a session. options: { count, sections, split, hideCompleted, perSection }. progressOf(uid) gives the
// progress record or null. weight(question) is optional: when given, Random draws the questions
// with more trouble more often (see weights.js).
export function pickLibraryQuestions(questions, progressOf, mode, options = {}, rng = Math.random, weight) {
  if (!LIB_MODES.includes(mode)) throw new Error(`Unknown mode "${mode}"`);
  const sections = Array.isArray(options.sections) ? options.sections : [];
  const wanted = sections.length ? questions.filter((q) => sections.includes(q.section)) : questions;
  const inSections = options.hideCompleted ? wanted.filter((q) => !((progressOf(q.uid) || {}).right > 0)) : wanted;
  let picked;
  if (mode === 'all') picked = inSections;
  else if (mode === 'sections') {
    if (!sections.length) throw new Error('Pick at least one section');
    picked = inSections;
  } else if (mode === 'random') {
    const count = Math.floor(Number(options.count) || 0);
    const draw = (list, n) => (weight ? weightedSample(list, weight, n, rng) : shuffle(list, rng).slice(0, n));
    const groups = [...new Set(inSections.map((q) => q.section))].map((sec) => inSections.filter((q) => q.section === sec));
    const perSection = options.perSection && typeof options.perSection === 'object' ? options.perSection : null;
    if (perSection) {
      // A custom mix: { section: how many } from each ticked section, in place of count and split.
      picked = groups.flatMap((g) => draw(g, Math.floor(Number(perSection[g[0].section]) || 0)));
      if (!picked.length) throw new Error('Choose how many questions you want from at least one section');
    } else if (count < 1) throw new Error('Choose how many questions you want');
    else if (options.split && count < inSections.length) {
      const problem = splitProblem(groups.length, inSections.length, count, 'section');
      if (problem) throw new Error(problem);
      picked = groups.flatMap((g) => draw(g, count / groups.length));
    } else picked = draw(inSections, count);
  } else if (mode === 'difficult') picked = inSections.filter((q) => (progressOf(q.uid) || {}).difficult);
  else if (mode === 'unseen') {
    picked = inSections.filter((q) => { const p = progressOf(q.uid); return !p || (!p.views && !p.attempts); });
  } else if (mode === 'custom') {
    // An explicit list (the summary of a session starts a retry this way); not offered in the picker.
    const wanted = new Set(Array.isArray(options.uids) ? options.uids : []);
    picked = questions.filter((q) => wanted.has(q.uid));
  } else picked = inSections.filter((q) => (progressOf(q.uid) || {}).lastOverall === 'wrong');
  if (!picked.length) throw new Error('No questions match those options');
  return picked.map((q) => q.uid);
}
