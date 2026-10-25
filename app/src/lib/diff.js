// Small diff helpers for the output panel: line diff for printed output, token diff to
// highlight what changed inside a line or a value.

// Longest-common-subsequence keep-flags for two arrays. Common prefix and suffix are
// trimmed first, which keeps the usual "one value is wrong" case cheap.
function lcs(a, b, eq = (x, y) => x === y) {
  const n = a.length, m = b.length;
  const keepA = new Array(n).fill(false), keepB = new Array(m).fill(false);
  let s = 0;
  while (s < n && s < m && eq(a[s], b[s])) { keepA[s] = keepB[s] = true; s++; }
  let ea = n, eb = m;
  while (ea > s && eb > s && eq(a[ea - 1], b[eb - 1])) { ea--; eb--; keepA[ea] = keepB[eb] = true; }
  const N = ea - s, M = eb - s;
  if (N === 0 || M === 0 || N * M > 4_000_000) return { keepA, keepB };  // too big: leave the middle unmatched
  const dp = Array.from({ length: N + 1 }, () => new Uint32Array(M + 1));
  for (let i = N - 1; i >= 0; i--) {
    for (let j = M - 1; j >= 0; j--) {
      dp[i][j] = eq(a[s + i], b[s + j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  let i = 0, j = 0;
  while (i < N && j < M) {
    if (eq(a[s + i], b[s + j])) { keepA[s + i] = keepB[s + j] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return { keepA, keepB };
}

const TOKEN = /\s+|[A-Za-z0-9_]+|[^\sA-Za-z0-9_]/g;
const tokenize = (s) => s.match(TOKEN) || [];

function segments(tokens, keep) {
  const out = [];
  tokens.forEach((t, i) => {
    const changed = !keep[i];
    const last = out[out.length - 1];
    if (last && last.changed === changed) last.text += t;
    else out.push({ text: t, changed });
  });
  return out;
}

// -> { left: [{text, changed}], right: [{text, changed}] }
export function tokenDiff(expected, got) {
  const a = tokenize(expected), b = tokenize(got);
  const { keepA, keepB } = lcs(a, b);
  return { left: segments(a, keepA), right: segments(b, keepB) };
}

const rstrip = (s) => s.replace(/\s+$/, '');

// Rows for a side-by-side view: same / chg (both sides, different) / del (only expected) / add (only got).
export function lineDiff(expected, got) {
  const a = expected.split('\n'), b = got.split('\n');
  const { keepA, keepB } = lcs(a, b, (x, y) => rstrip(x) === rstrip(y));
  const rows = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && keepA[i] && keepB[j]) {
      rows.push({ kind: 'same', exp: a[i], got: b[j], expNo: i + 1, gotNo: j + 1 });
      i++; j++;
      continue;
    }
    const dels = [], adds = [];
    while (i < a.length && !keepA[i]) dels.push(i++);
    while (j < b.length && !keepB[j]) adds.push(j++);
    const pairs = Math.min(dels.length, adds.length);
    for (let k = 0; k < pairs; k++) rows.push({ kind: 'chg', exp: a[dels[k]], got: b[adds[k]], expNo: dels[k] + 1, gotNo: adds[k] + 1 });
    for (let k = pairs; k < dels.length; k++) rows.push({ kind: 'del', exp: a[dels[k]], got: null, expNo: dels[k] + 1, gotNo: null });
    for (let k = pairs; k < adds.length; k++) rows.push({ kind: 'add', exp: null, got: b[adds[k]], expNo: null, gotNo: adds[k] + 1 });
  }
  return rows;
}

// Makes whitespace that differs visible (spaces become dots, tabs arrows).
export const showWhitespace = (s) => s.replace(/ /g, '·').replace(/\t/g, '→').replace(/\n/g, '↵\n');
