import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBackup, buildShare, parseBackup, summarise, mergeStores, mergeSettings, totalAttempts, backupDue, backupFileName,
  VERSION, PLAIN_VERSION, DUE_AFTER_ATTEMPTS,
} from '../shared/backup.js';

const run = (id, updatedAt, extra = {}) => ({
  id, setId: 'course101', createdAt: '2026-01-01T00:00:00Z', updatedAt, questions: [1, 2], state: { 1: { code: 'a' }, 2: { code: 'b' } }, ...extra,
});
const qs = (attempts, lastAt, extra = {}) => ({ attempts, correct: 0, wrong: attempts, compileErrors: 0, crashes: 0, lastAt, firstSolvedAt: null, lastStatus: 'failed', ...extra });
const stats = (setId, questions, extra = {}) => ({ setId, questions, runsStarted: 1, runsCompleted: 0, since: '2026-01-01T00:00:00Z', ...extra });

const sample = () => buildBackup({
  stores: {
    runs: [run('r1', '2026-03-01T00:00:00Z'), run('r2', '2026-03-02T00:00:00Z', { completedAt: '2026-03-02T01:00:00Z' })],
    stats: [stats('course101', { 1: qs(3, '2026-03-01T00:00:00Z'), 2: qs(2, '2026-03-02T00:00:00Z') })],
  },
  settings: { theme: 'dark', runner: 'online' },
  now: new Date('2026-03-05T10:00:00Z'),
});

test('a backup survives a round trip through JSON text', () => {
  const b = sample();
  assert.equal(b.version, PLAIN_VERSION);
  const back = parseBackup(JSON.stringify(b));
  assert.deepEqual(back.stores, b.stores);
  assert.deepEqual(back.settings, b.settings);
  assert.equal(back.createdAt, '2026-03-05T10:00:00.000Z');
});

test('stores missing from the file load as empty', () => {
  const b = JSON.parse(JSON.stringify(sample()));
  delete b.stores.stats;
  assert.deepEqual(parseBackup(JSON.stringify(b)).stores.stats, []);
});

