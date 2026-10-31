import { useState } from 'react';
import { keepRow, filterContext, sortRows, ROW_FILTERS, SORT_KEYS } from '../../shared/libstats.js';
import { formatDuration, summariseTimes } from '../../shared/timing.js';
import { timeAgo, plural } from '../lib/format.js';
import Icon from './Icon.jsx';
import UnderlineSelect from './UnderlineSelect.jsx';

// The pieces both Stats pages share: the three summary blocks, and the questions listed under "Display ... questions, ranked by ...".
// `words` says what a good and a bad result are called: { good: 'right', bad: 'not right' } for imported sets, passed / not passed for code.
export const IMPORTED_WORDS = { good: 'right', bad: 'not right', short: 'not' };
export const CODING_WORDS = { good: 'passed', bad: 'not passed', short: 'not' };

const percent = (rate) => (rate === null ? '–' : `${Math.round(rate * 100)}%`);
const when = (iso) => new Date(iso).toLocaleString('en-NZ', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const FILTER_OPTIONS = ROW_FILTERS.map(([value, label]) => ({ value, label }));
const SORT_OPTIONS = SORT_KEYS.map(([value, label]) => ({ value, label }));

function Block({ label, children }) {
  return <div className="card stat-block"><div className="label">{label}</div>{children}</div>;
}

// total: the overall tally from libraryStats.
export function SummaryBlocks({ total, words }) {
  return (
    <div className="stat-blocks">
      <Block label="Results">
        <div className="big">{percent(total.rate)} <span className="muted">{words.good}</span></div>
        <div className="split-bar" aria-hidden="true"><i className="ok" style={{ flex: total.right }} /><i className="bad" style={{ flex: total.wrong }} /></div>
        <div className="muted">{total.attempts === 0 ? 'Nothing counted yet.' : <><span className="ok-text">{total.right} {words.good}</span> · <span className="bad-text">{total.wrong} {words.bad}</span></>}</div>
      </Block>
      <Block label="Progress">
        <div className="big">{total.solved} <span className="muted">/ {total.questions} solved</span></div>
        <div className="split-bar" aria-hidden="true"><i className="ok" style={{ flex: total.solved }} /><i style={{ flex: total.questions - total.solved }} /></div>
        <div className="muted">{[total.notYetRight && `${total.notYetRight} tried, never ${words.good}`, total.untried && `${total.untried} not tried yet`, total.difficult && `${total.difficult} marked difficult`].filter(Boolean).join(' · ') || 'Every question solved.'}</div>
      </Block>
      <Block label="Time">
        <div className="big">{formatDuration(total.avgMs)} <span className="muted">per attempt</span></div>
        <div className="muted">{total.timed === 0 ? 'Times are saved as you mark or run a question.' : `${formatDuration(total.totalMs)} over ${plural(total.timed, 'timed attempt')}.`}</div>
      </Block>
    </div>
  );
}

// What one question's time details say: the summary, then every attempt, oldest first.
function Attempts({ row, link, words }) {
  const sum = summariseTimes(row.times);
  return (
    <div className="attempts">
      {row.times.length === 0 ? (
        <p className="muted">No timed attempts yet. A time is saved each time you mark or run this question.</p>
      ) : (
        <>
          <p className="muted">{plural(sum.count, 'timed attempt')}: average {formatDuration(sum.avgMs)}, fastest {formatDuration(sum.bestMs)}, slowest {formatDuration(sum.worstMs)}.</p>
          <ol className="attempt-list">
            {row.times.map((t, i) => (
              <li key={t.id}>
                <span className="muted">Attempt {i + 1}</span>
                <span className={`chip ${t.result === 'right' ? 'ok' : 'bad'}`}>{t.result === 'right' ? words.good : words.bad}</span>
                <b>{formatDuration(t.ms)}</b>
                <span className="muted">{when(t.at)}{t.runId ? ' · in a session' : ''}</span>
              </li>
            ))}
          </ol>
        </>
      )}
      {link && <a href={link(row.uid)}>Open the question</a>}
    </div>
  );
}

// Rows of the per-question table. Clicking a question opens its time details. `section` adds the section's name, for the ranked list.
function QuestionTable({ rows, link, section, open, toggle, words }) {
  const columns = section ? 5 : 4;
  return (
    <table className="stats">
      <thead><tr><th className="l">Question</th>{section && <th className="l">Section</th>}<th>Results</th><th>Average time</th><th>Last check</th></tr></thead>
      <tbody>
        {rows.map((r) => {
          const isOpen = open.has(r.uid);
          return [
            <tr key={r.uid} className={r.attempts === 0 ? 'zero' : ''}>
              <td className="title l">
                <button type="button" className="row-toggle" aria-expanded={isOpen} onClick={() => toggle(r.uid)} title="Show the time of each attempt">
                  <span className="chev"><Icon name="chevron" /></span>{r.title}
                </button>
                {r.difficult && <span className="chip warn">difficult</span>}
              </td>
              {section && <td className="l muted">{r.section}</td>}
              <td>{r.attempts === 0 ? '–' : <><span className="rate"><i style={{ width: `${r.rate * 100}%` }} /></span>{r.right} {words.good} · {r.wrong} {words.short}</>}</td>
              <td>{formatDuration(r.avgMs)}</td>
              <td>{timeAgo(r.lastAt)}</td>
            </tr>,
            isOpen && <tr key={`${r.uid}/details`} className="detail"><td colSpan={columns} className="l"><Attempts row={r} link={link} words={words} /></td></tr>,
          ];
        })}
      </tbody>
    </table>
  );
}

// The questions, filtered and ranked by the sentence. rows: from questionRows; sections: from libraryStats (name, solved, questions, avgMs).
// link(uid) gives the address of a question to offer in its details, or is null when it has none.
export function QuestionStats({ rows: all, sections, link, words }) {
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('section');
  const [dir, setDir] = useState('desc');
  const [collapsed, setCollapsed] = useState({});
  const [open, setOpen] = useState(new Set());
  const context = filterContext(all);
  const rows = all.filter((r) => keepRow(filter, r, context));
  const toggle = (uid) => setOpen((s) => { const next = new Set(s); if (next.has(uid)) next.delete(uid); else next.add(uid); return next; });
  const grouped = sort === 'section';
  const tableProps = { link, open, toggle, words };
  return (
    <section>
      <div className="section-title"><h2>Questions</h2><span className="muted">{rows.length} of {all.length}</span></div>
      <div className="stat-sentence">
        <span>Display</span>
        <UnderlineSelect options={FILTER_OPTIONS} value={filter} onChange={setFilter} label="Which questions" />
        <span>questions, ranked by</span>
        <UnderlineSelect options={SORT_OPTIONS} value={sort} onChange={setSort} label="Ranked by" />
        {!grouped && (
          <button type="button" className="btn ghost sm" onClick={() => setDir(dir === 'desc' ? 'asc' : 'desc')}
            title={dir === 'desc' ? 'Highest first. Click for lowest first.' : 'Lowest first. Click for highest first.'}>
            <Icon name={dir === 'desc' ? 'arrowDown' : 'arrowUp'} /> {dir === 'desc' ? 'highest first' : 'lowest first'}
          </button>
        )}
      </div>
      {rows.length === 0 ? <div className="empty">No questions match.</div> : !grouped ? (
        <div className="card stat-cat"><div className="body"><QuestionTable rows={sortRows(rows, sort, dir)} section {...tableProps} /></div></div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {sections.map((s) => {
            const mine = rows.filter((r) => r.section === s.name);
            if (!mine.length) return null;
            const isOpen = !collapsed[s.name];
            return (
              <div key={s.name} className="card stat-cat">
                <button type="button" className="cat-head" aria-expanded={isOpen} onClick={() => setCollapsed({ ...collapsed, [s.name]: isOpen })}>
                  <span className="chev"><Icon name="chevron" /></span>
                  <span style={{ flex: 1 }}>{s.name}</span>
                  {s.avgMs !== null && <span className="chip">{formatDuration(s.avgMs)} average</span>}
                  <span className="chip">{s.solved} / {s.questions} solved</span>
                </button>
                {isOpen && <div className="body"><QuestionTable rows={mine} {...tableProps} /></div>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
