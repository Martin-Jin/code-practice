import { useState } from 'react';
import { parseNumber, expectedText } from '../../shared/answers.js';
import { questionProblems } from '../../shared/questionset.js';
import { Markup } from './Question.jsx';
import Icon from './Icon.jsx';
import TagInput from './TagInput.jsx';
import { validationError } from './Toasts.jsx';

const SUPERSCRIPT = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
// "m/s^2" is shown as "m/s²".
const prettyUnit = (unit) => unit.replace(/\^(-?\d+)/g, (_, n) => [...n].map((c) => SUPERSCRIPT[c]).join(''));

const NOTE = {
  invalid: 'Enter a number.',
  empty: 'No answer yet.',
  nokey: 'No answer key yet, so this cannot be checked. Add one in the Answer key tab.',
};

// The answer box for one part, and the feedback after a check.
// The I got it / Not quite buttons of a self-marked part. QuestionView shows them in the side panel, beside Next.
// `children` go at the end of the same row (Previous and Next).
export function SelfMark({ part, value, onChange, children }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      {part.label && <b>{part.label})</b>}
      <button type="button" className="btn sm" aria-pressed={value === 'right'} onClick={() => onChange('right')}>I got it</button>
      <button type="button" className="btn sm" aria-pressed={value === 'wrong'} onClick={() => onChange('wrong')}>Not quite</button>
      {children}
    </div>
  );
}

export function PartAnswer({ uid, part, value, status, onChange, onEnter }) {
  const feedback = status && (
    status === 'right' ? <span className="fb ok"><Icon name="check" /> Correct</span>
      : status === 'wrong' ? <span className="fb bad"><Icon name="x" /> Not quite{part.type !== 'self' && expectedText(part) ? <>. Answer: <b>{expectedText(part)}</b></> : null}</span>
        : <span className="fb muted">{NOTE[status]}</span>
  );
  return (
    <li className="part">
      {(part.label || part.prompt) && (
        <div className="phead">
          {part.label && <span className="plabel">{part.label})</span>}
          {part.prompt && <Markup text={part.prompt} />}
        </div>
      )}
      <div className="pbody">
      {part.type === 'numeric' && (
        <div className="row" style={{ gap: 8 }}>
          <input
            className={`num${status === 'right' ? ' ok' : status === 'wrong' ? ' bad' : ''}`} inputMode="decimal" autoComplete="off" spellCheck={false}
            aria-label={`Answer${part.label ? ` ${part.label}` : ''}`} value={value ?? ''}
            onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onEnter(); }}
          />
          {part.unit && <span className="unit">{prettyUnit(part.unit)}</span>}
          {feedback}
        </div>
      )}
      {part.type === 'mcq' && (
        <>
          <ul className="choices">
            {part.options.map((o, i) => {
              const picked = (value || []).includes(i);
              const toggle = () => onChange(part.multi ? (picked ? value.filter((n) => n !== i) : [...(value || []), i].sort((a, b) => a - b)) : [i]);
              return (
                <li key={i}>
                  <label className="choice">
                    <input type={part.multi ? 'checkbox' : 'radio'} name={`${uid}-${part.label}`} checked={picked} onChange={toggle} />
                    <Markup text={o} className="inline" />
                  </label>
                </li>
              );
            })}
          </ul>
          {part.multi && <span className="muted">Select one or more.</span>}
          {feedback}
        </>
      )}
      </div>
    </li>
  );
}

// ---- the answer key editor ----

const blankPart = (label) => ({ label, type: 'numeric', unit: '', answer: null });
const nextLabel = (parts) => 'abcdefghijklmnopqrstuvwxyz'.split('').find((l) => !parts.some((p) => p.label === l)) || '';