test('files that are not valid backups are refused with a reason', () => {
  const good = JSON.parse(JSON.stringify(sample()));
  const bad = (mutate) => { const b = JSON.parse(JSON.stringify(good)); mutate(b); return JSON.stringify(b); };
  assert.throws(() => parseBackup('not json'), /not valid JSON/);
  assert.throws(() => parseBackup('[]'), /not a Can'tviz quizzes backup/);
  assert.throws(() => parseBackup(bad((b) => { b.format = 'other'; })), /not a Can'tviz quizzes backup/);
  assert.throws(() => parseBackup(bad((b) => { b.version = VERSION + 1; })), /newer version/);
  assert.throws(() => parseBackup(bad((b) => { b.version = 'x'; })), /version/);
  assert.throws(() => parseBackup(bad((b) => { delete b.createdAt; })), /creation date/);
  assert.throws(() => parseBackup(bad((b) => { b.stores.runs = {}; })), /"runs" part/);
  assert.throws(() => parseBackup(bad((b) => { delete b.stores.runs[0].state; })), /Record 1 of "runs"/);
  assert.throws(() => parseBackup(bad((b) => { b.stores.runs[1].id = 'r1'; })), /twice/);
  assert.throws(() => parseBackup(bad((b) => { b.stores.stats[0].questions = 5; })), /Record 1 of "stats"/);
});

test('settings that are not strings are dropped', () => {
  const b = JSON.parse(JSON.stringify(sample()));
  b.settings.bad = 5;
  assert.deepEqual(Object.keys(parseBackup(JSON.stringify(b)).settings).sort(), ['runner', 'theme']);
});

test('library progress, edits, runs and own questions are backed up and merged by recency', () => {
  const progress = (key, updatedAt, extra = {}) => ({ key, setId: 's', uid: key.split('/')[1], answers: {}, difficult: false, updatedAt, ...extra });
  const stores = {
    libProgress: [progress('s/q1', '2026-03-01T00:00:00Z', { difficult: true })],
    libEdits: [{ key: 's/q1', setId: 's', uid: 'q1', parts: [], updatedAt: '2026-03-01T00:00:00Z' }],
    libRuns: [{ id: 'r', setId: 's', questions: ['q1'], updatedAt: '2026-03-01T00:00:00Z' }],
    libMine: [{ id: 'mine', manifest: {}, images: {}, updatedAt: '2026-03-01T00:00:00Z' }],
  };
  const b = parseBackup(JSON.stringify(buildBackup({ stores, settings: {} })));
  assert.deepEqual(b.stores.libProgress, stores.libProgress);
  assert.equal(summarise(b).libraryQuestions, 1);
  const merged = mergeStores({ libProgress: [progress('s/q1', '2026-03-09T00:00:00Z', { difficult: false })] }, stores);
  assert.equal(merged.libProgress[0].difficult, false, 'the newer record wins');
  assert.equal(merged.libEdits.length, 1);
  assert.equal(merged.libMine.length, 1);
  const bad = JSON.parse(JSON.stringify(buildBackup({ stores, settings: {} })));
  delete bad.stores.libProgress[0].answers;
  assert.throws(() => parseBackup(JSON.stringify(bad)), /Record 1 of "libProgress"/);
});

test('summary counts what a restore would bring in', () => {
  const s = summarise(sample());
  assert.equal(s.runs, 2);
  assert.equal(s.finishedRuns, 1);
  assert.deepEqual(s.sets, ['course101']);
  assert.equal(s.attempts, 5);
  assert.equal(s.settings, 2);
});

test('merge keeps the newer run and adds runs the browser does not have', () => {
  const current = { runs: [run('r1', '2026-03-09T00:00:00Z', { name: 'newer' })], stats: [] };
  const incoming = { runs: [run('r1', '2026-03-01T00:00:00Z', { name: 'older' }), run('r3', '2026-03-01T00:00:00Z')], stats: [] };
  const merged = mergeStores(current, incoming);
  assert.equal(merged.runs.find((r) => r.id === 'r1').name, 'newer');
  assert.deepEqual(merged.runs.map((r) => r.id).sort(), ['r1', 'r3']);
  const flipped = mergeStores({ runs: incoming.runs, stats: [] }, current);
  assert.equal(flipped.runs.find((r) => r.id === 'r1').name, 'newer');
});

test('merge takes each question’s newer counters and never adds them together', () => {
  const current = { runs: [], stats: [stats('s', { 1: qs(5, '2026-03-09T00:00:00Z'), 2: qs(1, '2026-03-01T00:00:00Z') }, { runsStarted: 2 })] };
  const incoming = { runs: [], stats: [stats('s', { 2: qs(4, '2026-03-05T00:00:00Z'), 3: qs(1, '2026-03-01T00:00:00Z') }, { runsStarted: 7, runsCompleted: 1, since: '2025-12-01T00:00:00Z' })] };
  const [m] = mergeStores(current, incoming).stats;
  assert.equal(m.questions[1].attempts, 5);
  assert.equal(m.questions[2].attempts, 4);
  assert.equal(m.questions[3].attempts, 1);
  assert.equal(m.runsStarted, 7);
  assert.equal(m.runsCompleted, 1);
  assert.equal(m.since, '2025-12-01T00:00:00Z');
});

test('restoring the same data twice changes nothing', () => {
  const b = sample();
  const once = mergeStores(b.stores, b.stores);
  assert.deepEqual(once, b.stores);
  assert.deepEqual(mergeStores(once, b.stores), once);
});

test('settings already in the browser win over the file', () => {
  assert.deepEqual(mergeSettings({ theme: 'light' }, { theme: 'dark', runner: 'online' }), { theme: 'light', runner: 'online' });
});

test('totalAttempts adds every question of every set', () => {
  assert.equal(totalAttempts([stats('a', { 1: qs(2, null) }), stats('b', { 1: qs(3, null), 2: qs(4, null) })]), 9);
  assert.equal(totalAttempts([]), 0);
});

test('a backup is due only after enough new attempts and enough time', () => {
  const now = new Date('2026-03-20T00:00:00Z');
  const few = DUE_AFTER_ATTEMPTS - 1;
  assert.equal(backupDue({ lastAt: null, attemptsNow: few, attemptsAtBackup: 0, now }), false);
  assert.equal(backupDue({ lastAt: null, attemptsNow: DUE_AFTER_ATTEMPTS, attemptsAtBackup: 0, now }), true);
  assert.equal(backupDue({ lastAt: '2026-03-19T00:00:00Z', attemptsNow: 500, attemptsAtBackup: 0, now }), false);
  assert.equal(backupDue({ lastAt: '2026-03-10T00:00:00Z', attemptsNow: 500, attemptsAtBackup: 0, now }), true);
  assert.equal(backupDue({ lastAt: '2026-03-10T00:00:00Z', attemptsNow: 510, attemptsAtBackup: 500, now }), false);
});

test('the file name carries the local date', () => {
  assert.equal(backupFileName(new Date(2026, 2, 5, 23, 59)), 'code-practice-backup-2026-03-05.json');
});

test("a backup carries only this app's settings, and ignores other apps' keys in a file it reads", () => {
  const b = buildBackup({ stores: {}, settings: { runner: 'local', theme: 'dark', solveAgentUrl: 'https://chat.example', 'collapsed:x': '1', 'taskflow:v1:tasks': '[]', 'firebase:authUser:abc': '{}', 'taskflow:v1:aiGeminiApiKey': 'k' } });
  assert.deepEqual(Object.keys(b.settings).sort(), ['collapsed:x', 'runner', 'solveAgentUrl', 'theme']);
  const raw = { ...b, settings: { ...b.settings, 'taskflow:v1:tasks': '[]', 'firebase:authUser:abc': '{}' } };
  assert.deepEqual(Object.keys(parseBackup(JSON.stringify(raw)).settings).sort(), ['collapsed:x', 'runner', 'solveAgentUrl', 'theme']);
});

test('a share file holds only the questions made in the app and their answer keys, and is marked as a share', () => {
  const stores = {
    libMine: [{ id: 'mine', manifest: { questions: [] }, images: {}, updatedAt: '2026-03-01T00:00:00Z' }],
    libEdits: [{ key: 'mine/q1', setId: 'mine', uid: 'q1', parts: [], updatedAt: '2026-03-01T00:00:00Z' }, { key: 'pdf/q9', setId: 'pdf', uid: 'q9', parts: [], updatedAt: '2026-03-01T00:00:00Z' }],
    libProgress: [{ key: 'mine/q1', setId: 'mine', uid: 'q1', answers: {}, updatedAt: '2026-03-01T00:00:00Z' }],
    runs: [{ id: 'r', setId: 's', questions: [], state: {}, updatedAt: '2026-03-01T00:00:00Z' }],
  };
  const file = buildShare({ stores });
  assert.equal(file.kind, 'share');
  assert.deepEqual(file.settings, {});
  const parsed = parseBackup(JSON.stringify(file));
  assert.equal(parsed.kind, 'share');
  assert.equal(parsed.stores.libMine.length, 1);
  assert.deepEqual(parsed.stores.libEdits.map((r) => r.key), ['mine/q1']);
  assert.equal(parsed.stores.libProgress.length, 0);
  assert.equal(parsed.stores.runs.length, 0);
  assert.equal(parseBackup(JSON.stringify(buildBackup({ stores: {}, settings: {} }))).kind, 'backup');
});

test('a backup with imported sets is version 2, parses, and one with a damaged set is refused', () => {
  const library = { sets: [{ id: 'pdf', title: 'PDF', manifest: { questions: [] }, files: { 'a.pdf': { size: 1, modified: 1 } } }], formulas: [{ setId: 'pdf', sheets: [] }] };
  const file = buildBackup({ stores: {}, settings: {}, library });
  assert.equal(file.version, VERSION);
  assert.equal(file.includesFiles, true);
  const parsed = parseBackup(JSON.stringify(file));
  assert.equal(parsed.library.length, 1);
  assert.equal(summarise(parsed).librarySets, 1);
  assert.throws(() => parseBackup(JSON.stringify({ ...file, library: [{ id: 'x' }] })), /imported sets/);
  assert.equal(parseBackup(JSON.stringify(buildBackup({ stores: {}, settings: {} }))).library.length, 0);
  const share = buildShare({ stores: { libMine: [] }, library });
  assert.equal(share.kind, 'share');
  assert.equal(share.library.length, 1);
});
