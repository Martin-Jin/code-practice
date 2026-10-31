import { useEffect, useReducer, useRef } from 'react';
import { openClock, getClock, clockDone, addTime, resetClock, runTotal } from '../lib/practice.js';
import { isPaused, togglePause, enterContext, onPauseChange, pageActive } from '../lib/timer.js';
import { formatDuration } from '../../shared/timing.js';
import Icon from './Icon.jsx';

// The timer note: time on this question and, in a practice session, the session's total. It counts while the question is open
// and the window is showing and focused, stops when the question is marked (the time is saved with that attempt), and clicking
// either time pauses every timer. Imported sets show it as a standing note at the bottom right, where the
// formula sheets cover it; the coding run shows it inline in its top bar (`inline`).
//
// `identity` names the question (the clocks restart when it changes) and `pauseKey` the session or context the pause belongs
// to. `source` supplies the data: open(), read() -> { ms, done }, add(ms) -> whether the time counted, reset(), and
// total() -> ms or null; `frozen` stops counting (a finished session being reviewed).
export default function Timer({ identity, pauseKey, source, frozen = false, inline = false }) {
  const [, redraw] = useReducer((n) => n + 1, 0);
  const latest = useRef(source);
  latest.current = source;

  useEffect(() => {
    enterContext(pauseKey);
    latest.current.open();
    redraw();
    return onPauseChange(redraw);
  }, [identity, pauseKey]);

  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const t = performance.now();
      const dt = t - last;
      last = t;
      if (frozen || isPaused(pauseKey) || !pageActive() || dt > 1500) return;
      if (latest.current.add(dt)) redraw();
    }, 250);
    return () => clearInterval(id);
  }, [identity, pauseKey, frozen]);

  const { ms, done } = source.read();
  const total = source.total();
  const paused = isPaused(pauseKey);
  const state = done ? 'check' : paused ? 'pause' : null;
  const hint = done ? 'Marked: this time is saved. Click to pause every timer.' : paused ? 'Paused. Click to carry on.' : 'Click to pause every timer.';

  return (
    <div className={`timer${inline ? ' inline' : ''}${paused ? ' paused' : ''}${done ? ' done' : ''}`} role="group" aria-label="Timers">
      {state && <span className="timer-state" title={done ? 'Marked' : 'Paused'}><Icon name={state} /></span>}
      <button type="button" className="timer-read" aria-pressed={paused} title={hint} onClick={() => togglePause(pauseKey)}>
        <span className="timer-label">This question</span>
        <span className="timer-time" role="timer">{formatDuration(ms)}</span>
      </button>
      {total !== null && (
        <button type="button" className="timer-read" aria-pressed={paused} title={hint} onClick={() => togglePause(pauseKey)}>
          <span className="timer-label">Total</span>
          <span className="timer-time" role="timer">{formatDuration(total)}</span>
        </button>
      )}
      <button type="button" className="timer-reset" disabled={ms === 0 && !done} title="Reset this question's timer (it comes off the total)" aria-label="Reset this question's timer"
        onClick={() => source.reset()}><Icon name="refresh" /></button>
    </div>
  );
}

// The timer of an imported-set question. `uid` is the question's id here (in a session, its id in the session);
// `recordSetId`/`recordUid` name its progress record.
export function QuestionTimer({ recordSetId, recordUid, uid, run }) {
  const runId = run ? run.id : null;
  const source = {
    open: () => openClock(recordSetId, recordUid, runId, uid),
    read: () => { const clock = getClock(recordSetId, recordUid, runId, uid); return { ms: clock ? clock.ms : 0, done: clockDone(recordSetId, recordUid, runId, uid) }; },
    add: (ms) => addTime(recordSetId, recordUid, runId, uid, ms),
    reset: () => resetClock(recordSetId, recordUid, runId, uid),
    total: () => (run ? runTotal(run) : null),
  };
  return <Timer identity={`${recordSetId}/${recordUid}/${runId}/${uid}`} pauseKey={runId || 'solo'} source={source} frozen={!!(run && run.completedAt)} />;
}
