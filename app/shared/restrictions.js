// Questions that limit how the answer may be written ("must be recursive", "loops are not allowed") say so in a
// header line, `// Restrict: no-loops, recursive`, and the app checks the answer's source for it after a run (see
// analyse in program.js). The check is a scan of the code, not a compile: comments and string literals are
// ignored, so a loop mentioned in a comment does not count and a loop hidden in one does not escape. Pure, so it is unit tested.
//   no-loops      no `for`, `while` or `do` anywhere in the answer
//   recursive     at least one function in the answer calls itself
//   no-recursion  no function in the answer calls itself

export const RESTRICTIONS = {
  'no-loops': 'Loops are not allowed in this question (no for, while or do).',
  recursive: 'This question needs a recursive function: one that calls itself.',
  'no-recursion': 'This question must be iterative: no function may call itself.',
};

export const RESTRICTION_LABELS = { 'no-loops': 'No loops', recursive: 'Must be recursive', 'no-recursion': 'No recursion' };

// The tokens on a `// Restrict:` line, "no-loops, recursive" -> ['no-loops', 'recursive']. Unknown tokens are an Error.
export function parseRestrictions(text) {
  const tokens = text.split(/[,\s]+/).filter(Boolean);
  for (const t of tokens) if (!(t in RESTRICTIONS)) throw new Error(`unknown restriction "${t}" (use ${Object.keys(RESTRICTIONS).join(', ')})`);
  return tokens;
}

// The code with comments, string literals and character literals blanked out. Newlines stay, so line numbers survive.
export function blankNonCode(code) {
  let out = '';
  for (let i = 0; i < code.length;) {
    const c = code[i];
    const next = code[i + 1];
    if (c === '/' && next === '/') {
      while (i < code.length && code[i] !== '\n') { out += ' '; i++; }
    } else if (c === '/' && next === '*') {
      const end = code.indexOf('*/', i + 2);
      const stop = end < 0 ? code.length : end + 2;
      out += code.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else if (c === '"' || c === "'") {
      out += c;
      i++;
      while (i < code.length && code[i] !== c && code[i] !== '\n') {
        if (code[i] === '\\') { out += ' '; i++; }
        out += ' ';
        i++;
      }
      if (i < code.length && code[i] === c) { out += c; i++; }
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

const NOT_FUNCTIONS = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'sizeof', 'do', 'else']);

// Every function definition in already-blanked code: { name, body, line }. A definition is `name(...)` with an
// optional const/noexcept/override, then a `{` ... `}` body. Qualifiers (`Tree::Insert`) are dropped from the name.
function functions(code) {
  const found = [];
  const head = /([A-Za-z_]\w*)\s*\(/g;
  for (let m = head.exec(code); m; m = head.exec(code)) {
    const name = m[1];
    if (NOT_FUNCTIONS.has(name)) continue;
    let depth = 1;
    let i = head.lastIndex;
    while (i < code.length && depth > 0) {
      if (code[i] === '(') depth++;
      else if (code[i] === ')') depth--;
      i++;
    }
    const after = /^\s*(?:const\b|noexcept\b|override\b|\s)*\{/.exec(code.slice(i));
    if (depth > 0 || !after) continue;
    const open = i + after[0].length - 1;
    let level = 1;
    let j = open + 1;
    while (j < code.length && level > 0) {
      if (code[j] === '{') level++;
      else if (code[j] === '}') level--;
      j++;
    }
    found.push({ name, body: code.slice(open + 1, j - 1), line: code.slice(0, m.index).split('\n').length });
  }
  return found;
}

const callsItself = (f) => new RegExp(`\\b${f.name}\\s*\\(`).test(f.body);

// What the answer breaks: a list of { rule, message, line } (line is where in the answer, or null), empty when it keeps
// to every restriction. `code` is the student's answer as typed.
export function checkRestrictions(restrict, code) {
  if (!restrict || !restrict.length) return [];
  const clean = blankNonCode(String(code).replace(/\r\n/g, '\n'));
  const out = [];
  const lineAt = (index) => clean.slice(0, index).split('\n').length;
  if (restrict.includes('no-loops')) {
    const loop = /\b(for|while|do)\b/.exec(clean);
    if (loop) out.push({ rule: 'no-loops', message: `${RESTRICTIONS['no-loops']} Found "${loop[1]}" on line ${lineAt(loop.index)} of your answer.`, line: lineAt(loop.index) });
  }
  if (restrict.includes('recursive') || restrict.includes('no-recursion')) {
    const recursive = functions(clean).filter(callsItself);
    if (restrict.includes('recursive') && !recursive.length) out.push({ rule: 'recursive', message: RESTRICTIONS.recursive, line: null });
    if (restrict.includes('no-recursion') && recursive.length) out.push({ rule: 'no-recursion', message: `${RESTRICTIONS['no-recursion']} ${recursive[0].name}() calls itself (line ${recursive[0].line}).`, line: recursive[0].line });
  }
  return out;
}
