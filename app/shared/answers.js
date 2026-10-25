// Checking typed answers against a question's parts (see docs/question-set-format.md). Pure
// functions, shared by the app and the tests.
//   numeric: right when within the part's tolerance of its answer
//   mcq:     right when exactly the correct options are chosen
//   self:    marked by the user after reading the solution
export const DEFAULT_REL_TOL = 0.01;

// A number typed by a person: allows a leading + or -, a real minus sign, spaces or commas as
// thousands separators ("1,234.5"), a lone comma as the decimal mark when there is no dot ("0,297", "12,5"; "1,234" is a thousand),
// and e-notation. NaN when it is not a number.
export function parseNumber(text) {
  let s = String(text ?? '').trim().replace(/−/g, '-').replace(/\s+/g, '');
  if (!s) return NaN;
  if (s.includes('.')) s = s.replace(/,/g, '');
  else if ((s.match(/,/g) || []).length === 1 && !/^[+-]?[1-9]\d{0,2},\d{3}$/.test(s)) s = s.replace(',', '.');   // "0,297" and "12,5" are decimals; "1,234" is a thousand
  else s = s.replace(/,/g, '');
  return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s) ? Number(s) : NaN;
}

// How far from the answer a number may be: the part's relative tolerance (default 1 %), or half a
// unit in the last decimal place the question asked for, whichever allows more.
export function tolerance(part) {
  const rel = part.relTol !== undefined ? part.relTol : DEFAULT_REL_TOL;
  const rounding = part.dp !== undefined ? 0.5 * 10 ** -part.dp : 0;
  return Math.max(Math.abs(part.answer) * rel, rounding, 1e-9);
}

// -> 'nokey' | 'empty' | 'invalid' | 'right' | 'wrong'
export function checkNumeric(text, part) {
  if (part.answer === null || part.answer === undefined) return 'nokey';
  if (String(text ?? '').trim() === '') return 'empty';
  const x = parseNumber(text);
  if (Number.isNaN(x)) return 'invalid';
  return Math.abs(x - part.answer) <= tolerance(part) * (1 + 1e-9) ? 'right' : 'wrong';
}

// selected: option numbers chosen. -> 'empty' | 'nokey' | 'right' | 'wrong'
export function checkMcq(selected, part) {
  if (!part.correct.length) return 'nokey';
  if (!selected || !selected.length) return 'empty';
  const chosen = new Set(selected);
  return chosen.size === part.correct.length && part.correct.every((i) => chosen.has(i)) ? 'right' : 'wrong';
}

// One part. response is the text typed (numeric), the chosen option numbers (mcq) or the user's
// own mark, 'right' or 'wrong' (self).
export function checkPart(part, response) {
  if (part.type === 'numeric') return checkNumeric(response, part);
  if (part.type === 'mcq') return checkMcq(response, part);
  return response === 'right' || response === 'wrong' ? response : 'empty';
}

// Every part of a question. answers: { label: response }. Returns { parts: { label: status },
// overall } where overall is 'right' (every checkable part right), 'wrong' (any part wrong),
// 'incomplete' (something unanswered or invalid, nothing wrong), or 'nokey' (nothing to check).
export function checkQuestion(question, answers) {
  const parts = {};
  for (const p of question.parts) parts[p.label] = checkPart(p, answers[p.label]);
  const checkable = Object.values(parts).filter((s) => s !== 'nokey');
  let overall = 'nokey';
  if (checkable.length) {
    if (checkable.includes('wrong')) overall = 'wrong';
    else if (checkable.every((s) => s === 'right')) overall = 'right';
    else overall = 'incomplete';
  }
  return { parts, overall };
}

// Whether checking can ever give this question a result: it has a self-marked part or a part with an answer key.
export function canCheck(question) {
  return question.parts.some((p) => p.type === 'self' || (p.type === 'numeric' && p.answer !== null && p.answer !== undefined) || (p.type === 'mcq' && p.correct.length > 0));
}

// The questions of a practice session still waiting for a counted check. statusOf(uid) is the question's result in
// the session ('right', 'wrong') or null. A question with no answer key cannot be checked, so it never holds a session back.
export function uncheckedQuestions(questions, statusOf) {
  return questions.filter((q) => canCheck(q) && !statusOf(q.uid)).map((q) => q.uid);
}

// The expected answer as text, for showing after a wrong check.
export function expectedText(part) {
  if (part.type === 'numeric') return part.answer === null || part.answer === undefined ? '' : `${part.answer}${part.unit ? ` ${part.unit}` : ''}`;
  if (part.type === 'mcq') return part.correct.map((i) => part.options[i]).join('; ');
  return '';
}
