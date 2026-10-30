// "Draw the questions I struggle with more often": how much trouble a question has given, and a
// weighted draw that uses it. Pure functions, shared by the app and the tests.
//   trouble: 0 (no sign of trouble, or never tried) to 1
//   weight:  1 + STRENGTH * trouble, so a question with trouble 1 is STRENGTH + 1 times as likely
//            to be drawn as one with none
// The draw is never a filter: every question can still come up.
export const STRENGTH = 4;

export const weightOf = (trouble) => 1 + STRENGTH * trouble;

// A C++ question, from its stats counters ({ attempts, wrong, compileErrors, lastStatus, difficult }). The share
// of runs that did not pass (a compile error counts half), smoothed so one failed run is not a
// verdict, and halved once the latest run passed. Marked difficult counts as 0.7 on its own and
// combines with that share like an imported question's (see libraryTrouble).
export function codingTrouble(stats) {
  if (!stats) return 0;
  const flagged = stats.difficult ? 0.7 : 0;
  let rate = 0;
  if (stats.attempts) {
    const failures = (stats.wrong || 0) + 0.5 * (stats.compileErrors || 0);
    rate = Math.min(1, (failures / (stats.attempts + 2)) * (stats.lastStatus === 'passed' ? 0.5 : 1.5));
  }
  return 1 - (1 - flagged) * (1 - rate);
}

// An imported question, from its progress record ({ difficult, right, wrong }). Marked difficult
// counts as 0.7 on its own; the share of checks that were not right is smoothed the same way. The
// two combine as independent chances, so each adds without passing 1.
export function libraryTrouble(progress) {
  if (!progress) return 0;
  const flagged = progress.difficult ? 0.7 : 0;
  const wrongRate = (progress.wrong || 0) / ((progress.right || 0) + (progress.wrong || 0) + 2);
  return 1 - (1 - flagged) * (1 - wrongRate);
}

// `count` items chosen without replacement, each more likely the heavier its weight (the
// Efraimidis-Spirakis method: sort by rng()^(1/weight)). weight(item) must be above 0.
export function weightedSample(items, weight, count, rng = Math.random) {
  return items
    .map((item) => ({ item, key: rng() ** (1 / weight(item)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map((x) => x.item);
}
