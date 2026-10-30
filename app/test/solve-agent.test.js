import test from 'node:test';
import assert from 'node:assert/strict';
import { CLAUDE_DESKTOP_URL, DEFAULT_AGENT_URL, formatSolvePrompt, normaliseAgentUrl } from '../shared/solve-agent.js';

const question = {
  title: 'Find the acceleration',
  source: 'Quiz 2, Q4',
  marks: 3,
  stem: { text: 'A cart travels $12\\,\\mathrm{m}$. Find its acceleration.' },
  parts: [
    { label: 'a', type: 'numeric', prompt: 'Show your method.', unit: 'm/s^2', answer: 42 },
    { label: 'b', type: 'mcq', prompt: 'Choose a direction.', options: ['left', 'right'], correct: [1] },
  ],
  solution: { text: 'Do not include this reference answer.' },
};

test('agent URLs must be HTTPS and cannot contain credentials', () => {
  assert.equal(normaliseAgentUrl('https://chat.example/chat'), 'https://chat.example/chat');
  assert.equal(normaliseAgentUrl('  https://chat.example  '), 'https://chat.example/');
  assert.equal(normaliseAgentUrl('http://chat.example'), null);
  assert.equal(normaliseAgentUrl('javascript:alert(1)'), null);
  assert.equal(normaliseAgentUrl('https://user:pass@chat.example'), null);
  assert.equal(DEFAULT_AGENT_URL, 'https://claude.ai/new');
  assert.equal(CLAUDE_DESKTOP_URL, 'claude://');
});

test('the prompt includes the question and saved work but not the reference solution', () => {
  const prompt = formatSolvePrompt({
    set: { title: 'Physics revision' },
    question,
    answers: { a: '12', b: [0] },
    notes: 'I used v squared equals u squared plus 2as.',
  });
  assert.match(prompt, /Physics revision/);
  assert.match(prompt, /A cart travels/);
  assert.match(prompt, /Show your method/);
  assert.match(prompt, /My current answer: 12 m\/s\^2/);
  assert.match(prompt, /My current answer: left/);
  assert.match(prompt, /I used v squared/);
  assert.match(prompt, /ask me to share my working/);
  assert.doesNotMatch(prompt, /Do not include this reference answer/);
  assert.doesNotMatch(prompt, /correct:|42/);
});

test('the prompt explicitly asks for working when the user has not supplied any', () => {
  const prompt = formatSolvePrompt({ set: { title: 'Revision' }, question, answers: { a: '12' } });
  assert.match(prompt, /even if I have entered a final answer/);
  assert.match(prompt, /\(No working or notes provided\.\)/);
});
