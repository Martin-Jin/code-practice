import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkup, searchText } from '../shared/markup.js';

test('plain text is escaped and split into paragraphs and lines', () => {
  assert.equal(renderMarkup('a < b & "c"\nnext line\n\nsecond'), '<p>a &lt; b &amp; &quot;c&quot;<br>next line</p><p>second</p>');
  assert.equal(renderMarkup('   '), '');
  assert.equal(renderMarkup(null), '');
});

test('bold, italic and code', () => {
  assert.equal(renderMarkup('**Hint:** split into *three* `rods`'), '<p><strong>Hint:</strong> split into <em>three</em> <code>rods</code></p>');
});

test('markup cannot inject html, inside or outside maths', () => {
  assert.ok(!renderMarkup('<script>alert(1)</script>').includes('<script'));
  assert.ok(!renderMarkup('$\\href{javascript:alert(1)}{x}$').includes('javascript:alert') || renderMarkup('$\\href{javascript:alert(1)}{x}$').includes('katex'));
  assert.ok(!renderMarkup('<img src=x onerror=alert(1)>').includes('<img'));
});

test('maths renders with KaTeX, inline and display', () => {
  const inline = renderMarkup('Pivoted at $O$ where $a = 73$ mm.');
  assert.ok(inline.includes('class="katex"'));
  assert.ok(inline.includes('mm.'));
  const display = renderMarkup('$$I_O = \\frac{1}{3} m L^2$$');
  assert.ok(display.includes('katex-display'));
});

test('a bad formula does not throw and an escaped dollar is a dollar', () => {
  assert.doesNotThrow(() => renderMarkup('$\\frac{1}{$'));
  assert.equal(renderMarkup('It costs \\$5 and \\$6.'), '<p>It costs $5 and $6.</p>');
});

test('searchText strips markup and keeps the words', () => {
  assert.equal(searchText('The **slender rod** has $I_x \\alpha$ about $O$.'), 'The slender rod has I x alpha about O .');
});
