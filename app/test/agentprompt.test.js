import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const doc = (name) => readFileSync(fileURLToPath(new URL(`../../docs/${name}`, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');
const prompt = doc('practice-pdf-agent-prompt.md');
const layout = doc('practice-pdf-prompt.md').split('\n## The layout\n')[1].split('\n## Check it')[0].trim();

test('the agent prompt carries the whole layout the indexer reads, word for word', () => {
  const lines = layout.split('\n').filter((l) => l.trim() && !l.startsWith('**Do not reword'));
  assert.ok(lines.length > 8);
  for (const line of lines) assert.ok(prompt.includes(line.trim()), `missing from the prompt: ${line.slice(0, 60)}`);
});

test('the prompt makes the agent ask first, build, check, record answer keys and walk the user through importing', () => {
  for (const marker of ['Do NOT start building', 'What material do I want turned into questions', 'Step 3: Check it', 'Step 4: Answer keys', 'walk me through adding it', 'Add or update a folder']) {
    assert.ok(prompt.includes(marker), marker);
  }
});

test('the prompt is self-contained: it names no file the user would not have', () => {
  assert.ok(!/practice-pdf-prompt\.md/.test(prompt.replace(/docs\/question-set-format\.md/g, '')), 'it must not send the agent to a doc it cannot open');
  assert.ok(prompt.length < 12000, 'short enough to paste into any agent');
});