// What is typed in the form, kept as text until saved. A part: { label, type, prompt, unit, answer,
// dp, tol (percent), options (one per line), correct (set of numbers), multi }.
function toDraft(part) {
  return {
    label: part.label, type: part.type, prompt: part.prompt || '', unit: part.unit || '',
    answer: part.answer === null || part.answer === undefined ? '' : String(part.answer),
    dp: part.dp === undefined ? '' : String(part.dp), tol: part.relTol === undefined ? '' : String(+(part.relTol * 100).toFixed(6)),
    options: (part.options || []).join('\n'), correct: part.correct || [], multi: !!part.multi,
  };
}

// The part described by a draft, or an Error saying what is wrong with it.
function fromDraft(d) {
  const at = d.label ? `Part ${d.label}` : 'The part';
  const part = { label: d.label.trim(), type: d.type };
  if (d.prompt.trim()) part.prompt = d.prompt.trim();
  if (d.type === 'numeric') {
    part.unit = d.unit.trim();
    if (d.answer.trim() === '') part.answer = null;
    else {
      const n = parseNumber(d.answer);
      if (Number.isNaN(n)) throw new Error(`${at}: the answer is not a number.`);
      part.answer = n;
    }
    if (d.dp.trim() !== '') {
      const dp = Number(d.dp);
      if (!Number.isInteger(dp) || dp < 0 || dp > 15) throw new Error(`${at}: decimal places must be a whole number from 0 to 15.`);
      part.dp = dp;
    }
    if (d.tol.trim() !== '') {
      const tol = Number(d.tol);
      if (!(tol >= 0)) throw new Error(`${at}: the accepted error must be a number from 0.`);
      part.relTol = tol / 100;
    }
  } else if (d.type === 'mcq') {
    const options = d.options.split('\n').map((o) => o.trim()).filter(Boolean);
    part.options = options;
    part.correct = d.correct.filter((i) => i < options.length).sort((a, b) => a - b);
    part.multi = d.multi;
  }
  return part;
}

function PartEditor({ draft, index, onChange, onRemove }) {
  const set = (patch) => onChange({ ...draft, ...patch });
  const options = draft.options.split('\n').map((o) => o.trim()).filter(Boolean);
  const toggleCorrect = (i) => set({ correct: draft.correct.includes(i) ? draft.correct.filter((n) => n !== i) : [...draft.correct, i] });
  return (
    <div className="part-edit">
      <div className="part-head">
        <b className="part-title">Part {index + 1}</b>
        <button type="button" className="btn ghost sm icon-only" onClick={onRemove} title="Remove this part" aria-label={`Remove part ${index + 1}`}><Icon name="trash" /></button>
      </div>
      <div className="fields">
        <label className="field">Label <input type="text" className="line" value={draft.label} maxLength={4} style={{ width: 48 }} onChange={(e) => set({ label: e.target.value })} /></label>
        <label className="field">Type
          <select className="line" value={draft.type} onChange={(e) => set({ type: e.target.value })}>
            <option value="numeric">Number</option>
            <option value="mcq">Multiple choice</option>
            <option value="self">Self-mark</option>
          </select>
        </label>
      </div>
      <label className="field">Wording (optional; maths between $ signs)
        <textarea rows={2} value={draft.prompt} onChange={(e) => set({ prompt: e.target.value })} />
      </label>
      {draft.type === 'numeric' && (
        <div className="fields">
          <label className="field">Answer <input type="text" inputMode="decimal" className="line" value={draft.answer} style={{ width: 110 }} onChange={(e) => set({ answer: e.target.value })} /></label>
          <label className="field">Unit <input type="text" className="line" value={draft.unit} placeholder="kg, m/s^2" style={{ width: 90 }} onChange={(e) => set({ unit: e.target.value })} /></label>
          <label className="field" title="Decimal places the question asks for">Decimal places <input type="number" className="line" min="0" max="15" value={draft.dp} style={{ width: 60 }} onChange={(e) => set({ dp: e.target.value })} /></label>
          <label className="field" title="How far off an answer may be, as a percentage of the answer. Blank means 1%.">Accepted error % <input type="number" className="line" min="0" step="any" value={draft.tol} placeholder="1" style={{ width: 70 }} onChange={(e) => set({ tol: e.target.value })} /></label>
        </div>
      )}
      {draft.type === 'mcq' && (
        <>
          <label className="field">Options, one per line
            <textarea rows={Math.max(3, options.length + 1)} value={draft.options} onChange={(e) => set({ options: e.target.value })} />
          </label>
          {options.length > 0 && (
            <div className="stack">
              <span>Correct</span>
              {options.map((o, i) => (
                <label key={i} className="check"><input type="checkbox" checked={draft.correct.includes(i)} onChange={() => toggleCorrect(i)} /> {o}</label>
              ))}
            </div>
          )}
          <label className="check"><input type="checkbox" checked={draft.multi} onChange={(e) => set({ multi: e.target.checked })} /> More than one can be right (select one or more)</label>
        </>
      )}
    </div>
  );
}

