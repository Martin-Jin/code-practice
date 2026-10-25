import test from 'node:test';
import assert from 'node:assert/strict';
import { partOfDay, pickGreeting, HELLOS, MESSAGES } from '../shared/greetings.js';

test('the part of the day changes at 5, 12, 17 and 22', () => {
  const expected = { 0: 'night', 4: 'night', 5: 'morning', 11: 'morning', 12: 'afternoon', 16: 'afternoon', 17: 'evening', 21: 'evening', 22: 'night', 23: 'night' };
  for (const [hour, part] of Object.entries(expected)) assert.equal(partOfDay(Number(hour)), part, `hour ${hour}`);
});

test('every hour of the day has a hello and every message is a distinct sentence', () => {
  for (let hour = 0; hour < 24; hour++) {
    const { hello, message } = pickGreeting(new Date(2026, 0, 1, hour), () => 0);
    assert.ok(hello && message, `hour ${hour}`);
    assert.ok(HELLOS[partOfDay(hour)].includes(hello));
  }
  assert.equal(new Set(MESSAGES).size, MESSAGES.length);
  assert.ok(MESSAGES.every((m) => m.length > 10 && /[.?]$/.test(m)));
});

test('the pick follows the random number and never runs off the end of a list', () => {
  const morning = new Date(2026, 0, 1, 8);
  assert.deepEqual(pickGreeting(morning, () => 0), { hello: HELLOS.morning[0], message: MESSAGES[0] });
  const last = pickGreeting(morning, () => 0.999999);
  assert.equal(last.hello, HELLOS.morning[HELLOS.morning.length - 1]);
  assert.equal(last.message, MESSAGES[MESSAGES.length - 1]);
});

test('over many draws every message turns up', () => {
  const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(pickGreeting(new Date(2026, 0, 1, 9)).message);
  assert.equal(seen.size, MESSAGES.length);
});
