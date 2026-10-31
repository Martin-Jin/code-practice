// How long questions take, for imported sets. Pure, so it is unit tested; src/lib/practice.js keeps the data.
//
// A clock is one attempt's running time: { id, ms, point }. Inside a practice session the clocks live on the session
// (run.clocks, keyed by the question's id in the session), so a new session starts every question at zero; outside one the
// question's progress record holds a single clock (rec.clock). `point` names the data point (an entry of rec.times) that
// marking the question right or not right wrote for the attempt: the clock stops counting once it has one.
// rec.times is the history, one { id, at, ms, result, runId } per attempt, oldest first.

export const MAX_POINTS = 200;   // per question, so the history stays small; the oldest are dropped

export const newClock = (id) => ({ id, ms: 0, point: null });

// Has the attempt been marked? Resetting the stats forgets the points, which makes an old clock count again.
export const isDone = (rec, clock) => !!(clock && clock.point && rec && (rec.times || []).some((t) => t.id === clock.point));

// Writes (or, for an attempt already marked, changes) the data point for a clock. Marking again keeps one point per attempt.
// A point follows its clock's time until the clock is final. Coding questions pass finalWhen 'right': a run that fails does not
// end the attempt (the student keeps working), so each run updates the point until one passes, and that run stops the clock.
export function recordPoint(rec, clock, result, at, runId = null, finalWhen = null) {
  const times = rec.times || (rec.times = []);
  const old = clock.point && times.find((t) => t.id === clock.point);
  const wasFinal = !!clock.final;
  if (finalWhen && result === finalWhen) clock.final = true;
  if (old) {
    old.result = result;
    if (!wasFinal) old.ms = Math.round(clock.ms);
    return old;
  }
  const point = { id: clock.id, at, ms: Math.round(clock.ms), result, runId };
  times.push(point);
  clock.point = point.id;
  if (times.length > MAX_POINTS) times.splice(0, times.length - MAX_POINTS);
  return point;
}

// Takes the mark back: the attempt's point goes and its clock counts again.
export function dropPoint(rec, clock) {
  if (!clock || !clock.point) return;
  rec.times = (rec.times || []).filter((t) => t.id !== clock.point);
  clock.point = null;
  clock.final = false;
}

// A coding question's clock stops once a run has passed.
export const isFinal = (clock) => !!(clock && clock.final);

// Whole-second display: 4:07, or 1:02:09 from an hour up. Rounds down, as a stopwatch does.
export function formatDuration(ms) {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '–';
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

// { count, totalMs, avgMs, bestMs, worstMs } over a list of data points (avgMs and the rest are null with none).
export function summariseTimes(times) {
  const list = (times || []).filter((t) => Number.isFinite(t.ms));
  if (!list.length) return { count: 0, totalMs: 0, avgMs: null, bestMs: null, worstMs: null };
  const totalMs = list.reduce((a, t) => a + t.ms, 0);
  const all = list.map((t) => t.ms);
  return { count: list.length, totalMs, avgMs: totalMs / list.length, bestMs: Math.min(...all), worstMs: Math.max(...all) };
}

// A session's total: the running time of each of its questions' clocks, so resetting one takes it off the total.
export function runTotalMs(clocks) {
  return Object.values(clocks || {}).reduce((a, c) => a + (c && c.ms > 0 ? c.ms : 0), 0);
}
