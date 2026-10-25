// Small fuzzy matcher for the quick-search palette. A query matches when its letters appear
// in order (not necessarily together), so "bst rem" finds "Binary search tree: Remove()".
// Several words in the query must each match. Higher scores rank first.

// Best placement of one word in the (lower-case) text: try every place its first letter
// occurs and keep the highest-scoring greedy run. Consecutive letters and word starts score more.
function matchWord(word, text) {
  let best = null;
  for (let start = text.indexOf(word[0]); start !== -1; start = text.indexOf(word[0], start + 1)) {
    let score = 0;
    let prev = -2;
    let from = start;
    const indices = [];
    for (const ch of word) {
      const at = text.indexOf(ch, from);
      if (at < 0) { score = null; break; }
      const wordStart = at === 0 || !/[a-z0-9]/.test(text[at - 1]);
      score += 1 + (at === prev + 1 ? 6 : 0) + (wordStart ? 6 : 0) - Math.min(at - from, 8) * 0.3;
      indices.push(at);
      prev = at;
      from = at + 1;
    }
    if (score !== null) {
      score -= start * 0.02;  // earlier is slightly better
      if (!best || score > best.score) best = { score, indices };
    }
  }
  return best;
}

// -> { score, indices } or null when some word of the query is not found.
export function fuzzyMatch(query, text) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return { score: 0, indices: [] };
  const lower = text.toLowerCase();
  let score = 0;
  const seen = new Set();
  for (const word of words) {
    const m = matchWord(word, lower);
    if (!m) return null;
    score += m.score;
    m.indices.forEach((i) => seen.add(i));
  }
  return { score, indices: [...seen].sort((a, b) => a - b) };
}

// items: [{ label, sub?, keywords?, rank?, showWhenEmpty? }]. Matches against label, sub and
// the hidden keywords together. Returns [{ item, labelIdx, subIdx }], best first.
export function fuzzyFilter(items, query, limit = 50) {
  if (!query.trim()) {
    return items.filter((item) => item.showWhenEmpty !== false).slice(0, limit)
      .map((item) => ({ item, labelIdx: [], subIdx: [] }));
  }
  const out = [];
  items.forEach((item, order) => {
    const sub = item.sub || '';
    const m = fuzzyMatch(query, `${item.label}\n${sub}\n${item.keywords || ''}`);
    if (!m) return;
    const labelIdx = m.indices.filter((i) => i < item.label.length);
    const subIdx = m.indices.filter((i) => i > item.label.length && i <= item.label.length + sub.length)
      .map((i) => i - item.label.length - 1);
    // Hits inside the visible title count extra, so "avl" prefers titles with AVL in them.
    out.push({ item, order, labelIdx, subIdx, score: m.score + labelIdx.length * 2 + (item.rank || 0) });
  });
  out.sort((a, b) => b.score - a.score || a.order - b.order);
  return out.slice(0, limit);
}