export const draftsOf = (parts) => parts.map(toDraft);
export const partsOf = (drafts) => drafts.map(fromDraft);   // throws an Error saying what is wrong
export const blankDrafts = () => [];   // a new question starts with nothing to answer; parts are added when wanted

// The list of part forms with "Add a part". drafts and onChange work on the drafts from draftsOf.
export function PartsEditor({ drafts, onChange }) {
  return (
    <>
      {drafts.map((d, i) => (
        <PartEditor key={i} draft={d} index={i}
          onChange={(next) => onChange(drafts.map((p, j) => (j === i ? next : p)))}
          onRemove={() => onChange(drafts.filter((_, j) => j !== i))} />
      ))}
      <div className="row">
        <button type="button" className="btn sm" onClick={() => onChange([...drafts, toDraft(blankPart(nextLabel(drafts)))])}><Icon name="plus" /> Add a part</button>
      </div>
    </>
  );
}

// Edit a question's parts, marks and tags (the crop of a PDF question is in the Edit the question window). `onSave(edit)` receives only
// what the user can change; `onRevert` puts the imported version back.
export function AnswerKeyEditor({ question, edited, onSave, onRevert, tagChoices = [] }) {
  const [parts, setParts] = useState(() => question.parts.map(toDraft));
  const [marks, setMarks] = useState(question.marks === null ? '' : String(question.marks));
  const [tags, setTags] = useState(question.tags.join(', '));
  const [saved, setSaved] = useState(false);

  const change = (fn) => { setSaved(false); fn(); };
  const save = () => {
    let list;
    try { list = parts.map(fromDraft); } catch (e) { validationError(e.message); return; }
    const edit = { parts: list, marks: marks.trim() === '' ? null : Number(marks), tags: tags.split(',').map((t) => t.trim()).filter(Boolean) };
    const problems = questionProblems({ ...question, ...edit });
    if (problems.length) { validationError(`${problems[0][0].toUpperCase()}${problems[0].slice(1)}.`); return; }
    onSave(edit);
    setSaved(true);
  };

  return (
    <div className="stack" style={{ gap: 12 }}>
      <p className="muted small">Saved in this browser and in backups. The imported file is not changed.</p>
      <PartsEditor drafts={parts} onChange={(next) => change(() => setParts(next))} />
      <div className="fields">
        <label className="field">Marks <input type="number" className="line" min="0" step="any" value={marks} style={{ width: 70 }} onChange={(e) => change(() => setMarks(e.target.value))} /></label>
        <label className="field grow">Tags <TagInput className="line" value={tags} tags={tagChoices} placeholder="comma separated" style={{ width: '100%' }} onChange={(v) => change(() => setTags(v))} /></label>
      </div>
      <div className="row">
        <button type="button" className="btn primary" onClick={save}>Save</button>
        {edited && <button type="button" className="btn ghost" onClick={onRevert}>Revert</button>}
        {saved && <span className="fb ok"><Icon name="check" /> Saved</span>}
      </div>
    </div>
  );
}
